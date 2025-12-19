# ============================================
# Common Variables
# ============================================

variable "account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "region" {
  description = "AWS Region"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment (dev/prod)"
  type        = string
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
# Network Variables
# ============================================

variable "vpc_cidr" {
  type = string
}

variable "availability_zones" {
  description = "Availability zones for subnets"
  type        = list(string)
  default     = ["ap-northeast-2a", "ap-northeast-2c"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.1.1.0/24", "10.1.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private app subnets (EKS용)"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "private_db_subnet_cidrs" {
  description = "CIDR blocks for private db subnets (RDS, ElastiCache용)"
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway for cost optimization (prod는 false 권장)"
  type        = bool
  default     = false  # Prod는 고가용성을 위해 각 서브넷마다 NAT Gateway 사용
}

variable "account_id" {
  description = "AWS Account ID"
  type = string
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type = string
  default = "1.34"
}

variable "eks_cluster_name" {
  description = "EKS cluster name for security module"
  type = string
}

variable "prod_private_app_c_cidr" {
  type = string
}

variable "prod_private_db_a_cidr" {
  type = string
}

variable "prod_private_db_c_cidr" {
  type = string
}

variable "prod_vpc_id" {
  type = string
}


variable "account_id" { 
  type = string 
}

variable "cluster_name" {
  type = string
}

variable "cluster_version" { 
  type = string 
}

variable "eks_cluster_name" { 
  type = string 
  default = ""
}

variable "node_instance_types" { 
  type = list(string)
}

variable "public_subnet_cidrs" {
  type = list(string)
}

variable "private_subnet_cidrs" {
  type = list(string)
}

variable "private_db_subnet_cidrs" {
  type    = list(string)
  default = []
}

variable "enable_nat_gateway" {
  type = bool
}

variable "single_nat_gateway" {
  type = bool
}

# ============================================
# EKS Variables
# ============================================

variable "cluster_name" {
  type = string
}

variable "cluster_version" {
  type = string
}

variable "eks_cluster_name" {
  description = "Security module reference"
  type        = string
}

variable "node_instance_types" {
  type = list(string)
}

variable "capacity_type" {
  type = string
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
# Security Variables
# ============================================

variable "allowed_cidr_blocks" {
  type = list(string)
}

variable "rds_security_group_id" {
  type    = string
  default = null
}

variable "elasticache_security_group_id" {
  type    = string
  default = ""
}

# =========================
# CI/CD
# =========================
variable "github_org" {
  type = string
}

variable "github_repo" {
  type = string
}

variable "github_ref" {
  type = string
}

variable "enable_frontend" {
  type = bool
}

variable "frontend_bucket_name" {
  type = string
}