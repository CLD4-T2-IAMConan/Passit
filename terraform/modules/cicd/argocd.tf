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
  
  timeout = 1200  # 20분 timeout (ArgoCD 설치에 시간이 걸림)
  
  # CRD는 이미 존재하므로 건너뛰기 (resource policy로 보호됨)
  skip_crds = true
  replace   = false
  
  # 기존 리소스를 Helm이 adopt하도록 설정
  force_update = true
  wait         = true
  wait_for_jobs = true
  
  depends_on = [kubernetes_namespace_v1.argocd]

  values = [
    <<EOF
server:
  service:
    enabled: true
    type: ClusterIP
  ingress:
    enabled: true
    ingressClassName: alb
    hosts:
      - host: argocd.passit.com
        paths:
          - /
    annotations:
      alb.ingress.kubernetes.io/scheme: internet-facing
      alb.ingress.kubernetes.io/target-type: ip
      alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":80}]'
repoServer:
  # DNS 설정 개선
  dnsPolicy: ClusterFirst
  dnsConfig:
    options:
      - name: ndots
        value: "2"
      - name: edns0
EOF
  ]
}