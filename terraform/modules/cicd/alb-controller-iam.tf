# 서비스 irsa와 분리
################################################
# AWS Load Balancer Controller - IRSA
################################################

resource "aws_iam_role" "alb_controller" {
  name = "${var.project_name}-${var.environment}-alb-controller"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${var.oidc_provider_url}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
        }
      }
    }]
  })
}

resource "aws_iam_policy" "alb_controller" {
  name   = "${var.project_name}-${var.environment}-alb-controller"
  policy = file("${path.module}/policies/alb-controller.json")
}

resource "aws_iam_role_policy_attachment" "alb_controller" {
  role       = aws_iam_role.alb_controller.name
  policy_arn = aws_iam_policy.alb_controller.arn
}


# 기존 로직 하단에 추가
resource "aws_iam_role_policy" "alb_controller_additional_access" {
  name = "${var.project_name}-${var.environment}-alb-additional"
  role = aws_iam_role.alb_controller.id # 위에서 정의한 role name/id 참조

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "acm:ListCertificates",
          "acm:DescribeCertificate",
          "acm:GetCertificate",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeVpcs",
          "ec2:DescribeRouteTables",
          "ec2:DescribeInstances",
          "ec2:DescribeAvailabilityZones",
          "elasticloadbalancing:*"
        ]
        Resource = "*"
      }
    ]
  })
}