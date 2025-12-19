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

# 1. Aurora 클러스터 본체
resource "aws_rds_cluster" "main" {
  cluster_identifier = "${var.project_name}-${var.environment}-aurora-cluster"
  engine             = "aurora-mysql"
  engine_version     = "8.0.mysql_aurora.3.08.2"

  # 알려주신 Secret Key와 정확히 일치시켜야 함
  master_username = local.db_creds["DB_USER"]
  master_password = local.db_creds["DB_PASSWORD"]
  database_name   = local.db_creds["DB_NAME"] # 'passit'이 자동으로 생성됨

  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = [var.rds_security_group_id]
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.main.name

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
  db_subnet_group_name = aws_db_subnet_group.main.name

  publicly_accessible = false

  tags = { Name = "${var.project_name}-${var.environment}-db-${count.index}" }
}