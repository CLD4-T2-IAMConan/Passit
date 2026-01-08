resource "helm_release" "kube_prometheus_stack" {
  name             = "kube-prometheus-stack"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "kube-prometheus-stack"
  namespace        = kubernetes_namespace_v1.monitoring.metadata[0].name
  create_namespace = false

  version = "58.6.0"

  # AWS Load Balancer Controller webhook이 준비될 때까지 충분한 시간 확보
  timeout = 1200 # 20분 timeout (kube-prometheus-stack은 많은 리소스를 배포하므로 충분한 시간 필요)

  # 기존 release가 있으면 교체
  replace       = true
  force_update  = true
  wait          = true
  wait_for_jobs = false # Job은 백그라운드에서 실행되도록 설정 (타임아웃 방지)

  ########################################
  # values.yaml 사용
  ########################################
  values = [

    templatefile(
      "${path.module}/values/alertmanager-values.yaml.tftpl",
      {
        alertmanager_role_arn = var.alertmanager_role_arn != null ? var.alertmanager_role_arn : aws_iam_role.alertmanager.arn
        alarm_sns_topic_arn   = var.alarm_sns_topic_arn != null ? var.alarm_sns_topic_arn : aws_sns_topic.alertmanager.arn
      }
    ),

    file("${path.module}/prometheus-values.yaml")
  ]

  depends_on = [
    kubernetes_namespace_v1.monitoring,
    aws_iam_role_policy_attachment.alertmanager_sns_publish
  ]
}