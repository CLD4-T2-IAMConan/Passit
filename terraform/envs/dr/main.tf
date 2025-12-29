# DR Environment - Module Calls

# Security Module
module "security" {
  source = "../../modules/security"

  # 필수 변수
  account_id   = var.account_id
  environment  = "dr"
  region       = var.region
  project_name = var.project_name

  # 네트워크 의존성 (Network 모듈이 생성되면 실제 값으로 교체)
  vpc_id = var.vpc_id

  # EKS 의존성 (EKS 모듈이 생성되면 실제 값으로 교체)
  eks_cluster_name = var.eks_cluster_name

  # 보안 그룹 설정
  allowed_cidr_blocks = var.allowed_cidr_blocks

  # 선택적 변수
  rds_security_group_id       = var.rds_security_group_id
  elasticache_security_group_id = var.elasticache_security_group_id
}
