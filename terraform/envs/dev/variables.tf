# ============================================
# Common / Global Variables
# ============================================
variable "account_id" {
  description = "AWS Account ID"
  type        = string
  default     = "727646470302"
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
  default     = false
}

variable "use_existing_vpc" {
  description = "Use existing VPC instead of creating a new one"
  type        = bool
  default     = false # Dev는 기본적으로 새 VPC 생성
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
  default     = "1.31"
}

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
  description = "Instance class for RDS"
  type        = string
  default     = "db.t3.medium"
}

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
  default     = 1
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

# ============================================
# CI/CD Module Variables
# ============================================
variable "github_org" {
  description = "GitHub organization or user name"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "github_ref" {
  description = "GitHub branch or ref allowed to deploy (e.g., refs/heads/main)"
  type        = string
}

variable "enable_frontend" {
  description = "Enable frontend deployment (S3 + CloudFront)"
  type        = bool
  default     = true
}

variable "frontend_bucket_name" {
  description = "S3 bucket name for frontend static files"
  type        = string
}

variable "enable_ghcr_pull_secret" {
  description = "Enable GHCR (GitHub Container Registry) pull secret for Kubernetes"
  type        = bool
  default     = false
}

variable "ghcr_username" {
  description = "GitHub username for GHCR authentication"
  type        = string
  sensitive   = true
  default     = null
}

variable "ghcr_pat" {
  description = "GitHub Personal Access Token (PAT) for GHCR authentication"
  type        = string
  sensitive   = true
  default     = null
}

variable "service_namespaces" {
  description = "List of Kubernetes namespaces for services"
  type        = list(string)
  default     = []
}

variable "github_oidc_provider_arn" {
  description = "GitHub OIDC Provider ARN for GitHub Actions authentication (optional, can be created in shared resources)"
  type        = string
  default     = ""
}

# =========================
# CI/CD - registry (GHCR)
# =========================
variable "ghcr_secret_name" {
  description = "Kubernetes secret name for GHCR pull secret"
  type        = string
  default     = "ghcr-pull-secret"
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

# --- 애플리케이션 이미지 변수 ---
variable "account_image" {
  description = "Docker image for account service"
  type        = string
  default     = "ghcr.io/cld4-t2-iamconan/passit-account:latest"
}

# 다른 서비스 추가
variable "chat_image" {
  description = "Docker image for chat service"
  type        = string
  default     = ""
}

# ============================================
# Bastion Host Module Variables
# ============================================
variable "bastion_instance_type" {
  description = "Bastion Host EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "bastion_key_name" {
  description = "SSH key pair name for Bastion Host (optional, Session Manager is recommended)"
  type        = string
  default     = "passit-dev-bastion"
}

variable "allowed_cidr_blocks_bastion" {
  description = "CIDR blocks allowed to SSH into Bastion Host (recommend restricting to your IP)"
  type        = list(string)
  default     = ["0.0.0.0/0"] # 보안을 위해 실제 환경에서는 특정 IP로 제한 필요
}

# --- DB 인증 변수 (RDS 및 App 모듈 전달용) ---
variable "rds_master_username" {
  description = "Master username for RDS"
  type        = string
  default     = "admin"
}

variable "rds_master_password" {
  description = "Master password for RDS"
  type        = string
  sensitive   = true # 보안을 위해 출력을 숨깁니다.
}

variable "rds_database_name" {
  description = "Database name for RDS"
  type        = string
  default     = "passit"
}

variable "create_passit_user" {
  description = "Whether to automatically create passit_user in RDS"
  type        = bool
  default     = true
}

variable "passit_user_name" {
  description = "Username for passit_user"
  type        = string
  default     = "passit_user"
}

variable "passit_user_password" {
  description = "Password for passit_user (should match Secrets Manager if using)"
  type        = string
  default     = "passit_password"
  sensitive   = true
}
