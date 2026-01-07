############################################
# Fluent Bit Helm Release
############################################

resource "helm_release" "fluentbit" {
  name       = "fluent-bit"
  repository = "https://fluent.github.io/helm-charts"
  chart      = "fluent-bit"
  namespace  = kubernetes_namespace_v1.logging.metadata[0].name

  create_namespace = false
  
  # 기존 release가 있으면 교체
  replace = true
  force_update = true
  wait = true
  timeout = 600  # 10분 타임아웃 (기본값 300초에서 증가)

  set = [
    # ---------------------------------------
    # ServiceAccount (IRSA)
    # ---------------------------------------
    {
      name  = "serviceAccount.create"
      value = "false"
    },
    {
      name  = "serviceAccount.name"
      value = local.fluentbit_serviceaccount
    },

    {
      name  = "outputs.elasticsearch.enabled"
      value = "false"
    },

    {
      name  = "cloudWatch.enabled"
      value = "true"
    },

    {
      name  = "config.outputs"
      value = <<-EOT
    [OUTPUT]
        Name cloudwatch_logs
        Match *
        region ${var.region}
        log_group_name /eks/${var.project_name}/${var.environment}/application
        log_stream_prefix fluentbit-
        auto_create_group true
    EOT
    },

    {
      name  = "daemonset.enabled"
      value = "true"
    },


    # ---------------------------------------
    # AWS / CloudWatch Logs
    # ---------------------------------------
    {
      name  = "cloudWatch.region"
      value = var.region
    },
    {
      name  = "cloudWatch.logGroupName"
      value = "/eks/${var.project_name}/${var.environment}/application"
    },
    {
      name  = "cloudWatch.logStreamPrefix"
      value = "fluentbit-"
    },

    # ---------------------------------------
    # DaemonSet
    # ---------------------------------------
    {
      name  = "daemonset.enabled"
      value = "true"
    },

    # ---------------------------------------
    # Resources
    # ---------------------------------------
    {
      name  = "resources.limits.memory"
      value = "200Mi"
    },
    {
      name  = "resources.requests.cpu"
      value = "100m"
    }
  ]

  depends_on = [
    kubernetes_service_account_v1.fluentbit,
    aws_iam_role_policy.fluentbit_cloudwatch,
    kubernetes_namespace_v1.logging
  ]
}