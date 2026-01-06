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
# ElastiCache Subnet Group
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

# 기존 Subnet Group 조회 (있는 경우)
data "aws_elasticache_subnet_group" "existing" {
  count = (var.create_elasticache && var.existing_elasticache_subnet_group_name != "") ? 1 : 0
  name  = var.existing_elasticache_subnet_group_name
}

# 새 Subnet Group 생성 (없는 경우)
resource "aws_elasticache_subnet_group" "valkey" {
  count      = (var.create_elasticache && var.existing_elasticache_subnet_group_name == "") ? 1 : 0
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
  # 리소스가 생성되지 않을 때(false) 에러를 방지하기 위해 try 처리
  elasticache_subnet_group_name = var.create_elasticache ? (
    var.existing_elasticache_subnet_group_name != "" ? data.aws_elasticache_subnet_group.existing[0].name : aws_elasticache_subnet_group.valkey[0].name
  ) : ""
}

# ============================================
# ElastiCache Parameter Group
# ============================================

resource "aws_elasticache_parameter_group" "valkey" {
  count  = (var.create_elasticache && var.existing_elasticache_parameter_group_name == "") ? 1 : 0
  name   = "${var.project_name}-${var.environment}-valkey-pg"
  family = "valkey8"

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
  elasticache_parameter_group_name = var.create_elasticache ? (
    var.existing_elasticache_parameter_group_name != "" ? var.existing_elasticache_parameter_group_name : aws_elasticache_parameter_group.valkey[0].name
  ) : ""
}

# ============================================
# ElastiCache Replication Group (Node-based Cache)
# ============================================

resource "aws_elasticache_replication_group" "valkey" {
  count = var.create_elasticache ? 1 : 0

  replication_group_id       = local.valkey_cluster_id
  description                = "Valkey node-based cache for ${var.environment} environment"

  engine               = "valkey"
  engine_version       = var.valkey_engine_version
  parameter_group_name = local.elasticache_parameter_group_name

  node_type                  = var.valkey_node_type
  num_cache_clusters         = var.valkey_num_cache_nodes
  port                       = 6379

  subnet_group_name  = local.elasticache_subnet_group_name
  security_group_ids = [var.elasticache_security_group_id]

  snapshot_retention_limit = var.valkey_snapshot_retention_limit
  snapshot_window         = local.is_prod ? var.valkey_snapshot_window : null
  automatic_failover_enabled = false

  at_rest_encryption_enabled = var.valkey_kms_key_id != "" ? true : false
  kms_key_id                 = var.valkey_kms_key_id != "" ? var.valkey_kms_key_id : null
  transit_encryption_enabled = false

  maintenance_window = "sun:05:00-sun:06:00"

  tags = merge(
    local.common_tags,
    {
      Name = local.valkey_cluster_id
    }
  )
}

# ============================================
# Valkey Connection Secret (Secrets Manager)
# ============================================

resource "aws_secretsmanager_secret" "valkey" {
  count = var.create_elasticache ? 1 : 0

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
  count     = var.create_elasticache ? 1 : 0
  secret_id = aws_secretsmanager_secret.valkey[0].id
  secret_string = jsonencode({
    engine         = "valkey"
    primary_endpoint = aws_elasticache_replication_group.valkey[0].primary_endpoint_address
    port           = aws_elasticache_replication_group.valkey[0].port
    reader_endpoint = aws_elasticache_replication_group.valkey[0].reader_endpoint_address
    configuration_endpoint = aws_elasticache_replication_group.valkey[0].configuration_endpoint_address
  })
}