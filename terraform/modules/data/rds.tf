# RDS Configuration
# 1. DB 서브넷 그룹 (기존 리소스 또는 새로 생성)
data "aws_db_subnet_group" "existing" {
  count = var.existing_db_subnet_group_name != "" ? 1 : 0
  name  = var.existing_db_subnet_group_name
}

resource "aws_db_subnet_group" "main" {
  count      = var.existing_db_subnet_group_name != "" ? 0 : 1
  name       = "${var.project_name}-${var.environment}-rds-subnet-group"
  subnet_ids = var.private_db_subnet_ids

  tags = { Name = "${var.project_name}-${var.environment}-rds-subnet-group" }
}

locals {
  db_subnet_group_name = var.existing_db_subnet_group_name != "" ? data.aws_db_subnet_group.existing[0].name : aws_db_subnet_group.main[0].name
}

# 1. 시크릿 불러오기 (optional - 시크릿이 있으면 사용, 없으면 변수 사용)
data "aws_secretsmanager_secret" "db_secret" {
  count = var.db_secret_name != "" ? 1 : 0
  name  = var.db_secret_name
}

data "aws_secretsmanager_secret_version" "db_secret_version" {
  count     = var.db_secret_name != "" ? 1 : 0
  secret_id = data.aws_secretsmanager_secret.db_secret[0].id
}

# 2. DB 자격 증명 (시크릿이 있으면 시크릿에서, 없으면 변수에서)
locals {
  db_creds = var.db_secret_name != "" ? jsondecode(data.aws_secretsmanager_secret_version.db_secret_version[0].secret_string) : {
    DB_USER     = var.rds_master_username
    DB_PASSWORD = var.rds_master_password
    DB_NAME     = var.rds_database_name
  }
}

# 2. 파라미터 그룹 (기존 리소스 또는 새로 생성)
data "aws_rds_cluster_parameter_group" "existing" {
  count = var.existing_rds_parameter_group_name != "" ? 1 : 0
  name  = var.existing_rds_parameter_group_name
}

resource "aws_rds_cluster_parameter_group" "main" {
  count       = var.existing_rds_parameter_group_name != "" ? 0 : 1
  name        = "${var.project_name}-${var.environment}-aurora-pg"
  family      = "aurora-mysql8.0"
  description = "Aurora cluster parameter group"

  parameter {
    name  = "time_zone"
    value = "Asia/Seoul"
  }

  parameter {
    name  = "character_set_server"
    value = "utf8mb4"
  }
}

locals {
  rds_parameter_group_name = var.existing_rds_parameter_group_name != "" ? data.aws_rds_cluster_parameter_group.existing[0].name : aws_rds_cluster_parameter_group.main[0].name
}

# 1. Aurora 클러스터 본체
resource "aws_rds_cluster" "main" {
  cluster_identifier = "${var.project_name}-${var.environment}-aurora-cluster"
  engine             = "aurora-mysql"
  engine_version     = "8.0.mysql_aurora.3.08.2"

  master_username = local.db_creds["DB_USER"]
  master_password = local.db_creds["DB_PASSWORD"]
  database_name   = local.db_creds["DB_NAME"]

  db_subnet_group_name            = local.db_subnet_group_name
  vpc_security_group_ids          = [var.rds_security_group_id]
  db_cluster_parameter_group_name = local.rds_parameter_group_name

  backup_retention_period = var.environment == "prod" ? 7 : 1
  preferred_backup_window = "03:00-04:00"
  deletion_protection     = false
  # Destroy 시 스냅샷 없이 삭제 (필요시 수동으로 스냅샷 생성 후 삭제)
  skip_final_snapshot     = true

  tags = { Name = "${var.project_name}-${var.environment}-aurora-cluster" }
}

# 2. 클러스터 인스턴스 (노드 생성)
resource "aws_rds_cluster_instance" "main" {
  count = var.environment == "prod" ? 2 : 1

  identifier         = "${var.project_name}-${var.environment}-db-${count.index}"
  cluster_identifier = aws_rds_cluster.main.id
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  # RDS 인스턴스 클래스는 변수에서 가져오기
  instance_class       = var.rds_instance_class
  db_subnet_group_name = local.db_subnet_group_name

  publicly_accessible = false

  tags = { Name = "${var.project_name}-${var.environment}-db-${count.index}" }
}

