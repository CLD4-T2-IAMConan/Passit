# EKS Module - EKS Cluster

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  vpc_id     = var.vpc_id
  subnet_ids = var.private_subnet_ids

  cluster_endpoint_private_access = true
  cluster_endpoint_public_access  = true
  cluster_endpoint_public_access_cidrs = var.cluster_endpoint_public_access_cidrs

  enable_irsa = true

  # Cluster creator admin permissions
  # Disabled because access entries are already configured for team members
  enable_cluster_creator_admin_permissions = false

  # Access entries for additional users
  # principal_arn은 var.access_entries에서 전달받음 (기본값: 빈 객체)
  # 실제 사용자는 terraform/envs/dev/main.tf에서 var.eks_access_entries로 전달
  access_entries = var.access_entries

  # Disable CloudWatch Logs (권한 문제)
  create_cloudwatch_log_group = false
  cluster_enabled_log_types   = []

  # Disable KMS encryption (권한 문제)
  create_kms_key            = false
  cluster_encryption_config = {}

  eks_managed_node_groups = local.eks_managed_node_groups

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}