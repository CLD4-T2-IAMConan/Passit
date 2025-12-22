# ArgoCD Installation (Helm-based)

resource "kubernetes_namespace" "argocd" {
  metadata {
    name = var.argocd_namespace
  }
}

resource "helm_release" "argocd" {
  name       = "argocd"
  namespace  = kubernetes_namespace.argocd.metadata[0].name
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  version    = var.argocd_chart_version
  
  timeout = 600  # 10분 timeout
  
  # 기존 리소스가 Helm으로 관리되지 않은 경우를 대비
  skip_crds = false
  replace   = false

  values = [
    <<EOF
server:
  ingress:
    enabled: true
    ingressClassName: alb
    hosts:
      - argocd.passit.com
    annotations:
      kubernetes.io/ingress.class: alb
      alb.ingress.kubernetes.io/scheme: internet-facing
      alb.ingress.kubernetes.io/target-type: ip
      alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
      alb.ingress.kubernetes.io/backend-protocol: HTTPS
      alb.ingress.kubernetes.io/ssl-redirect: "443"
EOF
  ]
}