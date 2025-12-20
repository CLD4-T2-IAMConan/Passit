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
  count = var.enable_ghcr_pull_secret ? 1 : 0

  metadata {
    name      = var.ghcr_secret_name
    namespace = var.ghcr_secret_namespace
  }

  type = "kubernetes.io/dockerconfigjson"

  data = {
    ".dockerconfigjson" = local.dockerconfigjson
  }
}