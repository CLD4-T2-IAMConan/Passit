# RDS Configuration
# 1. DB 서브넷 그룹 (기존 리소스 또는 새로 생성)
data "aws_db_subnet_group" "existing" {
  count = var.existing_db_subnet_group_name != "" ? 1 : 0
  name  = var.existing_db_subnet_group_name
}

resource "aws_db_subnet_group" "main" {
  count      = var.enable_rds && var.existing_db_subnet_group_name == "" ? 1 : 0
  name       = "${var.project_name}-${var.environment}-rds-subnet-group"
  subnet_ids = var.private_db_subnet_ids

  tags = { Name = "${var.project_name}-${var.environment}-rds-subnet-group" }

  lifecycle {
    # RDS 클러스터가 삭제된 후에만 서브넷 그룹 삭제 가능
    # 클러스터가 존재하는 동안은 삭제 방지
    create_before_destroy = false
  }
}

locals {
  db_subnet_group_name = var.enable_rds ? (var.existing_db_subnet_group_name != "" ? data.aws_db_subnet_group.existing[0].name : aws_db_subnet_group.main[0].name) : ""
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
  count       = (var.enable_rds && var.existing_rds_parameter_group_name == "") ? 1 : 0
  name        = "${var.project_name}-${var.environment}-aurora-pg-2"
  family      = "aurora-mysql8.0"
  description = "Aurora cluster parameter group"

  # prevent_destroy는 제거: terraform destroy도 막기 때문에
  # DR 리전에서 enable_rds가 false로 변경될 때 리소스 삭제가 필요할 수 있음
  # 대신 RDS 클러스터의 deletion_protection으로 보호 (prod 환경)
  lifecycle {
    prevent_destroy = false
  }

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
  rds_parameter_group_name = var.enable_rds ? (
    var.existing_rds_parameter_group_name != "" ?
    data.aws_rds_cluster_parameter_group.existing[0].name :
    aws_rds_cluster_parameter_group.main[0].name
  ) : "" # false일 때는 빈 문자열 반환
}

# 1. Aurora 클러스터 본체
resource "aws_rds_cluster" "main" {
  count              = var.enable_rds ? 1 : 0
  cluster_identifier = "${var.project_name}-${var.environment}-aurora-cluster"

  # Global Cluster 연결
  # 처음 배포 시: global_cluster_id = "" (또는 null)로 설정하여 일반 클러스터로 생성
  # 이후 Global Cluster 연결 시: 
  #   1. AWS 콘솔에서 수동으로 Global Cluster에 연결
  #   2. terraform import로 기존 클러스터를 state에 추가
  #   3. global_cluster_id 변수를 설정하고 ignore_changes로 이후 변경 무시
  global_cluster_identifier = var.global_cluster_id != "" && var.global_cluster_id != null ? var.global_cluster_id : null

  lifecycle {
    # Global Cluster 연결은 AWS 콘솔에서 수동으로 수행 후 ignore_changes로 유지
    # 처음 배포 시: global_cluster_id = null (일반 클러스터)
    # 이후 Global Cluster 연결 후: ignore_changes로 변경 무시
    ignore_changes = [global_cluster_identifier]
    # prevent_destroy는 제거: terraform destroy도 막기 때문에
    # 대신 deletion_protection으로 보호 (prod 환경)
  }

  engine         = "aurora-mysql"
  engine_version = "8.0.mysql_aurora.3.08.2"

  # Secondary 리전(DR)일 경우 자격 증명을 전송하지 않음 (서울에서 상속)
  master_username = var.is_dr_region ? null : local.db_creds["DB_USER"]
  master_password = var.is_dr_region ? null : local.db_creds["DB_PASSWORD"]
  database_name   = var.is_dr_region ? null : local.db_creds["DB_NAME"]

  db_subnet_group_name            = local.db_subnet_group_name
  vpc_security_group_ids          = [var.rds_security_group_id]
  db_cluster_parameter_group_name = local.rds_parameter_group_name

  # Secondary는 백업 권한이 없으므로 최소치 설정
  backup_retention_period = var.is_dr_region ? 1 : (var.environment == "prod" ? 7 : 1)
  preferred_backup_window = "03:00-04:00"
  deletion_protection     = var.rds_deletion_protection != null ? var.rds_deletion_protection : (var.environment == "prod" ? true : false)  # 변수로 제어 가능, 기본값은 환경에 따라 설정
  skip_final_snapshot     = true  # destroy 시 스냅샷 없이 삭제 (자동 백업은 backup_retention_period로 관리)

  tags = {
    Name = var.is_dr_region ? "${var.project_name}-dr-aurora-cluster" : "${var.project_name}-${var.environment}-aurora-cluster"
  }
}

