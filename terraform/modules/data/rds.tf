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

  # 알려주신 Secret Key와 정확히 일치시켜야 함
  master_username = local.db_creds["DB_USER"]
  master_password = local.db_creds["DB_PASSWORD"]
  database_name   = local.db_creds["DB_NAME"] # 'passit'이 자동으로 생성됨

  db_subnet_group_name            = local.db_subnet_group_name
  vpc_security_group_ids          = [var.rds_security_group_id]
  db_cluster_parameter_group_name = local.rds_parameter_group_name

  # 설계안: 백업 및 삭제 보호 설정 (환경별 분기)
  backup_retention_period = var.environment == "prod" ? 7 : 1
  preferred_backup_window = "03:00-04:00"
  deletion_protection     = var.environment == "prod" ? true : false
  skip_final_snapshot     = var.environment == "prod" ? false : true

  # Dev 환경 전용: Serverless v2 스케일링 설정
  dynamic "serverlessv2_scaling_configuration" {
    for_each = var.environment == "dev" ? [1] : []
    content {
      min_capacity = var.rds_serverless_min_acu
      max_capacity = var.rds_serverless_max_acu
    }
  }

  tags = { Name = "${var.project_name}-${var.environment}-aurora-cluster" }
}

# 2. 클러스터 인스턴스 (노드 생성)
resource "aws_rds_cluster_instance" "main" {
  # Prod는 Writer+Reader(2개), Dev는 Writer(1개)
  count = var.environment == "prod" ? 2 : 1

  identifier         = "${var.project_name}-${var.environment}-db-${count.index}"
  cluster_identifier = aws_rds_cluster.main.id
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  # 설계안: Prod는 t3.medium, Dev는 Serverless v2
  instance_class       = var.environment == "prod" ? "db.t3.medium" : "db.serverless"
  db_subnet_group_name = local.db_subnet_group_name

  publicly_accessible = false

  tags = { Name = "${var.project_name}-${var.environment}-db-${count.index}" }
}