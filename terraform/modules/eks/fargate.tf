# 1. Fargate 실행을 위한 IAM Role
resource "aws_iam_role" "fargate" {
  name = "${var.project_name}-${var.environment}-fargate-role"

  assume_role_policy = jsonencode({
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "eks-fargate-pods.amazonaws.com" }
    }]
    Version = "2012-10-17"
  })
}

# 2. IAM 정책 연결 (Fargate 실행 및 로깅)
resource "aws_iam_role_policy_attachment" "fargate_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy"
  role       = aws_iam_role.fargate.name
}

resource "aws_iam_role_policy_attachment" "fargate_logging" {
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
  role       = aws_iam_role.fargate.name
}


# 3. Fargate Profile 설정 (AWS 제한: 최대 5개 selector)
# 시스템 네임스페이스용 Profile
resource "aws_eks_fargate_profile" "system" {
  cluster_name           = module.eks.cluster_name
  fargate_profile_name   = "fp-system"
  pod_execution_role_arn = aws_iam_role.fargate.arn
  subnet_ids             = var.private_subnet_ids

  selector { namespace = "kube-system" } # CoreDNS를 위해 필수
  selector { namespace = "argocd" }
  selector { namespace = "monitoring" }
}

# 서비스 네임스페이스용 Profile
resource "aws_eks_fargate_profile" "services" {
  cluster_name           = module.eks.cluster_name
  fargate_profile_name   = "fp-services"
  pod_execution_role_arn = aws_iam_role.fargate.arn
  subnet_ids             = var.private_subnet_ids

  selector { namespace = "account" }
  selector { namespace = "chat" }
  selector { namespace = "cs" }
  selector { namespace = "trade" }
  selector { namespace = "ticket" }
}

# 4. CoreDNS 애드온 설정 (Fargate 전용)
resource "aws_eks_addon" "coredns" {
  cluster_name                = module.eks.cluster_name
  addon_name                  = "coredns"
  addon_version               = "v1.11.4-eksbuild.24"
  resolve_conflicts_on_update = "OVERWRITE" # 에러났던 중복 속성 정리됨

  depends_on = [aws_eks_fargate_profile.system]

  configuration_values = jsonencode({
    computeType = "fargate"
  })
}