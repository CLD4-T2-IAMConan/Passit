# IRSA (IAM Roles for Service Accounts)

# EKS Cluster OIDC Provider (IRSA 활성화를 위해 필요)
# 주의: EKS 클러스터가 먼저 생성되어야 함
# 참고: EKS 모듈에서 enable_irsa = true로 설정하면 자동으로 OIDC Provider가 생성되므로
# 여기서는 기존 OIDC Provider를 data source로 참조만 합니다.
# 
# Note: destroy 시 클러스터가 이미 삭제되었을 수 있으므로, 
# 이 data source는 destroy 시 무시됩니다 (state에서 제거 필요).
# 
# 주의: 클러스터가 아직 생성되지 않았거나 존재하지 않으면 이 data source는 실패합니다.
# 
# 해결 방법:
# 1. 클러스터가 없으면: eks_cluster_name을 빈 문자열("")로 설정
# 2. 클러스터가 있으면: eks_cluster_name을 설정하고 클러스터 조회 시도
#
# 주의: 
# - eks_oidc_provider_url은 리소스 속성에 의존하므로 count 조건에서 사용할 수 없습니다.
# - 클러스터가 아직 생성되지 않았으면 eks_cluster_name을 빈 문자열로 설정하세요.
# - 클러스터가 생성된 후에는 eks_cluster_name을 설정하고 다시 실행하세요.
data "aws_eks_cluster" "main" {
  # eks_cluster_name이 설정되어 있으면 클러스터 조회 시도
  # 클러스터가 없으면 이 data source는 실패하므로, 클러스터 생성 전에는 eks_cluster_name을 빈 문자열로 설정
  count = var.eks_cluster_name != "" ? 1 : 0
  name  = var.eks_cluster_name
}

# 기존 OIDC Provider를 data source로 참조 (EKS 모듈에서 이미 생성됨)
# 중복 생성을 방지하기 위해 resource 대신 data source 사용
# 
# Note: destroy 시 클러스터가 이미 삭제되었을 수 있으므로,
# 이 data source는 destroy 시 무시됩니다 (state에서 제거 필요).
# 
# 주의: EKS 클러스터가 생성되고 OIDC Provider가 활성화된 후에만 사용 가능
# 클러스터가 아직 생성되지 않았거나 OIDC Provider가 없으면 이 data source는 실패할 수 있음
# 
# 우선순위:
# 1. var.eks_oidc_provider_url이 제공되면 그것을 사용 (EKS 모듈 output에서 받음)
# 2. 그렇지 않으면 클러스터에서 조회
locals {
  oidc_provider_url = var.eks_oidc_provider_url != "" ? var.eks_oidc_provider_url : try(data.aws_eks_cluster.main[0].identity[0].oidc[0].issuer, "")
}

data "aws_iam_openid_connect_provider" "eks" {
  count = var.eks_cluster_name != "" && local.oidc_provider_url != "" ? 1 : 0
  url   = "https://${local.oidc_provider_url}"
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
