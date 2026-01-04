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

# 기존 리소스 정리 (apply 전에 실행)
resource "null_resource" "cleanup_existing_resources" {
  # 항상 실행 (triggers가 없으므로 매번 실행)
  triggers = {
    app_name  = var.app_name
    namespace = var.namespace
  }

  provisioner "local-exec" {
    command = <<-EOT
      # EKS 클러스터 연결
      CLUSTER_NAME="${var.environment == "dev" ? "passit-dev-eks" : var.environment == "prod" ? "passit-prod-eks" : "passit-dr-eks"}"
      aws eks update-kubeconfig --name "$CLUSTER_NAME" --region ap-northeast-2 > /dev/null 2>&1 || true
      
      # 기존 Deployment 삭제 (모든 namespace에서)
      for NS in default account; do
        # Deployment 삭제
        if kubectl get deployment "passit-${var.app_name}" -n "$NS" > /dev/null 2>&1; then
          kubectl delete deployment "passit-${var.app_name}" -n "$NS" --wait=false 2>/dev/null || true
        fi
        
        # Service 삭제
        if kubectl get service "${var.app_name}-service" -n "$NS" > /dev/null 2>&1; then
          kubectl delete service "${var.app_name}-service" -n "$NS" --wait=false 2>/dev/null || true
        fi
      done
      
      # 삭제 완료까지 대기 (최대 30초)
      for i in {1..30}; do
        FOUND=0
        for NS in default account; do
          if kubectl get deployment "passit-${var.app_name}" -n "$NS" > /dev/null 2>&1; then
            FOUND=1
            break
          fi
          if kubectl get service "${var.app_name}-service" -n "$NS" > /dev/null 2>&1; then
            FOUND=1
            break
          fi
        done
        
        if [ $FOUND -eq 0 ]; then
          echo "✅ 기존 리소스 삭제 완료"
          break
        fi
        
        echo "   삭제 대기 중... ($i/30)"
        sleep 1
      done
    EOT
  }
}

# 2. Deployment (이름 부분을 var.app_name으로 변경)
resource "kubernetes_deployment" "this" {
  depends_on = [null_resource.cleanup_existing_resources]

  metadata {
    name      = "passit-${var.app_name}"
    namespace = var.namespace
    labels = {
      app = var.app_name
    }
  }

  # Rollout 대기 비활성화 (Pod 상태는 수동으로 확인)
  wait_for_rollout = var.wait_for_rollout

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
        # GHCR imagePullSecret 추가 (secret_name이 설정된 경우만)
        dynamic "image_pull_secrets" {
          for_each = var.ghcr_secret_name != "" ? [1] : []
          content {
            name = var.ghcr_secret_name
          }
        }

        container {
          name  = "${var.app_name}-container"
          image = var.container_image

          port {
            container_port = var.container_port
          }

          # Readiness probe 추가 (health_check_path가 설정된 경우만)
          dynamic "readiness_probe" {
            for_each = var.health_check_path != "" ? [1] : []
            content {
              http_get {
                path = var.health_check_path
                port = var.container_port
              }
              initial_delay_seconds = 10
              period_seconds        = 10
              timeout_seconds       = 5
              failure_threshold     = 3
            }
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
  depends_on = [null_resource.cleanup_existing_resources]

  metadata {
    name      = "${var.app_name}-service"
    namespace = var.namespace
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