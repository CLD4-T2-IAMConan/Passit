resource "kubernetes_namespace_v1" "monitoring" {
  metadata {
    name = "monitoring"
  }
}

resource "kubernetes_namespace_v1" "logging" {
  metadata {
    name = "logging"
  }
}
