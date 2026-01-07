############################################
# Fluent Bit Helm Release
# 
# 주의: Fargate 환경에서는 DaemonSet을 지원하지 않으므로
# fluentbit을 사용할 수 없습니다. Fargate는 자동으로
# Pod의 stdout/stderr를 CloudWatch Logs에 전송합니다.
# 
# EC2 노드 그룹을 사용하는 경우에만 fluentbit을 활성화하세요.
############################################

resource "helm_release" "fluentbit" {
  count = var.enable_fluentbit ? 1 : 0  # Fargate에서는 비활성화

  name       = "fluent-bit"
  repository = "https://fluent.github.io/helm-charts"
  chart      = "fluent-bit"
  namespace  = var.fluentbit_namespace

  create_namespace = var.fluentbit_namespace != "kube-system" # kube-system은 기본 namespace이므로 생성하지 않음
  
  # 기존 release가 있으면 교체
  replace = true
  force_update = true
  wait = var.fluentbit_wait  # 환경별 wait 설정 (dev: false로 빠른 배포, prod: true로 안정성 확보)
  wait_for_jobs = false  # Job은 백그라운드에서 실행 (DaemonSet만 배포되면 완료)
  atomic = false  # 실패해도 롤백하지 않음 (이미 배포된 리소스 유지)
  timeout = var.fluentbit_timeout  # 환경별 timeout (dev: 10분, prod: 30분)

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
    # DaemonSet (Fargate에서는 지원하지 않음)
    # ---------------------------------------
    {
      name  = "daemonset.enabled"
      value = "false"  # Fargate는 DaemonSet을 지원하지 않으므로 비활성화
    },
    
    # ---------------------------------------
    # Deployment (Fargate 호환)
    # ---------------------------------------
    {
      name  = "deployment.enabled"
      value = "false"  # Fargate는 기본 로깅을 사용하므로 Deployment도 비활성화
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
    },

    # ---------------------------------------
    # Image Pull Policy (빠른 배포를 위해)
    # ---------------------------------------
    {
      name  = "image.pullPolicy"
      value = "IfNotPresent"  # 이미지가 있으면 pull하지 않음 (배포 속도 향상)
    }
  ]

  depends_on = [
    kubernetes_service_account_v1.fluentbit[0],
    aws_iam_role_policy.fluentbit_cloudwatch[0]
  ]
}