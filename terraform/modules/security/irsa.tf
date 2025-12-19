# IRSA (IAM Roles for Service Accounts)

# EKS Cluster OIDC Provider (IRSA 활성화를 위해 필요)
# 주의: EKS 클러스터가 먼저 생성되어야 함
# 참고: EKS 모듈에서 enable_irsa = true로 설정하면 자동으로 OIDC Provider가 생성되므로
# 여기서는 기존 OIDC Provider를 data source로 참조만 합니다.
data "aws_eks_cluster" "main" {
  count = var.eks_cluster_name != "" ? 1 : 0
  name  = var.eks_cluster_name
}

# 기존 OIDC Provider를 data source로 참조 (EKS 모듈에서 이미 생성됨)
# 중복 생성을 방지하기 위해 resource 대신 data source 사용
data "aws_iam_openid_connect_provider" "eks" {
  count = var.eks_cluster_name != "" ? 1 : 0
  url   = data.aws_eks_cluster.main[0].identity[0].oidc[0].issuer
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
