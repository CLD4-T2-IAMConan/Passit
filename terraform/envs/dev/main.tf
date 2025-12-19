# ============================================
# Network Module (VPC, Subnets, NAT Gateway, Route Tables)
# ============================================
module "network" {
  source = "../../modules/network"

  # Common Tags & Info
  project_name = var.project_name
  environment  = var.environment
  region       = var.region
  team         = var.team
  owner        = var.owner

  # VPC & Subnet Settings
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones

  # CIDR 리스트 전달 (모듈 내부에서 count를 통해 서브넷들을 자동 생성함)
  public_subnet_cidrs     = var.public_subnet_cidrs
  private_subnet_cidrs    = var.private_subnet_cidrs
  private_db_subnet_cidrs = var.private_db_subnet_cidrs

  # NAT 설정 (Dev 환경은 single_nat_gateway = true 권장)
  enable_nat_gateway = var.enable_nat_gateway
  single_nat_gateway = var.single_nat_gateway
}

# ============================================
# Security Module (Security Groups, IAM Roles)
# ===========================================
module "security" {
  source = "../../modules/security"

  account_id   = var.account_id
  environment  = var.environment
  region       = var.region
  project_name = var.project_name

  # Network Output 참조
  vpc_id = module.network.vpc_id
  # EKS 관련 (Cluster 생성 후 IRSA를 사용하기 위함)
  eks_cluster_name = module.eks.cluster_name

  # 보안 그룹 허용 대역
  allowed_cidr_blocks = var.allowed_cidr_blocks

  # EKS 클러스터가 먼저 생성된 후 Security 모듈 실행
  depends_on = [module.eks]
}

# ============================================
# EKS Module (Cluster, Node Groups)
# ============================================
module "eks" {
  source = "../../modules/eks"

  project_name = var.project_name
  environment  = var.environment
  team         = var.team
  owner        = var.owner

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  # Network Output 참조
  vpc_id             = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids # 모듈이 생성한 서브넷 ID 리스트

  # Node Group 설정
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

# 데이터 모듈 호출 (RDS, ElastiCache/Valkey 담당)
module "data" {
  source = "../../modules/data"

  # 1. 공통 변수 전달
  project_name = var.project_name
  environment  = var.environment
  team         = var.team
  owner        = var.owner
  region       = var.region
  vpc_id       = module.network.vpc_id

  # 2. 네트워크 및 보안 연결 (다른 모듈의 output을 주입)
  # Network 모듈의 output 이름과 일치해야 함
  private_db_subnet_ids = module.network.private_db_subnet_ids

  # Security 모듈의 output 이름과 일치해야 함
  rds_security_group_id         = module.security.rds_security_group_id
  elasticache_security_group_id = module.security.elasticache_security_group_id
  eks_worker_security_group_id  = module.security.eks_worker_security_group_id

  #   # variables.tf에 정의된 KMS 관련 변수도 연결
  #   rds_kms_key_arn         = module.security.rds_kms_key_arn
  #   elasticache_kms_key_arn = module.security.elasticache_kms_key_arn

  # 3. RDS/Valkey 상세 설정 변수 (variables.tf에 정의된 값들)
  rds_instance_class     = var.rds_instance_class
  rds_serverless_min_acu = var.rds_serverless_min_acu
  rds_serverless_max_acu = var.rds_serverless_max_acu
}