# 4. 클러스터 인스턴스 (노드 생성)
resource "aws_rds_cluster_instance" "main" {
  count = var.enable_rds ? (var.environment == "prod" ? 2 : 1) : 0

  identifier         = var.is_dr_region ? "${var.project_name}-dr-db-${count.index}" : "${var.project_name}-${var.environment}-db-${count.index}"
  cluster_identifier = aws_rds_cluster.main[0].id
  engine             = aws_rds_cluster.main[0].engine
  engine_version     = aws_rds_cluster.main[0].engine_version

  instance_class       = var.rds_instance_class
  db_subnet_group_name = local.db_subnet_group_name
  publicly_accessible  = false

  # lifecycle prevent_destroy는 제거: terraform destroy도 막기 때문에
  # deletion_protection이 클러스터 레벨에서 보호함

  tags = { Name = var.is_dr_region ? "${var.project_name}-dr-db-${count.index}" : "${var.project_name}-${var.environment}-db-${count.index}" }
}

# 5. passit_user 자동 생성 (서울 리전에서만 실행)
resource "null_resource" "create_passit_user" {
  # count = (var.enable_rds && !var.is_dr_region && var.create_passit_user && var.passit_user_password != "") ? 1 : 0
  count = 0  # passit_user 이미 생성됨 - 재생성 방지

  depends_on = [
    aws_rds_cluster.main,
    aws_rds_cluster_instance.main
  ]

  triggers = {
    cluster_endpoint = aws_rds_cluster.main[0].endpoint
    db_name          = local.db_creds["DB_NAME"]
    user_name        = var.passit_user_name
    user_password    = var.passit_user_password
    secret_version   = var.db_secret_name != "" ? data.aws_secretsmanager_secret_version.db_secret_version[0].version_id : "manual"
  }

  provisioner "local-exec" {
    interpreter = ["bash", "-c"]
    command     = <<-EOT
      set -e

      BASTION_ID="${var.bastion_instance_id}"
      RDS_ENDPOINT="${try(aws_rds_cluster.main[0].endpoint, "")}"
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

      # 기존 SSM 세션이 있으면 종료
      pkill -f "aws ssm start-session.*$LOCAL_PORT" 2>/dev/null || true
      sleep 2

      # SSM 세션 시작 (에러 확인을 위해 stderr는 보관)
      SSM_LOG=$(mktemp)
      aws ssm start-session \
        --target "$BASTION_ID" \
        --document-name AWS-StartPortForwardingSessionToRemoteHost \
        --parameters "{\"host\":[\"$RDS_ENDPOINT\"],\"portNumber\":[\"3306\"],\"localPortNumber\":[\"$LOCAL_PORT\"]}" \
        --region "$REGION" > /dev/null 2>"$SSM_LOG" &

      SSM_PID=$!
      echo "   포트 포워딩 시작 (PID: $SSM_PID)"

      # SSM 세션이 시작될 때까지 대기 (최대 30초)
      for i in {1..30}; do
        if ps -p $SSM_PID > /dev/null 2>&1; then
          # 프로세스가 살아있으면 포트 확인
          if nc -z 127.0.0.1 $LOCAL_PORT 2>/dev/null; then
            echo "   ✅ 포트 포워딩 연결 성공"
            rm -f "$SSM_LOG"
            break
          fi
        else
          # 프로세스가 죽었으면 에러 확인
          echo "   ❌ SSM 세션 시작 실패"
          cat "$SSM_LOG" 2>/dev/null || true
          rm -f "$SSM_LOG"
          exit 1
        fi
        echo "   연결 대기 중... ($i/30)"
        sleep 1
      done

      # 최종 포트 확인
      if ! nc -z 127.0.0.1 $LOCAL_PORT 2>/dev/null; then
        echo "   ❌ 포트 포워딩 실패 (30초 타임아웃)"
        cat "$SSM_LOG" 2>/dev/null || true
        kill $SSM_PID 2>/dev/null || true
        rm -f "$SSM_LOG"
        exit 1
      fi

      rm -f "$SSM_LOG"

      # MySQL 명령을 임시 파일로 작성
      SQL_FILE=$(mktemp)
      cat > "$SQL_FILE" <<SQL
      CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`;
      CREATE USER IF NOT EXISTS '$PASSIT_USER'@'%' IDENTIFIED BY '$PASSIT_PASSWORD';
      GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$PASSIT_USER'@'%';
      FLUSH PRIVILEGES;
      SHOW GRANTS FOR '$PASSIT_USER'@'%';
      SELECT User, Host FROM mysql.user WHERE User = '$PASSIT_USER';
SQL

      # MySQL 명령 실행
      if ! mysql -h 127.0.0.1 -P $LOCAL_PORT -u "$MASTER_USER" -p"$MASTER_PASSWORD" < "$SQL_FILE" 2>&1; then
        echo "❌ MySQL 명령 실행 실패"
        rm -f "$SQL_FILE"
        kill $SSM_PID 2>/dev/null || true
        exit 1
      fi

      # 임시 파일 정리
      rm -f "$SQL_FILE"

      echo "✅ passit_user 생성 완료!"

      # SSM 세션 종료
      kill $SSM_PID 2>/dev/null || true
    EOT

    environment = {
      AWS_REGION = var.region
    }
  }
}

data "aws_kms_alias" "rds_default" {
  count = var.enable_rds_dr ? 1 : 0
  # 도쿄 리전용 프로바이더가 적용된 모듈에서 호출되므로 해당 리전의 기본 키를 찾습니다.
  name = "alias/passit-rds-dr"
}