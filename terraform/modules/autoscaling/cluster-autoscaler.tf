# autoscaling - cluster-autoscaler.tf

resource "helm_release" "cluster_autoscaler" {
  name       = "cluster-autoscaler"
  namespace  = "kube-system"
  repository = "https://kubernetes.github.io/autoscaler"
  chart      = "cluster-autoscaler"
  version    = "9.29.3"

  timeout = 600 # 10분 timeout

  values = [
    yamlencode({
      autoDiscovery = {
        clusterName = var.cluster_name
      }

      awsRegion = var.region

      rbac = {
        serviceAccount = {
          create = true
          name   = "cluster-autoscaler"
          annotations = {
            "eks.amazonaws.com/role-arn" = aws_iam_role.cluster_autoscaler.arn
          }
        }
      }

      extraArgs = {
        balance-similar-node-groups = "true"
        skip-nodes-with-system-pods = "false"
      }
    })
  ]
}
