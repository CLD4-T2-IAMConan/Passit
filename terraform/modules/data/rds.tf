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
  rds_parameter_group_name = var.enable_rds ? (
      var.existing_rds_parameter_group_name != "" ?
      data.aws_rds_cluster_parameter_group.existing[0].name :
      aws_rds_cluster_parameter_group.main[0].name
    ) : "" # false일 때는 빈 문자열 반환
}



resource "aws_rds_cluster" "main" {
  count              = var.enable_rds ? 1 : 0
  cluster_identifier = "${var.project_name}-${var.environment}-aurora-cluster"

  # Global Cluster 연결
  global_cluster_identifier = var.global_cluster_id

  engine             = "aurora-mysql"
  engine_version     = "8.0.mysql_aurora.3.08.2"

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
  deletion_protection     = var.environment == "prod" ? true : false
  skip_final_snapshot     = true

  tags = { Name = "${var.project_name}-${var.environment}-aurora-cluster" }
}

# 4. 클러스터 인스턴스 (노드 생성)
resource "aws_rds_cluster_instance" "main" {
  count = var.enable_rds ? (var.environment == "prod" ? 2 : 1) : 0

  identifier         = "${var.project_name}-${var.environment}-db-${count.index}"
  cluster_identifier = aws_rds_cluster.main[0].id
  engine             = aws_rds_cluster.main[0].engine
  engine_version     = aws_rds_cluster.main[0].engine_version

  instance_class       = var.rds_instance_class
  db_subnet_group_name = local.db_subnet_group_name
  publicly_accessible  = false

  tags = { Name = "${var.project_name}-${var.environment}-db-${count.index}" }
}

# 5. passit_user 자동 생성 (서울 리전에서만 실행)
resource "null_resource" "create_passit_user" {
  # 🚨 DR 리전이 아니고(is_dr_region = false), 생성 옵션이 켜져 있을 때만 실행
  count = (var.enable_rds && !var.is_dr_region && var.create_passit_user && var.passit_user_password != "") ? 1 : 0

  depends_on = [
    aws_rds_cluster.main,
    aws_rds_cluster_instance.main
  ]

  triggers = {
    cluster_endpoint = aws_rds_cluster.main[0].endpoint
    db_name         = local.db_creds["DB_NAME"]
    user_name       = var.passit_user_name
    user_password   = var.passit_user_password
    secret_version  = var.db_secret_name != "" ? data.aws_secretsmanager_secret_version.db_secret_version[0].version_id : "manual"
  }

  provisioner "local-exec" {
    command = <<-EOT
      set -e
      BASTION_ID="${var.bastion_instance_id}"
      RDS_ENDPOINT="${aws_rds_cluster.main[0].endpoint}"
      DB_NAME="${local.db_creds["DB_NAME"]}"
      MASTER_USER="${local.db_creds["DB_USER"]}"
      MASTER_PASSWORD="${local.db_creds["DB_PASSWORD"]}"
      PASSIT_USER="${var.passit_user_name}"
      PASSIT_PASSWORD="${var.passit_user_password}"
      REGION="${var.region}"

      LOCAL_PORT=13306
      aws ssm start-session \
        --target "$BASTION_ID" \
        --document-name AWS-StartPortForwardingSession \
        --parameters "{\"portNumber\":[\"3306\"],\"localPortNumber\":[\"$LOCAL_PORT\"]}" \
        --region "$REGION" > /dev/null 2>&1 &

      SSM_PID=$!
      sleep 8

      mysql -h 127.0.0.1 -P $LOCAL_PORT -u "$MASTER_USER" -p"$MASTER_PASSWORD" <<SQL || {
        kill $SSM_PID 2>/dev/null || true
        exit 1
      }
        CREATE USER IF NOT EXISTS '$PASSIT_USER'@'%' IDENTIFIED BY '$PASSIT_PASSWORD';
        GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$PASSIT_USER'@'%';
        FLUSH PRIVILEGES;
      SQL

      kill $SSM_PID 2>/dev/null || true
    EOT

    environment = { AWS_REGION = var.region }
  }
}