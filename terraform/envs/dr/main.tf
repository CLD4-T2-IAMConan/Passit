# ============================================
# Locals - 공통 변수 및 계산된 값
# ============================================

locals {
  # 공통 태그 및 메타데이터
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    Team        = var.team
    Owner       = var.owner
  }

  # 네트워크 설정 (기존 VPC 사용 여부에 따른 값 선택)
  vpc_id                = var.existing_vpc_id != "" ? var.existing_vpc_id : module.network.vpc_id
  private_db_subnet_ids = length(var.existing_private_db_subnet_ids) > 0 ? var.existing_private_db_subnet_ids : (try(length(module.network.private_db_subnet_ids), 0) > 0 ? module.network.private_db_subnet_ids : [])

  # 보안 그룹 설정 (기존 리소스 사용 여부에 따른 값 선택)
  rds_security_group_id         = var.rds_security_group_id != "" ? var.rds_security_group_id : module.security.rds_security_group_id
  elasticache_security_group_id = var.elasticache_security_group_id != "" ? var.elasticache_security_group_id : module.security.elasticache_security_group_id
  elasticache_kms_key_id        = var.elasticache_kms_key_id != "" ? var.elasticache_kms_key_id : module.security.elasticache_kms_key_id
}

# ============================================
# Network Module (VPC, Subnets, NAT Gateway)
# ============================================

module "network" {
  source = "../../modules/network"

  project_name = var.project_name
  environment  = var.environment
  region       = var.region
  team         = var.team
  owner        = var.owner

  # VPC Configuration
  use_existing_vpc = var.use_existing_vpc
  existing_vpc_id  = var.existing_vpc_id

  # New VPC Configuration
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones

  # Subnet Configuration
  public_subnet_cidrs     = var.public_subnet_cidrs
  private_subnet_cidrs    = var.private_subnet_cidrs
  private_db_subnet_cidrs = var.private_db_subnet_cidrs

  # NAT Gateway Configuration
  enable_nat_gateway = var.enable_nat_gateway
  single_nat_gateway = var.single_nat_gateway
}

# ============================================
# Security Module
# ============================================

module "security" {
  source = "../../modules/security"

  account_id   = var.account_id
  environment  = var.environment
  region       = var.region
  project_name = var.project_name

  vpc_id = module.network.vpc_id

  # EKS Configuration
  # Note: Set to empty string initially, update after EKS cluster creation
  eks_cluster_name = var.eks_cluster_name

  allowed_cidr_blocks = var.allowed_cidr_blocks

  # Optional: Use existing security groups if provided
  rds_security_group_id         = var.rds_security_group_id
  elasticache_security_group_id = var.elasticache_security_group_id
}

# ============================================
# EKS Module
# ============================================

module "eks" {
  source = "../../modules/eks"

  project_name = var.project_name
  environment  = var.environment
  team         = var.team
  owner        = var.owner

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  vpc_id             = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids

  # Public endpoint access for Terraform/kubectl (임시로 0.0.0.0/0 허용, 추후 특정 IP로 제한 권장)
  cluster_endpoint_public_access_cidrs = ["0.0.0.0/0"]

  node_instance_types = var.node_instance_types
  capacity_type       = var.capacity_type
  node_min_size       = var.node_min_size
  node_desired_size   = var.node_desired_size
  node_max_size       = var.node_max_size
}

# ============================================
# Autoscaling Module (Cluster Autoscaler)
# ============================================
module "autoscaling" {
  source = "../../modules/autoscaling"

  project_name = var.project_name
  environment  = var.environment
  team         = var.team
  owner        = var.owner
  region       = var.region

  cluster_name      = module.eks.cluster_name
  oidc_provider_arn = module.eks.oidc_provider_arn
  oidc_provider_url = module.eks.oidc_provider_url

  depends_on = [module.eks]
}

# ============================================
# Bastion Host Module
# ============================================
# Note: Bastion Host는 prod 환경에서는 보안상의 이유로 제외됩니다.
#       dev 환경에서만 사용됩니다.
#       prod 환경에서 DB 접근이 필요한 경우:
#       - VPN을 통한 접근
#       - AWS Systems Manager Session Manager (직접 EKS Pod 접속)
#       - 전용 관리 서버 (별도 구성)

# ============================================
# Data Module (RDS, ElastiCache, S3)
# ============================================
module "data" {
  source = "../../modules/data"

  project_name = var.project_name
  environment  = var.environment
  region       = var.region
  team         = var.team
  owner        = var.owner

  enable_rds = var.enable_rds

  # Network Configuration
  vpc_id                = local.vpc_id
  private_db_subnet_ids = local.private_db_subnet_ids

