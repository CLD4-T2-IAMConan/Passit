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
  # 주의: EKS 클러스터가 생성되기 전에는 빈 문자열("")로 설정해야 함
  # EKS 클러스터 생성 후 terraform.tfvars에서 클러스터 이름으로 업데이트
  eks_cluster_name = var.eks_cluster_name

  allowed_cidr_blocks = var.allowed_cidr_blocks

  # Optional: Use existing security groups if provided
  rds_security_group_id         = var.rds_security_group_id
  elasticache_security_group_id = var.elasticache_security_group_id

  # GitHub OIDC Configuration
  github_org  = var.github_org
  github_repo = var.github_repo
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
# Bastion Host Module
# ============================================
module "bastion" {
  source = "../../modules/bastion"

  project_name = var.project_name
  environment  = var.environment
  region       = var.region
  team         = var.team
  owner        = var.owner

  # Network Configuration
  vpc_id           = module.network.vpc_id
  public_subnet_id = module.network.public_subnet_ids[0]

  # Security Configuration
  allowed_cidr_blocks = var.allowed_cidr_blocks_bastion

  # Instance Configuration
  instance_type          = var.bastion_instance_type
  key_name               = var.bastion_key_name
  enable_session_manager = true

  # Security Group References
  rds_security_group_id         = local.rds_security_group_id
  elasticache_security_group_id = local.elasticache_security_group_id
  # eks_cluster_security_group_id는 EKS 클러스터 생성 후 주석 해제
  # eks_cluster_security_group_id = module.eks.cluster_security_group_id
  
  depends_on = [module.network, module.security, module.eks]
}

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

  # Network Configuration
  vpc_id                = local.vpc_id
  private_db_subnet_ids = local.private_db_subnet_ids

  depends_on = [module.network]

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
  rds_master_username = var.rds_master_username
  rds_master_password = var.rds_master_password
  rds_database_name   = var.rds_database_name

  rds_instance_class     = var.rds_instance_class
  rds_serverless_min_acu = var.rds_serverless_min_acu
  rds_serverless_max_acu = var.rds_serverless_max_acu

  # Passit User Configuration
  create_passit_user     = var.create_passit_user
  passit_user_name       = var.passit_user_name
  passit_user_password   = var.passit_user_password
  bastion_instance_id    = module.bastion.bastion_instance_id

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

  project_name  = var.project_name
  environment   = var.environment
  cluster_name  = module.eks.cluster_name
  region            = var.region
  account_id        = var.account_id


  oidc_provider_arn = module.eks.oidc_provider_arn

  grafana_admin_user     = var.grafana_admin_user
  grafana_admin_password = var.grafana_admin_password
}

# ============================================
# CI/CD Module (Argo CD, IRSA, GitHub OIDC)
# ============================================
# Note: GitHub OIDC Provider는 변수로 받거나 직접 생성해야 합니다.
# dev 환경에서는 terraform.tfvars에 github_oidc_provider_arn을 설정하세요.
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
  cluster_name       = module.eks.cluster_name
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

  # registry (GHCR)
  enable_ghcr_pull_secret = var.enable_ghcr_pull_secret
  ghcr_username           = var.ghcr_username
  ghcr_pat                = var.ghcr_pat
  ghcr_secret_name        = var.ghcr_secret_name
  service_namespaces      = var.service_namespaces

  # irsa (서비스들)
  s3_bucket_profile       = var.s3_bucket_profile
  s3_bucket_ticket        = var.s3_bucket_ticket

  # Secrets Manager ARNs
  secret_db_password_arn = module.security.db_secret_arn
  secret_elasticache_arn = module.security.elasticache_secret_arn
  secret_smtp_arn        = module.security.smtp_secret_arn
  secret_kakao_arn       = module.security.kakao_secret_arn

  depends_on = [module.eks]
}


module "account_app" {
  source = "../../modules/kubernetes_app"

  # [1] 앱 식별 정보
  app_name        = "account"
  project_name    = var.project_name
  environment     = var.environment

  # [2] 이미지 설정
  container_image = var.account_image
  container_port  = 8081
  service_port    = 8081
  replicas        = 2

  # [3] 네트워크 및 인프라 연결
  vpc_id          = module.network.vpc_id

  # [4] DB 연결
  db_host         = module.data.rds_cluster_endpoint
  db_secret_name  = "passit/${var.environment}/db"


  rds_master_username = "admin"
  rds_database_name   = "passit"

  depends_on = [module.eks, module.data]
}