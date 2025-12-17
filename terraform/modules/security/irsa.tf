# IRSA (IAM Roles for Service Accounts)

# EKS Cluster OIDC Provider (IRSA 활성화를 위해 필요)
# 주의: EKS 클러스터가 먼저 생성되어야 함
data "aws_eks_cluster" "main" {
  count = var.eks_cluster_name != "" ? 1 : 0
  name  = var.eks_cluster_name
}

# OIDC Provider 생성 (EKS 클러스터와 연결)
# thumbprint_list를 생략하면 AWS가 자동으로 계산합니다
resource "aws_iam_openid_connect_provider" "eks" {
  count = var.eks_cluster_name != "" ? 1 : 0

  client_id_list = ["sts.amazonaws.com"]
  url            = data.aws_eks_cluster.main[0].identity[0].oidc[0].issuer
  # thumbprint_list는 생략 - AWS가 자동 계산

  tags = {
    Name        = "${var.project_name}-eks-oidc-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
  }
}

# ============================================
# Service Account와 IAM Role 연결 예시
# ============================================

# 주의: Kubernetes Service Account는 EKS 클러스터가 생성된 후
# kubectl 또는 Helm을 통해 별도로 생성해야 합니다.
# Terraform의 kubernetes provider를 사용하려면 provider 설정이 필요합니다.

# 아래는 예시이며, 실제로는 kubectl apply 또는 Helm chart로 생성하는 것을 권장합니다.

# 예시: kubectl로 Service Account 생성
# kubectl create namespace argocd
# kubectl annotate serviceaccount argocd-server -n argocd eks.amazonaws.com/role-arn=${aws_iam_role.argocd.arn}
