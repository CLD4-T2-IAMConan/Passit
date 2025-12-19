# ============================================
# Common / Global Variables
# ============================================
variable "account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
}

variable "environment" {
  description = "Environment name (prod)"
  type        = string
  default     = "prod"
}

variable "region" {
  description = "AWS Region"
  type        = string
  default     = "ap-northeast-2"
}

variable "team" {
  description = "Owning team name"
  type        = string
}

variable "owner" {
  description = "Owner name"
  type        = string
}

# ============================================
# Network Module Variables
# ============================================
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.1.0.0/16" # Dev(10.0.0.0/16)와 겹치지 않게 설정
}

variable "availability_zones" {
  description = "Availability zones for subnets"
  type        = list(string)
  default     = ["ap-northeast-2a", "ap-northeast-2c"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private app subnets (EKS용)"
  type        = list(string)
}

variable "private_db_subnet_cidrs" {
  description = "CIDR blocks for private db subnets (RDS, ElastiCache용)"
  type        = list(string)
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway (Prod는 고가용성을 위해 false 권장)"
  type        = bool
  default     = false # 각 AZ마다 NAT를 생성하여 장애 전파 방지
}

# ============================================
# EKS Module Variables
# ============================================
variable "cluster_name" {
  description = "EKS Cluster name"
  type        = string
}

variable "cluster_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.31" # dev와 동일하게 맞추는 것이 관리상 유리
}

variable "node_instance_types" {
  description = "EC2 instance types for EKS nodes"
  type        = list(string)
}

variable "capacity_type" {
  description = "Type of capacity (Prod는 안정적인 ON_DEMAND 권장)"
  type        = string
}

variable "node_min_size" {
  type = number
}

variable "node_desired_size" {
  type = number
}

variable "node_max_size" {
  type = number
}

# ============================================
# Security Module Variables
# ============================================
variable "allowed_cidr_blocks" {
  description = "Allowed CIDR blocks for external access"
  type        = list(string)
}

variable "rds_security_group_id" {
  description = "The ID of the RDS security group"
  type        = string
  default     = ""
}

variable "elasticache_security_group_id" {
  description = "The ID of the ElastiCache security group"
  type        = string
  default     = ""
}

# ============================================
# Data Module (RDS / Valkey) Variables
# ============================================
variable "rds_instance_class" {
  description = "Instance class for RDS (e.g., db.t3.medium)"
  type        = string
  default     = "db.t3.medium"
}

# Prod에서 사용하지 않더라도 모듈 호환성을 위해 선언 유지
variable "rds_serverless_min_acu" {
  description = "Minimum Aurora Capacity Unit"
  type        = number
  default     = 0.5
}

variable "rds_serverless_max_acu" {
  description = "Maximum Aurora Capacity Unit"
  type        = number
  default     = 2.0
}

variable "valkey_storage_limit" {
  description = "Storage limit for Valkey in GB"
  type        = number
  default     = 5
}

variable "valkey_ecpu_limit" {
  description = "ECPU limit for Valkey Serverless"
  type        = number
  default     = 5000
}