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
# ElastiCache Subnet Group (자동 감지)
# ============================================
# Subnet Group 존재 여부를 자동으로 확인하고, 있으면 기존 것 사용, 없으면 새로 생성

data "external" "check_elasticache_subnet_group" {
  count = var.enable_elasticache ? 1 : 0
  program = ["bash", "-c", <<-EOT
    GROUP_NAME="${var.project_name}-${var.environment}-valkey-subnet-group"
    REGION="${var.region}"
    
    # AWS CLI로 Subnet Group 존재 여부 확인
    if aws elasticache describe-cache-subnet-groups \
      --cache-subnet-group-name "$GROUP_NAME" \
      --region "$REGION" \
      --query 'CacheSubnetGroups[0].CacheSubnetGroupName' \
      --output text 2>/dev/null | grep -q "$GROUP_NAME"; then
      echo "{\"exists\":\"true\",\"name\":\"$GROUP_NAME\"}"
    else
      echo "{\"exists\":\"false\",\"name\":\"\"}"
    fi
  EOT
  ]
}

locals {
  elasticache_subnet_group_exists = var.enable_elasticache && length(data.external.check_elasticache_subnet_group) > 0 ? (
    data.external.check_elasticache_subnet_group[0].result.exists == "true"
  ) : false
  existing_elasticache_subnet_group_name = local.elasticache_subnet_group_exists ? (
    data.external.check_elasticache_subnet_group[0].result.name
  ) : ""
}

# 기존 Subnet Group 조회 (있는 경우)
data "aws_elasticache_subnet_group" "existing" {
  count = local.elasticache_subnet_group_exists ? 1 : 0
  name  = local.existing_elasticache_subnet_group_name
}

# 새 Subnet Group 생성 (없는 경우)
resource "aws_elasticache_subnet_group" "valkey" {
  count      = var.enable_elasticache && !local.elasticache_subnet_group_exists ? 1 : 0
  name       = "${var.project_name}-${var.environment}-valkey-subnet-group"
  subnet_ids = var.private_db_subnet_ids

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment}-valkey-subnet-group"
    }
  )

  lifecycle {
    # ElastiCache Replication Group이 삭제된 후에만 서브넷 그룹 삭제 가능
    # 클러스터가 존재하는 동안은 삭제 방지
    create_before_destroy = false
  }
}

locals {
  # 기존 리소스가 있으면 기존 것 사용, 없으면 새로 생성한 것 사용
  elasticache_subnet_group_name = var.enable_elasticache ? (
    local.elasticache_subnet_group_exists ? data.aws_elasticache_subnet_group.existing[0].name : (
      length(aws_elasticache_subnet_group.valkey) > 0 ? aws_elasticache_subnet_group.valkey[0].name : ""
    )
  ) : ""
}

# ============================================
# ElastiCache Parameter Group (자동 감지)
# ============================================
# Parameter Group 존재 여부를 자동으로 확인하고, 있으면 기존 것 사용, 없으면 새로 생성

data "external" "check_elasticache_parameter_group" {
  count = var.enable_elasticache ? 1 : 0
  program = ["bash", "-c", <<-EOT
    GROUP_NAME="${var.project_name}-${var.environment}-valkey-pg"
    REGION="${var.region}"
    
    # AWS CLI로 Parameter Group 존재 여부 확인
    if aws elasticache describe-cache-parameter-groups \
      --cache-parameter-group-name "$GROUP_NAME" \
      --region "$REGION" \
      --query 'CacheParameterGroups[0].CacheParameterGroupName' \
      --output text 2>/dev/null | grep -q "$GROUP_NAME"; then
      echo "{\"exists\":\"true\",\"name\":\"$GROUP_NAME\"}"
    else
      echo "{\"exists\":\"false\",\"name\":\"\"}"
    fi
  EOT
  ]
}

locals {
  elasticache_parameter_group_exists = var.enable_elasticache && length(data.external.check_elasticache_parameter_group) > 0 ? (
    data.external.check_elasticache_parameter_group[0].result.exists == "true"
  ) : false
  existing_elasticache_parameter_group_name = local.elasticache_parameter_group_exists ? (
    data.external.check_elasticache_parameter_group[0].result.name
  ) : ""
}

resource "aws_elasticache_parameter_group" "valkey" {
  count = var.enable_elasticache && !local.elasticache_parameter_group_exists ? 1 : 0
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

  lifecycle {
    # ElastiCache Replication Group이 삭제된 후에만 파라미터 그룹 삭제 가능
    # 클러스터가 존재하는 동안은 삭제 방지
    create_before_destroy = false
  }
}

locals {
  elasticache_parameter_group_name = var.enable_elasticache ? (
    local.elasticache_parameter_group_exists ? local.existing_elasticache_parameter_group_name : (
      length(aws_elasticache_parameter_group.valkey) > 0 ? aws_elasticache_parameter_group.valkey[0].name : ""
    )
  ) : ""
}

# ============================================
# ElastiCache Replication Group (Node-based Cache)
# ============================================

resource "aws_elasticache_replication_group" "valkey" {
  count                      = var.enable_elasticache ? 1 : 0
  replication_group_id       = local.valkey_cluster_id
  description                = "Valkey node-based cache for ${var.environment} environment"

  # Engine Configuration
  engine               = "valkey"
  engine_version       = var.valkey_engine_version
  parameter_group_name = local.elasticache_parameter_group_name

  # Node Configuration
  node_type          = var.valkey_node_type
  num_cache_clusters = var.valkey_num_cache_nodes
  port               = 6379

  # Network Configuration
  subnet_group_name  = local.elasticache_subnet_group_name
  security_group_ids = [var.elasticache_security_group_id]

  # Backup Configuration
  snapshot_retention_limit   = var.valkey_snapshot_retention_limit
  snapshot_window            = local.is_prod ? var.valkey_snapshot_window : null
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
      kms_key_id, # ARN과 키 ID 형식 차이로 인한 재생성 방지
    ]
    # 데이터 손실 방지 (필요시 true로 변경)
    prevent_destroy = false
  }
}

# ============================================
# Valkey Connection Secret (Secrets Manager)
# ============================================

resource "aws_secretsmanager_secret" "valkey" {
  count                   = var.enable_elasticache ? 1 : 0
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
  count     = var.enable_elasticache ? 1 : 0
  secret_id = aws_secretsmanager_secret.valkey[0].id
  secret_string = jsonencode({
    engine                 = "valkey"
    primary_endpoint       = aws_elasticache_replication_group.valkey[0].primary_endpoint_address
    port                   = aws_elasticache_replication_group.valkey[0].port
    reader_endpoint        = aws_elasticache_replication_group.valkey[0].reader_endpoint_address
    configuration_endpoint = aws_elasticache_replication_group.valkey[0].configuration_endpoint_address
  })
}
