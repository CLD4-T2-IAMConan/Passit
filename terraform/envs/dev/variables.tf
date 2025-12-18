variable "project_name" {
  type        = string
  description = "Project name (e.g. passit)"
}

variable "environment" {
  type        = string
  description = "Environment (dev, prod)"
}

variable "region" {
  type        = string
  description = "AWS region"
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
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for subnets"
  type        = list(string)
  default     = ["ap-northeast-2a", "ap-northeast-2c"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private app subnets (EKS용)"
  type        = list(string)
  default     = ["10.1.11.0/24"]
}

variable "private_db_subnet_cidrs" {
  description = "CIDR blocks for private db subnets (RDS, ElastiCache용)"
  type        = list(string)
  default     = ["10.1.21.0/24"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway for cost optimization (dev environment)"
  type        = bool
  default     = true  # Dev 환경에서는 비용 절감을 위해 단일 NAT Gateway 사용
}

# EKS Cluster
variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "dev_public_cidr" {
  type        = string
  description = "Dev public subnet CIDR (e.g. 10.1.1.0/24)"
}

variable "dev_private_app_cidr" {
  type        = string
  description = "Dev private app subnet CIDR (e.g. 10.1.11.0/24)"
}

variable "dev_private_db_cidr" {
  type        = string
  description = "Dev private db subnet CIDR (e.g. 10.1.21.0/24)"
}