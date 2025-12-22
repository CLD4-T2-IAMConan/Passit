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
  private_db_subnet_ids = var.existing_private_db_subnet_ids != [] ? var.existing_private_db_subnet_ids : module.network.private_db_subnet_ids

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
}

# ============================================
<<<<<<< HEAD
# Data Module (RDS, ElastiCache, S3)
# ============================================
module "data" {
  source = "../../modules/data"

  project_name = var.project_name
  environment  = var.environment
  region       = var.region
  team         = var.team
  owner        = var.owner

  # Network Configuration
  vpc_id                = local.vpc_id
  private_db_subnet_ids = local.private_db_subnet_ids

  # Security Groups
  rds_security_group_id         = local.rds_security_group_id
  elasticache_security_group_id = local.elasticache_security_group_id
  eks_worker_security_group_id  = module.security.eks_worker_security_group_id

  # ElastiCache (Valkey) Configuration
  valkey_node_type       = "cache.t4g.micro"
  valkey_num_cache_nodes = 1
  valkey_kms_key_id      = local.elasticache_kms_key_id

  # S3 Configuration
  s3_kms_key_id = module.security.s3_kms_key_id

  # RDS Configuration
  db_secret_name      = ""
  rds_master_username = "admin"
  rds_master_password = ""
  rds_database_name   = "passit"

  rds_instance_class     = var.rds_instance_class
  rds_serverless_min_acu = var.rds_serverless_min_acu
  rds_serverless_max_acu = var.rds_serverless_max_acu

  # Existing Resources
  existing_db_subnet_group_name            = var.existing_db_subnet_group_name
  existing_rds_parameter_group_name       = var.existing_rds_parameter_group_name
  existing_elasticache_subnet_group_name  = var.existing_elasticache_subnet_group_name
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

  cluster_name       = module.eks.cluster_name
  oidc_provider_arn  = module.eks.oidc_provider_arn

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
=======
# CI/CD Module (Argo CD, IRSA, GitHub OIDC)
# ============================================
data "terraform_remote_state" "shared" {
  backend = "s3"

  config = {
    bucket = "my-terraform-state-bucket"
    key    = "shared/terraform.tfstate"
    region = "ap-northeast-2"
  }
}

module "cicd" {
  source = "../../modules/cicd"

  # Common
  project_name = var.project_name
  environment  = var.environment
  region       = var.region
  # account_id   = var.account_id
  team         = var.team
  owner        = var.owner

  # EKS 연동 (IRSA for Argo CD)
  cluster_name        = module.eks.cluster_name
  oidc_provider_arn  = module.eks.oidc_provider_arn
  oidc_provider_url  = module.eks.oidc_provider_url

  # GitHub OIDC (shared에서 만든 걸 사용)
  github_oidc_provider_arn = data.terraform_remote_state.shared.outputs.github_oidc_provider_arn
  
  # GitHub Actions OIDC (CI)
  github_org  = var.github_org
  github_repo = var.github_repo
  github_ref  = var.github_ref

  # Frontend CD (S3 / CloudFront)
  enable_frontend        = true
  frontend_bucket_name  = var.frontend_bucket_name
}
>>>>>>> 5336c2345ef5ae48f6c79b4d1f9c10c016c18960
