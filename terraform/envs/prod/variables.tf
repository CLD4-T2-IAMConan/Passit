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
  default     = "10.1.0.0/16"  # Prod는 dev(10.0.0.0/16)와 다른 CIDR 사용
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

variable "use_existing_vpc" {
  description = "Use existing VPC instead of creating a new one"
  type        = bool
  default     = true  # Prod는 기존 VPC 사용
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

variable "account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "eks_cluster_name" {
  description = "Existing EKS cluster name (if cluster already exists, use this instead of creating new one)"
  type        = string
  default     = ""
}

variable "cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type = string
  default = "1.34"
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

# Optional - Data Module용 (기존 리소스 ID)
variable "rds_security_group_id" {
  description = "RDS Security Group ID (required for data module)"
  type        = string
  default     = ""
}

variable "elasticache_security_group_id" {
  description = "ElastiCache Security Group ID (required for data module)"
  type        = string
  default     = ""
}

variable "elasticache_kms_key_id" {
  description = "ElastiCache KMS Key ID (required for data module)"
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