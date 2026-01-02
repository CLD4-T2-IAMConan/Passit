# Data Module Variables

# ============================================
# Common Variables
# ============================================

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "passit"
}

variable "environment" {
  description = "Environment name (dev, prod, dr)"
  type        = string
  default     = "dev"
}

variable "region" {
  description = "AWS Region"
  type        = string
  default     = "ap-northeast-2"
}

variable "team" {
  description = "Team name for tagging"
  type        = string
  default     = "Data"
}

variable "owner" {
  description = "Owner name for tagging"
  type        = string
  default     = "Admin"
}

# ============================================
# Network Configuration
# ============================================

variable "vpc_id" {
  description = "VPC ID for data resources"
  type        = string
}

variable "private_db_subnet_ids" {
  description = "Private DB subnet IDs for Aurora and ElastiCache"
  type        = list(string)
}

variable "rds_security_group_id" {
  description = "Security Group ID for RDS"
  type        = string
}

variable "elasticache_security_group_id" {
  description = "Security Group ID for ElastiCache"
  type        = string
}

# ============================================
# Existing Resources (Optional)
# ============================================

variable "existing_db_subnet_group_name" {
  description = "Existing DB subnet group name (if empty, will create new one)"
  type        = string
  default     = ""
}

variable "existing_rds_parameter_group_name" {
  description = "Existing RDS cluster parameter group name (if empty, will create new one)"
  type        = string
  default     = ""
}

variable "existing_elasticache_subnet_group_name" {
  description = "Existing ElastiCache subnet group name (if empty, will create new one)"
  type        = string
  default     = ""
}

variable "existing_elasticache_parameter_group_name" {
  description = "Existing ElastiCache parameter group name (if empty, will create new one)"
  type        = string
  default     = ""
}

# ============================================
# Aurora RDS Configuration
# ============================================
variable "rds_master_username" {
  description = "RDS master username (used if db_secret_name is not provided)"
  type        = string
  default     = "admin"
}

variable "rds_master_password" {
  description = "RDS master password (used if db_secret_name is not provided)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "rds_database_name" {
  description = "RDS database name (used if db_secret_name is not provided)"
  type        = string
  default     = "passit"
}

variable "db_secret_name" {
  description = "Secrets Manager secret name for DB credentials (e.g., 'passit/prod/db'). If empty, use rds_master_username/password variables"
  type        = string
  default     = ""
}

variable "create_passit_user" {
  description = "Whether to automatically create passit_user in RDS"
  type        = bool
  default     = true
}

variable "passit_user_name" {
  description = "Username for passit_user (default: passit_user)"
  type        = string
  default     = "passit_user"
}

variable "passit_user_password" {
  description = "Password for passit_user (should match Secrets Manager if using db_secret_name)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "bastion_instance_id" {
  description = "Bastion Host Instance ID for RDS access (required if create_passit_user is true)"
  type        = string
  default     = ""
}

variable "rds_instance_class" {
  description = "Instance class for Prod (e.g., db.t3.medium)"
  type        = string
  default     = "db.t3.medium"
}

variable "rds_serverless_min_acu" {
  type    = number
  default = 0.5
}

variable "rds_serverless_max_acu" {
  type    = number
  default = 2.0
}

variable "eks_worker_security_group_id" {
  description = "EKS 노드 보안 그룹 ID (DB 접근 허용용)"
  type        = string
}

# ============================================
# ElastiCache (Valkey) Configuration
# ============================================

variable "valkey_engine_version" {
  description = "Valkey engine version"
  type        = string
  default     = "8.0"
}

variable "valkey_node_type" {
  description = "Node type for node-based cache (e.g., cache.t4g.micro, cache.t4g.small)"
  type        = string
  default     = "cache.t4g.micro"
}

variable "valkey_num_cache_nodes" {
  description = "Number of cache nodes in the replication group (typically 1 for dev, can be increased for prod)"
  type        = number
  default     = 1
}

variable "valkey_storage_limit" {
  description = "[Deprecated for node-based cache] Data storage limit in GB - not used for node-based cache (node type determines storage)"
  type        = number
  default     = 1
}

variable "valkey_ecpu_limits" {
  description = "[Deprecated for node-based cache] ECPU limits per second - not used for node-based cache (node type determines performance)"
  type = object({
    min = number
    max = number
  })
  default = {
    min = 1000
    max = 5000
  }
}

variable "valkey_snapshot_retention_limit" {
  description = "Number of days to retain snapshots (prod: 3, dev: 0)"
  type        = number
  default     = 0
}

variable "valkey_snapshot_window" {
  description = "Daily time range for snapshots (UTC). For KST 03:00-04:00, use 18:00-19:00 UTC"
  type        = string
  default     = "18:00-19:00" # 03:00-04:00 KST
}

variable "valkey_kms_key_id" {
  description = "KMS key ID for ElastiCache encryption"
  type        = string
  default     = ""
}

# ============================================
# S3 Configuration
# ============================================

variable "s3_buckets" {
  description = "List of S3 buckets to create"
  type = list(object({
    name               = string
    versioning_enabled = bool
    lifecycle_rules = optional(list(object({
      id      = string
      enabled = bool
      prefix  = optional(string, null)
      transitions = optional(list(object({
        days          = number
        storage_class = string
      })), [])
      expiration_days = optional(number, null)
    })), [])
  }))
  default = [
    {
      name               = "uploads"
      versioning_enabled = false
      lifecycle_rules = [
        {
          id            = "temp-files-cleanup"
          enabled       = true
          prefix        = "temp/"
          expiration_days = 7
        }
      ]
    },
    {
      name               = "logs"
      versioning_enabled = true
      lifecycle_rules = [
        {
          id      = "logs-lifecycle"
          enabled = true
          transitions = [
            {
              days          = 30
              storage_class = "STANDARD_IA"
            },
            {
              days          = 90
              storage_class = "GLACIER"
            }
          ]
          expiration_days = null
        }
      ]
    },
    {
      name               = "backup"
      versioning_enabled = true
      lifecycle_rules    = []
    }
  ]
}

variable "s3_kms_key_id" {
  description = "KMS key ID for S3 encryption"
  type        = string
  default     = ""
}

# DR 환경에서 RDS 생성을 생략하기 위한 변수
variable "enable_rds" {
  description = "RDS를 생성할지 여부"
  type        = bool
  default     = true
}

variable "global_cluster_id" {
  description = "ID of the Aurora Global Cluster"
  type        = string
  default     = null # 중요: 값을 안 주면 일반 DB로 동작하게 함
}

variable "is_dr_region" {
  description = "현재 배포 리전이 DR(Secondary) 리전인지 여부"
  type        = bool
  default     = false
}