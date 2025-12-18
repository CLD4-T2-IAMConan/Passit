variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "region" {
  type = string
}

variable "team" {
  description = "Owning team name"
  type        = string
}

variable "owner" {
  description = "Owner name"
  type        = string
}

# Network
# Network 모듈을 사용하는 경우 아래 변수들은 사용하지 않음 (모듈에서 자동 생성)
variable "vpc_id" {
  description = "VPC ID for Security Groups and EKS (Network 모듈 사용 시 자동 생성됨)"
  type        = string
  default     = ""
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for EKS (Network 모듈 사용 시 자동 생성됨)"
  type        = list(string)
  default     = []
}

# Network Module Variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.1.0.0/16" # Prod는 dev(10.0.0.0/16)와 다른 CIDR 사용
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
  default     = false # Prod는 고가용성을 위해 각 서브넷마다 NAT Gateway 사용
}

variable "account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.34"
}

variable "eks_cluster_name" {
  description = "EKS cluster name for security module"
  type        = string
  default     = ""
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

variable "allowed_cidr_blocks" {
  type = list(string)
}

# Optional
variable "rds_security_group_id" {
  type    = string
  default = ""
}

variable "elasticache_security_group_id" {
  type    = string
  default = ""
}