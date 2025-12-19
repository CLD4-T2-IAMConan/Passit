# RDS Configuration
# 1. DB 서브넷 그룹 (에러 2번 해결)
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-rds-subnet-group"
  subnet_ids = var.private_db_subnet_ids

  tags = { Name = "${var.project_name}-${var.environment}-rds-subnet-group" }
}

# 1. 시크릿 불러오기 (이전과 동일)
data "aws_secretsmanager_secret" "db_secret" {
  name = "passit/${var.environment}/db"
}

data "aws_secretsmanager_secret_version" "db_secret_version" {
  secret_id = data.aws_secretsmanager_secret.db_secret.id
}

# 2. 알려주신 Key 이름에 맞춰 파싱 (대문자 주의)
locals {
  db_creds = jsondecode(data.aws_secretsmanager_secret_version.db_secret_version.secret_string)
}

# 2. 파라미터 그룹 (에러 3번 해결)
resource "aws_rds_cluster_parameter_group" "main" {
  name        = "${var.project_name}-${var.environment}-aurora-pg-v2"
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

# 1. Aurora 클러스터 본체
resource "aws_rds_cluster" "main" {
  cluster_identifier = "${var.project_name}-${var.environment}-aurora-cluster"
  engine             = "aurora-mysql"
  engine_version     = "8.0.mysql_aurora.3.08.2"

  master_username = local.db_creds["DB_USER"]
  master_password = local.db_creds["DB_PASSWORD"]
  database_name   = local.db_creds["DB_NAME"]

  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = [var.rds_security_group_id]
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.main.name

  backup_retention_period = var.environment == "prod" ? 7 : 1
  preferred_backup_window = "03:00-04:00"
  deletion_protection     = var.environment == "prod" ? true : false
  skip_final_snapshot     = var.environment == "prod" ? false : true

  # [수정] Serverless 설정을 사용하지 않으므로 이 블록은 삭제
  # dynamic "serverlessv2_scaling_configuration" {
  #   for_each = var.environment == "dev" ? [1] : []
  #   content {
  #     min_capacity = var.rds_serverless_min_acu
  #     max_capacity = var.rds_serverless_max_acu
  #   }
  # }

  tags = { Name = "${var.project_name}-${var.environment}-aurora-cluster" }
}

# 2. 클러스터 인스턴스 (노드 생성)
resource "aws_rds_cluster_instance" "main" {
  count = var.environment == "prod" ? 2 : 1

  identifier         = "${var.project_name}-${var.environment}-db-${count.index}"
  cluster_identifier = aws_rds_cluster.main.id
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  # [수정] dev/prod 관계없이 t3.medium을 사용... 변수에서 가져오도록 설정
  instance_class       = var.rds_instance_class
  db_subnet_group_name = aws_db_subnet_group.main.name

  publicly_accessible = false

  tags = { Name = "${var.project_name}-${var.environment}-db-${count.index}" }
}