# ArgoCD Installation (Helm-based)

# ArgoCD Namespace 생성
resource "kubernetes_namespace_v1" "argocd" {
  metadata {
    name = var.argocd_namespace
    labels = {
      name = var.argocd_namespace
    }
  }
}

resource "helm_release" "argocd" {
  name       = "argocd"
  namespace  = var.argocd_namespace
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  version    = var.argocd_chart_version

  timeout = 1200 # 20분 timeout (ArgoCD 설치에 시간이 걸림)

  # CRD는 이미 존재하므로 건너뛰기 (resource policy로 보호됨)
  skip_crds = true
  replace   = true # 기존 release가 있으면 교체

  # 기존 리소스를 Helm이 adopt하도록 설정
  force_update  = true
  wait          = true
  wait_for_jobs = true

  depends_on = [
    kubernetes_namespace_v1.argocd,
    helm_release.alb_controller # ALB Controller가 먼저 설치되어야 webhook이 준비됨
  ]

  values = [
    templatefile("${path.module}/values-argocd.yaml", {
      project_name = var.project_name
      environment  = var.environment
      alb_dns_name = "passit-dev-argocd-alb-1088954945.ap-northeast-2.elb.amazonaws.com" # ALB DNS is determined after ingress creation
    })
  ]
}