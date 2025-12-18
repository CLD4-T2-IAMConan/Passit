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
# ============================================
module "security" {
  source = "../../modules/security"

  account_id   = var.account_id
  environment  = var.environment
  region       = var.region
  project_name = var.project_name

  # Network Output 참조
  vpc_id = module.network.vpc_id

  # EKS 관련 (Cluster 생성 전에는 빈 값 또는 기본 이름 전달)
  eks_cluster_name = var.eks_cluster_name

  # 보안 그룹 허용 대역
  allowed_cidr_blocks = var.allowed_cidr_blocks
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