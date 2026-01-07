# ============================================
# Data Sources - 현재 AWS 계정 정보 자동 감지
# ============================================

data "aws_caller_identity" "current" {}

# ============================================
# Locals - 공통 변수 및 계산된 값
# ============================================

locals {
  # 현재 실행 중인 AWS 계정 ID 자동 감지
  account_id = data.aws_caller_identity.current.account_id

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

  account_id   = local.account_id # 자동 감지된 계정 ID 사용
  environment  = var.environment
  region       = var.region
  project_name = var.project_name

  # Secrets Manager variables
  db_secrets          = var.db_secrets
  smtp_secrets        = var.smtp_secrets
  kakao_secrets       = var.kakao_secrets
  admin_secrets       = var.admin_secrets
  app_secrets         = var.app_secrets
  elasticache_secrets = var.elasticache_secrets

  vpc_id = module.network.vpc_id

  # EKS Configuration
  # 주의: EKS 클러스터가 생성되기 전에는 빈 문자열("")로 설정해야 함
  # EKS 클러스터 생성 후 terraform.tfvars에서 클러스터 이름으로 업데이트
  eks_cluster_name = var.eks_cluster_name

  # EKS OIDC Provider URL (EKS 모듈에서 받음, 없으면 빈 문자열)
  # 순환 의존성 방지를 위해 try() 사용
  eks_oidc_provider_url = try(module.eks.oidc_provider_url, "")

  allowed_cidr_blocks = var.allowed_cidr_blocks

  # Optional: Use existing security groups if provided
  rds_security_group_id         = var.rds_security_group_id
  elasticache_security_group_id = var.elasticache_security_group_id

  # EKS Node Security Group ID (for ElastiCache and RDS access)
  # EKS 모듈이 생성한 실제 Node Security Group 사용
  eks_node_security_group_id = try(module.eks.node_security_group_id, "")

  # GitHub OIDC Configuration
  github_org  = var.github_org
  github_repo = var.github_repo

  # github actions IAM에 필요
  frontend_bucket_name                = module.cicd.frontend_bucket_name
  frontend_cloudfront_distribution_id = module.cicd.frontend_cloudfront_distribution_id
  github_actions_frontend_role_arn    = module.cicd.github_actions_frontend_role_arn
}

# ============================================
# EKS Module
# ============================================

module "eks" {
  source = "../../modules/eks"

  region       = var.region
  project_name = var.project_name
  environment  = var.environment
  team         = var.team
  owner        = var.owner

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  vpc_id                 = module.network.vpc_id
  private_subnet_ids     = module.network.private_subnet_ids
  node_security_group_id = module.eks.node_security_group_id

  node_instance_types = var.node_instance_types
  capacity_type       = var.capacity_type
  node_min_size       = var.node_min_size
  node_desired_size   = var.node_desired_size
  node_max_size       = var.node_max_size

  # Access entries - principal_arn은 동적으로 생성 (account_id 자동 감지)
  # var.eks_access_entries가 있으면 사용, 없으면 빈 객체
  # access_entries = var.eks_access_entries != null ? {
  #  for k, v in var.eks_access_entries : k => {
  #    principal_arn      = "arn:aws:iam::${local.account_id}:user/${v.username}"
  #    policy_associations = v.policy_associations
  #  }
  #} : {}
  access_entries                           = {}
  enable_cluster_creator_admin_permissions = false
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
  eks_cluster_security_group_id = module.eks.cluster_security_group_id

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

  global_cluster_id = null
  is_dr_region      = false
  enable_rds        = true


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
  s3_buckets    = var.s3_buckets

  # RDS Configuration
  db_secret_name      = ""
  rds_master_username = var.rds_master_username
  rds_master_password = var.rds_master_password
  rds_database_name   = var.rds_database_name

  rds_instance_class     = var.rds_instance_class
  rds_serverless_min_acu = var.rds_serverless_min_acu
  rds_serverless_max_acu = var.rds_serverless_max_acu

