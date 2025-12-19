# ============================================
# Network Module (VPC, Subnets, NAT Gateway)
# ============================================

module "network" {
  source = "../../modules/network"

  # Common
  project_name = var.project_name
  environment  = var.environment
  region       = var.region
  team         = var.team
  owner        = var.owner

  # VPC Configuration - Existing VPC 사용 시
  use_existing_vpc = var.use_existing_vpc
  existing_vpc_id  = var.existing_vpc_id

  # VPC Configuration (for new VPC)
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones

  # Subnet Configuration (for new VPC)
  public_subnet_cidrs     = var.public_subnet_cidrs
  private_subnet_cidrs    = var.private_subnet_cidrs
  private_db_subnet_cidrs = var.private_db_subnet_cidrs

  # Existing Subnet IDs는 모듈 내부에서 data source로 자동 조회됨

  # NAT Gateway Configuration
  enable_nat_gateway = var.enable_nat_gateway
  single_nat_gateway = var.single_nat_gateway
}

# ============================================
# Security Module
# ============================================

module "security" {
  source = "../../modules/security"

  # 필수 변수
  account_id   = var.account_id
  environment  = "prod"
  region       = var.region
  project_name = var.project_name

  # 네트워크 의존성 (Network 모듈에서 가져옴)
  vpc_id = module.network.vpc_id

  # EKS 관련
  # 주의: 초기 배포 시에는 var.eks_cluster_name이 빈 문자열이어야 합니다
  # EKS 클러스터 생성 후, terraform output으로 클러스터 이름을 확인하고
  # terraform.tfvars의 eks_cluster_name에 설정한 후 다시 apply하세요
  eks_cluster_name = var.eks_cluster_name

  # 보안 그룹 설정
  allowed_cidr_blocks = var.allowed_cidr_blocks

  # 선택적 변수
  rds_security_group_id         = var.rds_security_group_id
  elasticache_security_group_id = var.elasticache_security_group_id
}

# ============================================
# EKS Module
# ============================================

module "eks" {
  source = "../../modules/eks"

  # Common
  project_name = var.project_name
  environment  = var.environment
  team         = var.team
  owner        = var.owner

  # EKS Cluster
  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  # Network (Network 모듈에서 가져옴)
  vpc_id             = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids

  # Node Group
  node_instance_types = var.node_instance_types
  capacity_type       = var.capacity_type

  node_min_size     = var.node_min_size
  node_desired_size = var.node_desired_size
  node_max_size     = var.node_max_size
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
# Data Module (RDS, ElastiCache, S3)
# ============================================
module "data" {
  source = "../../modules/data"

  # Common Tags & Info
  project_name = var.project_name
  environment  = var.environment
  region       = var.region
  team         = var.team
  owner        = var.owner

  # Network Configuration (기존 VPC 사용 시 변수로 직접 전달, 아니면 모듈 output 사용)
  vpc_id                = var.use_existing_vpc ? var.existing_vpc_id : module.network.vpc_id
  private_db_subnet_ids = var.use_existing_vpc ? var.existing_private_db_subnet_ids : module.network.private_db_subnet_ids

  # Security Groups (기존 리소스가 있으면 변수 사용, 없으면 security 모듈 output 사용)
  rds_security_group_id         = var.rds_security_group_id != "" ? var.rds_security_group_id : module.security.rds_security_group_id
  elasticache_security_group_id = var.elasticache_security_group_id != "" ? var.elasticache_security_group_id : module.security.elasticache_security_group_id
  eks_worker_security_group_id  = module.security.eks_worker_security_group_id

  # ElastiCache (Valkey) Configuration - Prod
  # Usage Limit: Data store 10GB, Request 10,000 ~ 100,000 ECPU/sec
  # 노드 기반 캐시이므로 노드 타입과 노드 수로 결정됨
  valkey_node_type       = "cache.t4g.medium" # Prod는 더 큰 인스턴스 사용 (필요시 조정)
  valkey_num_cache_nodes = 1                   # 필요시 증가 가능
  valkey_kms_key_id      = var.elasticache_kms_key_id != "" ? var.elasticache_kms_key_id : module.security.elasticache_kms_key_id

  # 백업 설정 (Prod만 활성화)
  valkey_snapshot_retention_limit = 3
  valkey_snapshot_window          = "18:00-19:00" # 03:00-04:00 KST

  # S3 Configuration
  s3_kms_key_id = module.security.s3_kms_key_id

  # RDS Configuration
  # Secrets Manager에서 DB 자격 증명 가져오기
  db_secret_name      = "${var.project_name}/${var.environment}/db"
  rds_master_username = "admin"
  rds_master_password = "" # 시크릿 사용 시 무시됨
  rds_database_name   = "passit"

  # RDS 인스턴스 클래스 설정 (변수에서 가져오기)
  rds_instance_class     = var.rds_instance_class
  rds_serverless_min_acu = var.rds_serverless_min_acu
  rds_serverless_max_acu = var.rds_serverless_max_acu

  # Existing Resources (기존 리소스 사용 시)
  existing_db_subnet_group_name            = var.existing_db_subnet_group_name
  existing_rds_parameter_group_name        = var.existing_rds_parameter_group_name
  existing_elasticache_subnet_group_name    = var.existing_elasticache_subnet_group_name
  existing_elasticache_parameter_group_name = var.existing_elasticache_parameter_group_name
}

# ============================================
# Monitoring Module
# ============================================
module "monitoring" {
  source = "../../modules/monitoring"

  # ===== 공통 =====
  project_name = var.project_name
  environment  = var.environment
  tags         = var.tags

  # ===== EKS =====
  cluster_name         = module.eks.cluster_name
  oidc_provider_arn   = module.eks.oidc_provider_arn

  # ===== Prometheus =====
  prometheus_workspace_name         = "${var.project_name}-${var.environment}-amp"
  prometheus_namespace              = "monitoring"
  prometheus_service_account_name   = "prometheus-agent"

  # ===== Grafana =====
  grafana_workspace_name = "${var.project_name}-${var.environment}-grafana"

  # ===== Fluent Bit =====
  fluentbit_namespace              = "kube-system"
  fluentbit_service_account_name   = "fluent-bit"
  fluentbit_chart_version          = "0.48.6"

  # ===== CloudWatch =====
  log_retention_days               = var.log_retention_days
  application_error_threshold      = var.application_error_threshold
  alarm_sns_topic_arn              = var.alarm_sns_topic_arn

  # ===== AWS =====
  region     = var.region
  account_id = var.account_id

  depends_on = [
      module.eks
    ]
>>>>>>> 87fb4bd44e57db0335fea2b630f5f214337af895
}