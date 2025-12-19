# Network Module Variables
variable "account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, prod, dr)"
  type        = string
}

variable "region" {
  description = "AWS Region"
  type        = string
  default     = "ap-northeast-2"
}

variable "team" {
  description = "Team name"
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
}

variable "availability_zones" {
  description = "Availability zones for subnets"
  type        = list(string)
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
  description = "Use single NAT Gateway for cost optimization (dev environment)"
  type        = bool
  default     = true
}

variable "use_existing_vpc" {
  description = "Use existing VPC instead of creating a new one"
  type        = bool
  default     = false  # Dev는 기본적으로 새 VPC 생성
}

variable "existing_vpc_id" {
  description = "Existing VPC ID (required if use_existing_vpc is true)"
  type        = string
  default     = ""
}

variable "existing_public_subnet_ids" {
  description = "Existing public subnet IDs (required if use_existing_vpc is true)"
  type        = list(string)
  default     = []
}

variable "existing_private_subnet_ids" {
  description = "Existing private app subnet IDs (required if use_existing_vpc is true)"
  type        = list(string)
  default     = []
}

variable "existing_private_db_subnet_ids" {
  description = "Existing private db subnet IDs (required if use_existing_vpc is true)"
  type        = list(string)
  default     = []
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
}

# Node Group Settings
variable "node_instance_types" {
  description = "EC2 instance types for EKS nodes"
  type        = list(string)
}

variable "capacity_type" {
  description = "Type of capacity for EKS nodes (ON_DEMAND or SPOT)"
  type        = string
}

variable "node_min_size" {
  description = "Minimum number of nodes"
  type        = number
}

variable "node_desired_size" {
  description = "Desired number of nodes"
  type        = number
}

variable "node_max_size" {
  description = "Maximum number of nodes"
  type        = number
}

# ============================================
# Security Module Variables
# ============================================

variable "allowed_cidr_blocks" {
  description = "Allowed CIDR blocks for external access (ALB)"
  type        = list(string)
}

variable "eks_cluster_name" {
  description = "Existing EKS cluster name (if cluster already exists, use this instead of creating new one)"
  type        = string
  default     = ""
}

# Optional - Data Module용 (기존 리소스 ID)
variable "rds_security_group_id" {
  description = "RDS Security Group ID (required for data module when using existing resources)"
  type        = string
  default     = ""
}

variable "elasticache_security_group_id" {
  description = "ElastiCache Security Group ID (required for data module when using existing resources)"
  type        = string
  default     = ""
}

variable "elasticache_kms_key_id" {
  description = "ElastiCache KMS Key ID (required for data module when using existing resources)"
  type        = string
  default     = ""
}

# Optional - Data Module용 (기존 리소스 이름)
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
