# GHCR (GitHub Container Registry) Permissions

locals {
  dockerconfigjson = var.enable_ghcr_pull_secret ? jsonencode({
    auths = {
      "ghcr.io" = {
        username = var.ghcr_username
        password = var.ghcr_pat
        auth     = base64encode("${var.ghcr_username}:${var.ghcr_pat}")
      }
    }
  }) : null
}

resource "kubernetes_secret" "ghcr" {
  count = var.enable_ghcr_pull_secret ? length(var.service_namespaces) : 0

  metadata {
    name      = var.ghcr_secret_name
    namespace = var.service_namespaces[count.index]
  }

  depends_on = [kubernetes_namespace_v1.services]

  type = "kubernetes.io/dockerconfigjson"

  data = {
    ".dockerconfigjson" = local.dockerconfigjson
  }

  lifecycle {
    ignore_changes = [data]
  }
}