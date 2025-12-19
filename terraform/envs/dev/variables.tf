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

variable "eks_cluster_name" {
  description = "EKS Cluster name for security module dependency"
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
#
# # 아래는 main.tf에서 모듈 결과값으로 채워지거나 tfvars에서 제공될 수 있음
# variable "rds_security_group_id" {
#   description = "Security group ID for RDS"
#   type        = string
#   default     = null
# }
#
# variable "elasticache_security_group_id" {
#   description = "Security group ID for ElastiCache"
#   type        = string
#   default     = null
# }

