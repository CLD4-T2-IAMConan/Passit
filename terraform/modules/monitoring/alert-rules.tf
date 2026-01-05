############################################
# Prometheus Alert Rules
############################################
# 주의: kubernetes_manifest는 EKS 클러스터가 생성된 후에만 사용 가능합니다.
# 초기 terraform apply 후 EKS 클러스터가 생성되면 주석을 해제하세요.
#
# 또는 Helm values에 alert rules를 포함시키는 방법도 있습니다.

# resource "kubernetes_manifest" "prometheus_alert_rules" {
#   depends_on = [
#     helm_release.kube_prometheus_stack
#   ]
#
#   manifest = {
#     apiVersion = "monitoring.coreos.com/v1"
#     kind       = "PrometheusRule"
#
#     metadata = {
#       name      = "passit-alert-rules"
#       namespace = var.monitoring_namespace
#       labels = {
#         release = "kube-prometheus-stack"
#       }
#     }
#
#     spec = {
#       groups = [
#
#         ########################################
#         # 1. Pod Restart Alert
#         ########################################
#         {
#           name = "pod-restart.rules"
#           rules = [
#             {
#               alert = "PodRestartHigh"
#               expr  = "increase(kube_pod_container_status_restarts_total[5m]) > 3"
#               for   = "2m"
#               labels = {
#                 severity = "warning"
#               }
#               annotations = {
#                 summary     = "Pod 재시작 과다 발생"
#                 description = "Pod {{ $labels.namespace }}/{{ $labels.pod }} 가 5분 내 3회 이상 재시작됨"
#               }
#             }
#           ]
#         },
#
#         ########################################
#         # 2. Node CPU Alert
#         ########################################
#         {
#           name = "node-cpu.rules"
#           rules = [
#             {
#               alert = "NodeHighCPUUsage"
#               expr  = "(1 - avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m]))) * 100 > 80"
#               for   = "5m"
#               labels = {
#                 severity = "warning"
#               }
#               annotations = {
#                 summary     = "Node CPU 사용률 과다"
#                 description = "Node {{ $labels.instance }} CPU 사용률이 5분 이상 80% 초과"
#               }
#             }
#           ]
#         },
#
#         ########################################
#         # 3. HTTP 5xx Error Rate Alert
#         ########################################
#         {
#           name = "http-5xx.rules"
#           rules = [
#             {
#               alert = "Http5xxErrorRateHigh"
#               expr  = <<-EOT
#                 sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
#                 /
#                 sum(rate(http_server_requests_seconds_count[5m]))
#                 > 0.05
#               EOT
#               for   = "3m"
#               labels = {
#                 severity = "critical"
#               }
#               annotations = {
#                 summary     = "HTTP 5xx 에러 비율 증가"
#                 description = "HTTP 요청 중 5xx 비율이 5분 평균 5% 초과"
#               }
#             }
#           ]
#         }
#       ]
#     }
#   }
# }
