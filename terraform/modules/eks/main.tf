# EKS Module - EKS Cluster

# Get current caller identity to automatically add as admin
data "aws_caller_identity" "current" {}

locals {
  # Common Tags
  common_tags = {
    Project = var.project_name
    Team    = var.team
    Env     = var.environment
    Owner   = var.owner
  }

  # Automatically add current IAM principal as cluster admin
  current_principal_access_entry = {
    "current_user_admin" = {
      principal_arn = data.aws_caller_identity.current.arn
      policy_associations = {
        admin = {
          policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
          access_scope = {
            type = "cluster"
          }
        }
      }
    }
  }

  # Merge current user with additional access entries from variables
  all_access_entries = merge(
    local.current_principal_access_entry,
    var.access_entries
  )

  # Managed Node Groups
  eks_managed_node_groups = {
    default = {
      # Node Group 이름은 EKS 모듈이 자동 생성 (name 필드 제거하여 IAM Role 이름 길이 제한 회피)

      # EC2 인스턴스 설정
      instance_types = var.node_instance_types

      # Capacity Type
      capacity_type = var.capacity_type

      # Node Auto Scaling 정책
      min_size     = var.node_min_size
      desired_size = var.node_desired_size
      max_size     = var.node_max_size

      # 네트워크 설정
      subnet_ids = var.private_subnet_ids

      # 노드 태그 (Common + NodeGroup + Cluster Autoscaler)
      tags = merge(
        local.common_tags,
        {
          Name      = "${var.project_name}-${var.environment}-eks-nodegroup-default"
          Component = "eks-nodegroup"
          Option    = "default"
          ManagedBy = "terraform"

          # Cluster Autoscaler 대비 태그
          "k8s.io/cluster-autoscaler/enabled"             = "true"
          "k8s.io/cluster-autoscaler/${var.cluster_name}" = "owned"
        }
      )
    }
  }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version

  vpc_id     = var.vpc_id
  subnet_ids = var.private_subnet_ids

  cluster_endpoint_private_access      = true
  cluster_endpoint_public_access       = true
  cluster_endpoint_public_access_cidrs = var.cluster_endpoint_public_access_cidrs

  enable_irsa = true

  # Cluster creator admin permissions
  # Automatically adds current IAM principal (user/role) as cluster admin
  # Additional users can be added via var.access_entries
  access_entries = local.all_access_entries

  # Disable CloudWatch Logs (권한 문제)
  create_cloudwatch_log_group = false
  cluster_enabled_log_types   = []

  # Disable KMS encryption (권한 문제)
  create_kms_key            = false
  cluster_encryption_config = {}

  # null 값 제거 (compact 함수 사용)
  cluster_additional_security_group_ids = compact([var.node_security_group_id])

  eks_managed_node_groups = local.eks_managed_node_groups

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}