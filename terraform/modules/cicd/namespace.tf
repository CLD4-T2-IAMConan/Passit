# ------------------------------------
# Kubernetes Namespaces for Services
# ------------------------------------

resource "kubernetes_namespace_v1" "services" {
  for_each = toset(var.service_namespaces)

  metadata {
    name = each.value
  }
}
