# ElastiCache (Valkey) Configuration

# Common Tags and Locals
locals {
  common_tags = {
    Project = var.project_name
    Team    = var.team
    Env     = var.environment
    Owner   = var.owner
  }

  is_prod           = var.environment == "prod"
  valkey_cluster_id = "${var.project_name}-${var.environment}-valkey"
}

# ============================================
# ElastiCache Subnet Group (기존 리소스 또는 새로 생성)
# ============================================
# 주의: data source가 실패하면 Terraform이 중단되므로,
# existing_elasticache_subnet_group_name이 설정되어 있어도 항상 새로 생성합니다.
# 
# 해결 방법:
# 1. 리소스가 없으면: existing_elasticache_subnet_group_name을 빈 문자열("")로 설정
# 2. 리소스가 있으면: terraform import를 사용하여 기존 리소스를 import
#
# 현재는 리소스가 없을 때를 대비하여 항상 새로 생성하도록 설정합니다.
# 기존 리소스를 사용하려면 terraform import를 사용하세요.

# 기존 Subnet Group 조회 시도 (optional)
# 주의: 리소스가 존재하지 않으면 Terraform이 실패합니다.
# 리소스가 확실히 존재하는 경우에만 사용하세요.
# 리소스가 없으면 existing_elasticache_subnet_group_name을 빈 문자열로 설정하세요.
# 
# 현재는 주석 처리하여 항상 새로 생성하도록 합니다.
# 기존 리소스를 사용하려면 주석을 해제하고 terraform import를 사용하세요.
# data "aws_elasticache_subnet_group" "existing" {
#   count = var.existing_elasticache_subnet_group_name != "" ? 1 : 0
#   name  = var.existing_elasticache_subnet_group_name
# }

resource "aws_elasticache_subnet_group" "valkey" {
  # 항상 새로 생성 (기존 리소스가 있으면 import 필요)
  name       = "${var.project_name}-${var.environment}-valkey-subnet-group"
  subnet_ids = var.private_db_subnet_ids

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment}-valkey-subnet-group"
    }
  )
}

locals {
  # 항상 새로 생성한 Subnet Group 사용
  # 기존 리소스를 사용하려면 terraform import를 사용하세요.
  elasticache_subnet_group_name = aws_elasticache_subnet_group.valkey.name
}

# ============================================
# ElastiCache Parameter Group (기존 리소스 또는 새로 생성)
# ============================================
# Note: ElastiCache parameter group은 data source가 없으므로,
# 기존 리소스가 있으면 변수로 이름만 받아서 사용하고, 없으면 새로 생성

resource "aws_elasticache_parameter_group" "valkey" {
  count = var.existing_elasticache_parameter_group_name != "" ? 0 : 1
  name   = "${var.project_name}-${var.environment}-valkey-pg"
  family = "valkey8"

  # LRU eviction policy
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment}-valkey-pg"
    }
  )
}

locals {
  elasticache_parameter_group_name = var.existing_elasticache_parameter_group_name != "" ? var.existing_elasticache_parameter_group_name : aws_elasticache_parameter_group.valkey[0].name
}

# ============================================
# ElastiCache Replication Group (Node-based Cache)
# ============================================

resource "aws_elasticache_replication_group" "valkey" {
  replication_group_id       = local.valkey_cluster_id
  description                = "Valkey node-based cache for ${var.environment} environment"
  
  # Engine Configuration
  engine               = "valkey"
  engine_version       = var.valkey_engine_version
  parameter_group_name = local.elasticache_parameter_group_name

  # Node Configuration
  node_type                  = var.valkey_node_type
  num_cache_clusters         = var.valkey_num_cache_nodes
  port                       = 6379

  # Network Configuration
  subnet_group_name  = local.elasticache_subnet_group_name
  security_group_ids = [var.elasticache_security_group_id]

  # Backup Configuration
  snapshot_retention_limit = var.valkey_snapshot_retention_limit
  snapshot_window         = local.is_prod ? var.valkey_snapshot_window : null
  automatic_failover_enabled = false # Single node for dev, can be enabled for prod with multiple nodes

  # Encryption
  at_rest_encryption_enabled = var.valkey_kms_key_id != "" ? true : false
  kms_key_id                 = var.valkey_kms_key_id != "" ? var.valkey_kms_key_id : null
  transit_encryption_enabled = false # Can be enabled if needed

  # Maintenance
  maintenance_window = "sun:05:00-sun:06:00" # UTC, can be adjusted

  # 변경사항을 즉시 적용하지 않음 (다음 maintenance window에 적용)
  apply_immediately = false

  tags = merge(
    local.common_tags,
    {
      Name = local.valkey_cluster_id
    }
  )

  # 불필요한 재생성 방지
  lifecycle {
    # KMS key ID는 ARN과 키 ID 형식이 다르게 인식되어 재생성 방지
    ignore_changes = [
      tags,
      kms_key_id,  # ARN과 키 ID 형식 차이로 인한 재생성 방지
    ]
    # 데이터 손실 방지 (필요시 true로 변경)
    prevent_destroy = false
  }
}

# ============================================
# Valkey Connection Secret (Secrets Manager)
# ============================================

resource "aws_secretsmanager_secret" "valkey" {
  name                    = "${var.project_name}/${var.environment}/valkey/connection"
  description             = "Valkey connection information for ${var.environment}"
  recovery_window_in_days = 0

  tags = merge(
    local.common_tags,
    {
      Name    = "${var.project_name}-${var.environment}-valkey-secret"
      Purpose = "Valkey connection credentials"
    }
  )
}

resource "aws_secretsmanager_secret_version" "valkey" {
  secret_id = aws_secretsmanager_secret.valkey.id
  secret_string = jsonencode({
    engine         = "valkey"
    primary_endpoint = aws_elasticache_replication_group.valkey.primary_endpoint_address
    port           = aws_elasticache_replication_group.valkey.port
    reader_endpoint = aws_elasticache_replication_group.valkey.reader_endpoint_address
    configuration_endpoint = aws_elasticache_replication_group.valkey.configuration_endpoint_address
  })
}
