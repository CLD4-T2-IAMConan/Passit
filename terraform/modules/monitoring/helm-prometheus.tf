resource "helm_release" "kube_prometheus_stack" {
  name       = "kube-prometheus-stack"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  namespace = kubernetes_namespace_v1.monitoring.metadata[0].name
  create_namespace = false

  version = "58.6.0"

  # AWS Load Balancer Controller webhook이 준비될 때까지 충분한 시간 확보
  timeout = 600  # 10분 timeout
  
  # 기존 release가 있으면 교체
  replace = true
  force_update = true
  wait = true
  wait_for_jobs = true

  ########################################
  # values.yaml 사용
  ########################################
  values = [

    templatefile(
          "${path.module}/values/alertmanager-values.yaml.tftpl",
          {
            alertmanager_role_arn = aws_iam_role.alertmanager.arn
            sns_topic_arn         = aws_sns_topic.alertmanager.arn
          }
        ),

    file("${path.module}/prometheus-values.yaml")
  ]

  depends_on = [
    kubernetes_namespace_v1.monitoring,
    aws_iam_role_policy_attachment.alertmanager_sns_publish
  ]
}