  # Passit User Configuration
  create_passit_user   = var.create_passit_user
  passit_user_name     = var.passit_user_name
  passit_user_password = var.passit_user_password
  bastion_instance_id  = module.bastion.bastion_instance_id
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

  project_name      = var.project_name
  environment       = var.environment
  cluster_name      = module.eks.cluster_name
  region            = var.region
  account_id        = local.account_id # 자동 감지된 계정 ID 사용
  tags              = var.tags
  oidc_provider_arn = module.eks.oidc_provider_arn
  oidc_provider_url = module.eks.oidc_provider_url

  prometheus_workspace_name       = "${var.project_name}-${var.environment}-amp"
  prometheus_namespace            = "monitoring"
  prometheus_service_account_name = "prometheus-agent"


  log_retention_days          = var.log_retention_days
  application_error_threshold = var.application_error_threshold



  depends_on = [
    module.eks,
    module.cicd # AWS Load Balancer Controller webhook이 준비될 때까지 대기
  ]

  grafana_namespace = "monitoring"

  grafana_admin_user     = var.grafana_admin_user
  grafana_admin_password = var.grafana_admin_password


  prometheus_workspace_name       = "${var.project_name}-${var.environment}-amp"
  prometheus_namespace            = "monitoring"
  prometheus_service_account_name = "prometheus-agent"


  fluentbit_namespace            = "kube-system"
  fluentbit_service_account_name = "fluent-bit"
  fluentbit_chart_version        = "0.48.6"

  log_retention_days          = var.log_retention_days
  application_error_threshold = var.application_error_threshold
  alarm_sns_topic_arn         = var.alarm_sns_topic_arn
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
  # vpc_id       = var.vpc_cidr

  # EKS 연동 (IRSA for Argo CD)
  cluster_name      = module.eks.cluster_name
  oidc_provider_arn = module.eks.oidc_provider_arn
  oidc_provider_url = module.eks.oidc_provider_url

  # GitHub OIDC (shared에서 만든 걸 사용)
  github_oidc_provider_arn = try(data.terraform_remote_state.shared.outputs.github_oidc_provider_arn, "")

  # GitHub Actions OIDC (CI)
  github_org  = var.github_org
  github_repo = var.github_repo
  github_ref  = var.github_ref

  # Frontend CD (S3 / CloudFront)
  # ALB가 EKS Ingress에서 생성된 후 enable_frontend=true로 변경
  enable_frontend      = var.enable_frontend
  frontend_bucket_name = var.frontend_bucket_name
  alb_name             = "passit-dev-alb" # ALB 생성 후 "passit-dev-alb"로 변경

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

  # SNS Topic ARNs
  sns_ticket_events_topic_arn  = module.sns.ticket_events_topic_arn
  sns_deal_events_topic_arn    = module.sns.deal_events_topic_arn
  sns_payment_events_topic_arn = module.sns.payment_events_topic_arn

  # SQS Queue URLs
  sns_chat_deal_events_queue_url    = module.sns.chat_deal_events_queue_url
  sns_ticket_deal_events_queue_url  = module.sns.ticket_deal_events_queue_url
  sns_trade_ticket_events_queue_url = module.sns.trade_ticket_events_queue_url

  # SQS Queue ARNs (for IAM policies)
  sns_chat_deal_events_queue_arn    = module.sns.chat_deal_events_queue_arn
  sns_ticket_deal_events_queue_arn  = module.sns.ticket_deal_events_queue_arn
  sns_trade_ticket_events_queue_arn = module.sns.trade_ticket_events_queue_arn

  depends_on = [module.eks, module.sns]
}

# ============================================
# SNS Module (Event-Driven Architecture)
# ============================================
module "sns" {
  source = "../../modules/sns"

  project_name = var.project_name
  environment  = var.environment
  team         = var.team
  owner        = var.owner
  kms_key_id   = "" # Optional: Add KMS key ID for encryption if needed
}