  depends_on = [module.network]

  # Security Groups
  rds_security_group_id         = local.rds_security_group_id
  elasticache_security_group_id = local.elasticache_security_group_id
  eks_worker_security_group_id  = module.security.eks_worker_security_group_id

  # ElastiCache (Valkey) Configuration
  valkey_node_type                = "cache.t4g.medium"
  valkey_num_cache_nodes          = 1
  valkey_kms_key_id               = local.elasticache_kms_key_id
  valkey_snapshot_retention_limit = 3
  valkey_snapshot_window          = "18:00-19:00" # 03:00-04:00 KST

  # S3 Configuration
  s3_kms_key_id = module.security.s3_kms_key_id

  # RDS Configuration
  db_secret_name      = ""
  rds_master_username = "admin"
  rds_master_password = "PassitProdPassword123!" # 임시 비밀번호 (나중에 Secrets Manager로 관리 권장)
  rds_database_name   = "passit"

  rds_instance_class     = var.rds_instance_class
  rds_serverless_min_acu = var.rds_serverless_min_acu
  rds_serverless_max_acu = var.rds_serverless_max_acu

  # Existing Resources
  existing_db_subnet_group_name             = var.existing_db_subnet_group_name
  existing_rds_parameter_group_name         = var.existing_rds_parameter_group_name
  existing_elasticache_subnet_group_name    = var.existing_elasticache_subnet_group_name
  existing_elasticache_parameter_group_name = var.existing_elasticache_parameter_group_name
}

# ============================================
# Monitoring Module
# ============================================
module "monitoring" {
  source = "../../modules/monitoring"

  project_name = var.project_name
  environment  = var.environment
  tags         = var.tags
  region       = var.region
  account_id   = var.account_id

  cluster_name      = module.eks.cluster_name
  oidc_provider_arn = module.eks.oidc_provider_arn

  prometheus_workspace_name       = "${var.project_name}-${var.environment}-amp"
  prometheus_namespace            = "monitoring"
  prometheus_service_account_name = "prometheus-agent"

  grafana_workspace_name = "${var.project_name}-${var.environment}-grafana"

  fluentbit_namespace            = "kube-system"
  fluentbit_service_account_name = "fluent-bit"
  fluentbit_chart_version        = "0.48.6"

  log_retention_days          = var.log_retention_days
  application_error_threshold = var.application_error_threshold
  alarm_sns_topic_arn         = var.alarm_sns_topic_arn

  depends_on = [module.eks]
}

# ============================================
# CI/CD Module (Argo CD, IRSA, GitHub OIDC)
# ============================================
# Note: GitHub OIDC Provider는 변수로 받거나 직접 생성해야 합니다.
# prod 환경에서는 terraform.tfvars에 github_oidc_provider_arn을 설정하세요.
# GitHub OIDC Provider가 없다면 terraform/shared에서 생성하거나 수동으로 생성해야 합니다.
locals {
  github_oidc_provider_arn = var.github_oidc_provider_arn
}

module "cicd" {
  source = "../../modules/cicd"

  # Common
  project_name = var.project_name
  environment  = var.environment
  region       = var.region
  team         = var.team
  owner        = var.owner

  # EKS 연동 (IRSA for Argo CD)
  cluster_name      = module.eks.cluster_name
  oidc_provider_arn = module.eks.oidc_provider_arn
  oidc_provider_url = module.eks.oidc_provider_url

  # GitHub OIDC (변수로 받기)
  github_oidc_provider_arn = local.github_oidc_provider_arn

  # GitHub Actions OIDC (CI)
  github_org  = var.github_org
  github_repo = var.github_repo
  github_ref  = var.github_ref

  # Frontend CD (S3 / CloudFront)
  enable_frontend      = true
  frontend_bucket_name = var.frontend_bucket_name

  # registry (GHCR)
  enable_ghcr_pull_secret = var.enable_ghcr_pull_secret
  ghcr_username           = var.ghcr_username
  ghcr_pat                = var.ghcr_pat
  ghcr_secret_name        = var.ghcr_secret_name
  service_namespaces      = var.service_namespaces

  # irsa (서비스들)
  s3_bucket_profile = var.s3_bucket_profile
  s3_bucket_ticket  = var.s3_bucket_ticket

  # Secrets Manager ARNs
  secret_db_password_arn = module.security.db_secret_arn
  secret_elasticache_arn = module.security.elasticache_secret_arn
  secret_smtp_arn        = module.security.smtp_secret_arn
  secret_kakao_arn       = module.security.kakao_secret_arn

  depends_on = [module.eks]
}
