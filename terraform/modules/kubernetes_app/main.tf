# 1. 시크릿 데이터 가져오기
data "aws_secretsmanager_secret" "db_secret" {
  count = var.db_secret_name != "" ? 1 : 0
  name  = var.db_secret_name
}

data "aws_secretsmanager_secret_version" "db_secret_version" {
  count     = var.db_secret_name != "" ? 1 : 0
  secret_id = data.aws_secretsmanager_secret.db_secret[0].id
}

locals {
  db_creds = var.db_secret_name != "" ? jsondecode(data.aws_secretsmanager_secret_version.db_secret_version[0].secret_string) : {
    DB_USER     = var.rds_master_username
    DB_PASSWORD = var.rds_master_password
    DB_NAME     = var.rds_database_name
  }
}

# 2. Deployment (이름 부분을 var.app_name으로 변경)
resource "kubernetes_deployment" "this" {
  metadata {
    name      = "passit-${var.app_name}"
    namespace = "default"
    labels = {
      app = var.app_name
    }
  }

  spec {
    replicas = var.replicas
    selector {
      match_labels = {
        app = var.app_name
      }
    }

    template {
      metadata {
        labels = {
          app = var.app_name
        }
      }

      spec {
        container {
          name  = "${var.app_name}-container"
          image = var.container_image

          port {
            container_port = var.container_port
          }

          env {
            name  = "DB_HOST"
            value = var.db_host
          }
          env {
            name  = "DB_PORT"
            value = "3306"
          }
          env {
            name  = "DB_NAME"
            value = local.db_creds["DB_NAME"]
          }
          env {
            name  = "DB_USER"
            value = local.db_creds["DB_USER"]
          }
          env {
            name  = "DB_PASSWORD"
            value = local.db_creds["DB_PASSWORD"]
          }
          env {
            name  = "APP_ENV"
            value = var.environment
          }
        }
      }
    }
  }
}

# 3. Service
resource "kubernetes_service" "this" {
  metadata {
    name = "${var.app_name}-service"
  }

  spec {
    selector = {
      app = var.app_name
    }

    port {
      port        = var.service_port
      target_port = var.container_port
    }

    type = "LoadBalancer"
  }
}