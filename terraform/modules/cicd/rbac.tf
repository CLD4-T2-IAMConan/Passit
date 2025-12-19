############################################
# Argo CD ServiceAccount (IRSA 대상)
############################################
resource "kubernetes_service_account" "argocd_application_controller" {
  metadata {
    name      = "argocd-application-controller"
    namespace = "argocd"

    annotations = {
      # irsa.tf 에서 만든 IAM Role
      "eks.amazonaws.com/role-arn" = aws_iam_role.cicd.arn
    }
  }
}

############################################
# Argo CD ClusterRole
# - Argo CD가 클러스터 리소스를 관리하기 위한 권한
############################################
resource "kubernetes_cluster_role" "argocd_application_controller" {
  metadata {
    name = "argocd-application-controller"
  }

  rule {
    api_groups = ["", "apps", "networking.k8s.io"]
    resources  = ["*"]
    verbs      = ["*"]
  }
}

############################################
# ClusterRoleBinding
# - 위 ClusterRole을 ServiceAccount에 연결
############################################
resource "kubernetes_cluster_role_binding" "argocd_application_controller" {
  metadata {
    name = "argocd-application-controller-binding"
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = kubernetes_cluster_role.argocd_application_controller.metadata[0].name
  }

  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.argocd_application_controller.metadata[0].name
    namespace = "argocd"
  }
}
