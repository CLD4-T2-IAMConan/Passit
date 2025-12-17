# EKS Node Group

# Common Tags
locals {
  common_tags = {
    Project = var.project_name
    Team    = var.team
    Env     = var.environment
    Owner   = var.owner
  }



  # Managed Node Groups

  managed_node_groups = {
    default = {

      # Node Group 기본 식별 정보
      name = "${var.project_name}-${var.environment}-eks-nodegroup-default"


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