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
# Aurora RDS Configuration - 예진님 여기 작성해주세용!
# ============================================


# ============================================
# ElastiCache (Valkey) Configuration
# ============================================

variable "valkey_engine_version" {
  description = "Valkey engine version"
  type        = string
  default     = "8.0"
}

variable "valkey_node_type" {
  description = "Node type for node-based cache (optional for serverless)"
  type        = string
  default     = "cache.t4g.micro"
}

variable "valkey_storage_limit" {
  description = "Data storage limit in GB (prod: 10, dev: 1)"
  type        = number
  default     = 1
}

variable "valkey_ecpu_limits" {
  description = "ECPU limits per second (prod: { min = 10000, max = 100000 }, dev: { min = 1000, max = 5000 })"
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
  description = "Daily time range for snapshots (UTC)"
  type        = string
  default     = "19:00-20:00" # 04:00-05:00 KST
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
      lifecycle_rules    = []
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
