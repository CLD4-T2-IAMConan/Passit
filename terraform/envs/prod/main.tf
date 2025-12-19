# ============================================
# Network Module
# ============================================
module "network" {
  source = "../../modules/network"

  project_name = var.project_name
  environment  = "prod"
  region       = var.region
  team         = var.team
  owner        = var.owner

  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones

  public_subnet_cidrs     = var.public_subnet_cidrs
  private_subnet_cidrs    = var.private_subnet_cidrs
  private_db_subnet_cidrs = var.private_db_subnet_cidrs

  # Prod는 고가용성이 중요하므로 보통 아래와 같이 설정합니다 (tfvars에서 조절 가능)
  enable_nat_gateway = true
  single_nat_gateway = false # AZ마다 NAT를 따로 생성
}

# ============================================
# Security Module
# ============================================
module "security" {
  source = "../../modules/security"

  account_id   = var.account_id
  environment  = "prod"
  region       = var.region
  project_name = var.project_name

  vpc_id              = module.network.vpc_id
  eks_cluster_name    = var.eks_cluster_name
  allowed_cidr_blocks = var.allowed_cidr_blocks

  rds_security_group_id         = var.rds_security_group_id
  elasticache_security_group_id = var.elasticache_security_group_id

  # EKS 클러스터가 먼저 생성된 후 Security 모듈 실행
  depends_on = [module.eks]
}

# ============================================
# EKS Module
# ============================================
module "eks" {
  source = "../../modules/eks"

  project_name = var.project_name
  environment  = "prod"
  team         = var.team
  owner        = var.owner

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  vpc_id             = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids

  # Prod는 더 높은 사양이나 개수를 tfvars에서 지정합니다.
  node_instance_types = var.node_instance_types
  capacity_type       = var.capacity_type

  node_min_size     = var.node_min_size
  node_desired_size = var.node_desired_size
  node_max_size     = var.node_max_size
}