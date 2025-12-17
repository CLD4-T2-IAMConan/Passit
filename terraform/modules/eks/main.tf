# EKS Module - EKS Cluster

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  vpc_id     = var.vpc_id
  subnet_ids = var.private_subnet_ids

  cluster_endpoint_private_access = true
  cluster_endpoint_public_access  = false

  enable_irsa = true

  # Disable CloudWatch Logs (권한 문제)
  create_cloudwatch_log_group = false
  cluster_enabled_log_types   = []

  # Disable KMS encryption (권한 문제)
  create_kms_key            = false
  cluster_encryption_config = {}

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}