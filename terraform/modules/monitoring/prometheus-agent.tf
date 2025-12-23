############################
# Kubernetes Namespace
############################

resource "kubernetes_namespace_v1" "monitoring" {
  metadata {
    name = var.prometheus_namespace
  }
}

############################
# Kubernetes ServiceAccount (IRSA 대상)
############################

resource "kubernetes_service_account_v1" "adot" {
  metadata {
    name      = var.prometheus_service_account_name
    namespace = kubernetes_namespace_v1.monitoring.metadata[0].name

    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.amp_ingest.arn
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.amp_ingest
  ]
}

############################
# RBAC (kubelet / cadvisor 접근)
############################
resource "kubernetes_cluster_role_v1" "adot" {
  metadata {
    name = "${var.project_name}-${var.environment}-adot"
  }

  rule {
    api_groups = [""]
    resources  = ["nodes", "nodes/proxy", "pods", "services", "endpoints", "namespaces"]
    verbs      = ["get", "list", "watch"]
  }
}

resource "kubernetes_cluster_role_binding_v1" "adot" {
  metadata {
    name = "${var.project_name}-${var.environment}-adot"
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

############################
# ADOT Collector (Helm)
############################
locals {
  amp_remote_write_endpoint = "${trim(aws_prometheus_workspace.this.prometheus_endpoint, "/")}/api/v1/remote_write"
}

resource "helm_release" "adot_collector" {
  name       = "adot-collector"
  repository = "https://aws-observability.github.io/aws-otel-helm-charts"
  chart      = "aws-otel-collector"
  version    = "0.45.0"

  namespace = kubernetes_namespace_v1.monitoring.metadata[0].name

  values = [
    yamlencode({
      mode = "daemonset"

      serviceAccount = {
        create = false
        name   = kubernetes_service_account_v1.adot.metadata[0].name
      }

      config = {
        receivers = {
          prometheus = {
            config = {
              scrape_interval = "30s"
              scrape_configs = [
                {
                  job_name = "kubelet"
                  kubernetes_sd_configs = [{ role = "node" }]
                  bearer_token_file = "/var/run/secrets/kubernetes.io/serviceaccount/token"
                  tls_config = { insecure_skip_verify = true }

                  relabel_configs = [
                    { action = "labelmap", regex = "__meta_kubernetes_node_label_(.+)" },
                    { target_label = "__address__", replacement = "kubernetes.default.svc:443" },
                    {
                      source_labels = ["__meta_kubernetes_node_name"]
                      target_label  = "__metrics_path__"
                      replacement   = "/api/v1/nodes/$${1}/proxy/metrics"
                    }
                  ]
                },
                {
                  job_name = "cadvisor"
                  kubernetes_sd_configs = [{ role = "node" }]
                  bearer_token_file = "/var/run/secrets/kubernetes.io/serviceaccount/token"
                  tls_config = { insecure_skip_verify = true }

                  relabel_configs = [
                    { action = "labelmap", regex = "__meta_kubernetes_node_label_(.+)" },
                    { target_label = "__address__", replacement = "kubernetes.default.svc:443" },
                    {
                      source_labels = ["__meta_kubernetes_node_name"]
                      target_label  = "__metrics_path__"
                      replacement   = "/api/v1/nodes/$${1}/proxy/metrics/cadvisor"
                    }
                  ]
                }
              ]
            }
          }
        }

        processors = {
          batch = {}
          memory_limiter = {
            check_interval = "1s"
            limit_mib      = 400
            spike_limit_mib = 100
          }
        }


        exporters = {
          awsprometheusremotewrite = {
            endpoint = local.amp_remote_write_endpoint
            aws_auth = { region = var.region }
          }
        }

        service = {
          pipelines = {
            metrics = {
              receivers  = ["prometheus"]
              processors = ["memory_limiter", "batch"]
              exporters  = ["awsprometheusremotewrite"]
            }
          }
        }
      }
    })
  ]

  depends_on = [
    kubernetes_cluster_role_binding_v1.adot
  ]
}