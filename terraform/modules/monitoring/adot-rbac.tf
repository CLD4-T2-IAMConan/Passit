resource "kubernetes_cluster_role_v1" "adot" {
  metadata {
    name = "${var.project_name}-${var.environment}-adot-role"
  }

  rule {
    api_groups = [""]
    resources  = ["nodes", "nodes/proxy", "pods", "endpoints", "services"]
    verbs      = ["get", "list", "watch"]
  }

  rule {
    api_groups = [""]
    resources  = ["namespaces"]
    verbs      = ["get", "list", "watch"]
  }
}

resource "kubernetes_cluster_role_binding_v1" "adot" {
  metadata {
    name = "${var.project_name}-${var.environment}-adot-binding"
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = kubernetes_cluster_role_v1.adot.metadata[0].name
  }

  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account_v1.adot.metadata[0].name
    namespace = var.prometheus_namespace
  }
}
