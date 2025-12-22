# 서비스별 ServiceAccount
resource "kubernetes_service_account" "backend_service" {
  for_each = toset(var.service_namespaces)
  metadata {
    name      = "${each.key}-sa"
    namespace = each.key

    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.backend_service[each.key].arn
    }
  }
}

# 서비스별 ClusterRole (최소 권한)
resource "kubernetes_cluster_role" "backend_service" {
  for_each = toset(var.service_namespaces)
  metadata {
    name = "${each.key}-cluster-role"
  }

  rule {
    api_groups = [""]
    resources  = ["pods", "services", "configmaps", "secrets"]
    verbs      = ["get", "list", "watch"]
  }

  rule {
    api_groups = ["apps"]
    resources  = ["deployments", "statefulsets"]
    verbs      = ["get", "list", "watch"]
  }
}

# ClusterRoleBinding
resource "kubernetes_cluster_role_binding" "backend_service" {
  for_each = toset(var.service_namespaces)
  metadata {
    name = "${each.key}-cluster-role-binding"
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = kubernetes_cluster_role.backend_service[each.key].metadata[0].name
  }

  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.backend_service[each.key].metadata[0].name
    namespace = each.key
  }
}