# 3. passit_user 자동 생성 (Bastion Host를 통해)
resource "null_resource" "create_passit_user" {
  count = var.create_passit_user && var.passit_user_password != "" ? 1 : 0

  depends_on = [
    aws_rds_cluster.main,
    aws_rds_cluster_instance.main
  ]

  triggers = {
    cluster_endpoint = aws_rds_cluster.main.endpoint
    db_name         = local.db_creds["DB_NAME"]
    user_name       = var.passit_user_name
    user_password   = var.passit_user_password
    # Secrets Manager에서 가져온 경우 secret version이 변경되면 재실행
    secret_version  = var.db_secret_name != "" ? data.aws_secretsmanager_secret_version.db_secret_version[0].version_id : "manual"
  }

  provisioner "local-exec" {
    command = <<-EOT
      set -e
      
      BASTION_ID="${var.bastion_instance_id}"
      RDS_ENDPOINT="${aws_rds_cluster.main.endpoint}"
      DB_NAME="${local.db_creds["DB_NAME"]}"
      MASTER_USER="${local.db_creds["DB_USER"]}"
      MASTER_PASSWORD="${local.db_creds["DB_PASSWORD"]}"
      PASSIT_USER="${var.passit_user_name}"
      PASSIT_PASSWORD="${var.passit_user_password}"
      REGION="${var.region}"
      
      # MySQL 클라이언트 확인
      if ! command -v mysql &> /dev/null; then
        echo "❌ MySQL 클라이언트가 설치되어 있지 않습니다."
        echo "   macOS: brew install mysql-client"
        echo "   Ubuntu: sudo apt-get install mysql-client"
        exit 1
      fi
      
      echo "📋 RDS에 passit_user 생성 중..."
      echo "   Endpoint: $RDS_ENDPOINT"
      echo "   Database: $DB_NAME"
      echo "   User: $PASSIT_USER"
      
      # Session Manager를 통한 포트 포워딩 (백그라운드)
      LOCAL_PORT=13306
      aws ssm start-session \
        --target "$BASTION_ID" \
        --document-name AWS-StartPortForwardingSessionToRemoteHost \
        --parameters "{\"host\":[\"$RDS_ENDPOINT\"],\"portNumber\":[\"3306\"],\"localPortNumber\":[\"$LOCAL_PORT\"]}" \
        --region "$REGION" > /dev/null 2>&1 &
      
      SSM_PID=$!
      echo "   포트 포워딩 시작 (PID: $SSM_PID)"
      sleep 15

      # 포트가 열릴 때까지 대기
      for i in {1..10}; do
        nc -z 127.0.0.1 $LOCAL_PORT && break
        echo "   연결 대기 중... ($i/10)"
        sleep 2
      done
      
      # MySQL 명령 실행
      mysql -h 127.0.0.1 -P $LOCAL_PORT -u "$MASTER_USER" -p"$MASTER_PASSWORD" <<SQL || {
        echo "❌ MySQL 명령 실행 실패"
        kill $SSM_PID 2>/dev/null || true
        exit 1
      }
      -- 데이터베이스 생성 (없으면)
      CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`;
      
      -- 사용자 생성 (없으면)
      CREATE USER IF NOT EXISTS '$PASSIT_USER'@'%' IDENTIFIED BY '$PASSIT_PASSWORD';
      
      -- 모든 권한 부여
      GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$PASSIT_USER'@'%';
      
      -- 권한 즉시 적용
      FLUSH PRIVILEGES;
      
      -- 확인
      SHOW GRANTS FOR '$PASSIT_USER'@'%';
      SELECT User, Host FROM mysql.user WHERE User = '$PASSIT_USER';
SQL
      
      echo "✅ passit_user 생성 완료!"
      
      # SSM 세션 종료
      kill $SSM_PID 2>/dev/null || true
      sleep 1
    EOT

    environment = {
      AWS_REGION = var.region
    }
  }
}