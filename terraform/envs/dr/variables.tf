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
  default     = "dr"
}

variable "region" {
  description = "AWS Region"
  type        = string
  default     = "ap-northeast-1"
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
  description = "CIDR block for VPC (required only if use_existing_vpc = false or existing_vpc_id is empty)"
  type        = string
  default     = ""
}

variable "availability_zones" {
  description = "Availability zones for subnets"
  type        = list(string)
  default     = ["ap-northeast-2a", "ap-northeast-2c"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (required only if use_existing_vpc = false)"
  type        = list(string)
  default     = []
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private app subnets (EKS용, required only if use_existing_vpc = false)"
  type        = list(string)
  default     = []
}

variable "private_db_subnet_cidrs" {
  description = "CIDR blocks for private db subnets (RDS, ElastiCache용, required only if use_existing_vpc = false)"
  type        = list(string)
  default     = []
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

variable "use_existing_vpc" {
  description = "Use existing VPC instead of creating a new one"
  type        = bool
  default     = true # Prod는 기존 VPC 사용
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

variable "eks_cluster_name" {
  description = "Existing EKS cluster name (if cluster already exists, use this instead of creating new one)"
  type        = string
  default     = ""
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
  description = "RDS Security Group ID (optional - if empty, will use security module output)"
  type        = string
  default     = ""
}

variable "elasticache_security_group_id" {
  description = "ElastiCache Security Group ID (optional - if empty, will use security module output)"
  type        = string
  default     = ""
}

variable "elasticache_kms_key_id" {
  description = "ElastiCache KMS Key ID (optional - if empty, will use security module output)"
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

# ============================================
# Monitoring Module Variables
# ============================================
variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 30
}

variable "application_error_threshold" {
  description = "Threshold for ERROR log count to trigger CloudWatch Alarm"
  type        = number
  default     = 5
}

variable "alarm_sns_topic_arn" {
  description = "SNS Topic ARN for CloudWatch alarm notifications (optional)"
  type        = string
  default     = null
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

variable "service_namespaces" {
  type        = list(string)
  description = "List of Kubernetes namespaces for services"
}

variable "enable_frontend" {
  type = bool
}

variable "frontend_bucket_name" {
  type = string
}

variable "github_oidc_provider_arn" {
  description = "GitHub OIDC Provider ARN for GitHub Actions authentication (optional, can be created in shared resources)"
  type        = string
  default     = ""
}

# =========================
# CI/CD - registry (GHCR)
# =========================
variable "enable_ghcr_pull_secret" {
  type = bool
}

variable "ghcr_username" {
  type = string
}

variable "ghcr_pat" {
  type      = string
  sensitive = true
}

variable "ghcr_secret_name" {
  type    = string
  default = "ghcr-pull-secret"
}

# ==================================
# CI/CD - 백엔드 서비스 IRSA 관련
# ==================================
variable "s3_bucket_profile" {
  description = "S3 bucket for account service profile images"
  type        = string
}

variable "s3_bucket_ticket" {
  description = "S3 bucket for ticket service images"
  type        = string
}

# ============================================
# Bastion Host Module Variables
# ============================================
# Note: Bastion Host는 prod 환경에서 사용되지 않습니다.
#       변수는 호환성을 위해 유지되지만 실제로는 사용되지 않습니다.
#       dev 환경에서만 Bastion Host가 배포됩니다.

variable "bastion_instance_type" {
  description = "Bastion Host EC2 instance type (prod에서는 사용되지 않음)"
  type        = string
  default     = "t3.micro"
}

variable "bastion_key_name" {
  description = "SSH key pair name for Bastion Host (prod에서는 사용되지 않음)"
  type        = string
  default     = ""
}

variable "allowed_cidr_blocks_bastion" {
  description = "CIDR blocks allowed to SSH into Bastion Host (prod에서는 사용되지 않음)"
  type        = list(string)
  default     = [] # prod에서는 빈 배열
}

# DR 환경에서 RDS 생성을 생략하기 위한 변수
variable "enable_rds" {
  description = "RDS 생성 여부 결정"
  type        = bool
}

variable "enable_cluster_creator_admin_permissions" {
  type    = bool
  default = true
}

variable "access_entries" {
  type    = any
  default = {}
}