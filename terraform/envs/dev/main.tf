# Dev Environment - Module Calls

# Security Module
module "security" {
  source = "../../modules/security"

  # 필수 변수
  account_id   = var.account_id
  environment  = "dev"
  region       = var.region
  project_name = var.project_name

  # 네트워크 의존성 (Network 모듈이 생성되면 실제 값으로 교체)
  vpc_id = var.vpc_id

  # EKS 의존성 (EKS 모듈이 생성되면 실제 값으로 교체)
  eks_cluster_name = var.eks_cluster_name

  # 보안 그룹 설정
  allowed_cidr_blocks = var.allowed_cidr_blocks

  # 선택적 변수
  rds_security_group_id         = var.rds_security_group_id
  elasticache_security_group_id = var.elasticache_security_group_id
}

# EKS Module
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

  # Network
  vpc_id             = var.vpc_id
  private_subnet_ids = var.private_subnet_ids

  # Node Group
  node_instance_types = var.node_instance_types
  capacity_type       = var.capacity_type

  node_min_size     = var.node_min_size
  node_desired_size = var.node_desired_size
  node_max_size     = var.node_max_size
}
