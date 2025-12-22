# ------------------------------------
# Kubernetes Namespaces for Services
# ------------------------------------

resource "kubernetes_namespace" "services" {
  for_each = toset(var.service_namespaces)

  metadata {
    name = each.value
  }
}
