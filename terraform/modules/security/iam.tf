# IAM Roles and Policies

# ============================================
# EKS Cluster용 IAM 역할
# ============================================

# EKS Cluster Service Role
resource "aws_iam_role" "eks_cluster" {
  name = "${var.project_name}-eks-cluster-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-eks-cluster-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
  }
}

# EKS Cluster Service Role Policy Attachment
resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

# ============================================
# EKS Node Group용 IAM 역할
# ============================================

# EKS Node Group Role
resource "aws_iam_role" "eks_node_group" {
  name = "${var.project_name}-eks-node-group-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-eks-node-group-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
  }
}

# EKS Node Group Policy Attachments
resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_group.name
}

# ============================================
# CI/CD용 IAM 역할
# ============================================

# GitHub Actions용 IAM 역할 (OIDC)
resource "aws_iam_role" "github_actions" {
  name = "${var.project_name}-github-actions-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${var.account_id}:oidc-provider/token.actions.githubusercontent.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            # GitHub Actions에서 실제로 보내는 sub 클레임 형식:
            # - repo:ORG/REPO:ref:refs/heads/BRANCH (브랜치 push)
            # - repo:ORG/REPO:pull_request (PR)
            # - repo:ORG/REPO:workflow (워크플로우 dispatch)
            # 와일드카드 *는 모든 형식을 매칭합니다
            "token.actions.githubusercontent.com:sub" = var.github_org != "" && var.github_repo != "" ? "repo:${var.github_org}/${var.github_repo}:*" : "repo:CLD4-T2-IAMConan/Passit:*"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-github-actions-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
  }
}

# GitHub Actions 정책: ECR, EKS 접근
data "aws_iam_policy_document" "github_actions" {
  statement {
    sid    = "AllowEKSUpdate"
    effect = "Allow"
    actions = [
      "eks:DescribeCluster",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "AllowFrontendS3Deploy"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ]
    resources = [
      "arn:aws:s3:::${var.project_name}-${var.environment}-frontend-bucket",
      "arn:aws:s3:::${var.project_name}-${var.environment}-frontend-bucket/*"
    ]
  }

  statement {
    sid    = "AllowArtifactsBucket"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket"
    ]
    resources = [
      "arn:aws:s3:::${var.project_name}-artifacts-${var.environment}",
      "arn:aws:s3:::${var.project_name}-artifacts-${var.environment}/*"
    ]
  }

  dynamic "statement" {
    for_each = var.frontend_cloudfront_distribution_id != null && var.frontend_cloudfront_distribution_id != "" ? [1] : []
    content {
      sid    = "AllowCloudFrontInvalidation"
      effect = "Allow"
      actions = [
        "cloudfront:CreateInvalidation"
      ]
      # CloudFront는 리소스 레벨 권한을 지원하지 않으므로 * 사용
      resources = [
        "*"
      ]
    }
  }

  statement {
    sid    = "AllowS3ForTerraformState"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:ListBucket",
      "s3:DeleteObject"
    ]
    resources = [
      "arn:aws:s3:::${var.project_name}-terraform-state-${var.environment}",
      "arn:aws:s3:::${var.project_name}-terraform-state-${var.environment}/*"
    ]
  }

  statement {
    sid    = "AllowDynamoDBForTerraformLocks"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
      "dynamodb:DescribeTable"
    ]
    resources = [
      "arn:aws:dynamodb:${var.region}:${var.account_id}:table/${var.project_name}-terraform-locks-${var.environment}"
    ]
  }
}

resource "aws_iam_policy" "github_actions" {
  name        = "${var.project_name}-github-actions-${var.environment}"
  description = "Policy for GitHub Actions to deploy to EKS"
  policy      = data.aws_iam_policy_document.github_actions.json
}

resource "aws_iam_role_policy_attachment" "github_actions" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.github_actions.arn
}

# ============================================
# ArgoCD용 IAM 역할
# ============================================

# ArgoCD Server용 IAM 역할
resource "aws_iam_role" "argocd" {
  name = "${var.project_name}-argocd-${var.environment}"

  assume_role_policy = var.eks_cluster_name != "" ? jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${var.account_id}:oidc-provider/${replace(try(data.aws_eks_cluster.main[0].identity[0].oidc[0].issuer, ""), "https://", "")}"
        }
        Condition = {
          StringEquals = {
            "${replace(try(data.aws_eks_cluster.main[0].identity[0].oidc[0].issuer, ""), "https://", "")}:sub" = "system:serviceaccount:argocd:argocd-server"
            "${replace(try(data.aws_eks_cluster.main[0].identity[0].oidc[0].issuer, ""), "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
    }) : jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-argocd-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
  }
}

# ArgoCD 정책: EKS, ECR 접근
data "aws_iam_policy_document" "argocd" {
  statement {
    sid    = "AllowEKSAccess"
    effect = "Allow"
    actions = [
      "eks:DescribeCluster",
      "eks:ListClusters"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "AllowECRAccess"
    effect = "Allow"
    actions = [
      "ecr:GetAuthorizationToken",
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "argocd" {
  name        = "${var.project_name}-argocd-${var.environment}"
  description = "Policy for ArgoCD to access EKS and ECR"
  policy      = data.aws_iam_policy_document.argocd.json
}

resource "aws_iam_role_policy_attachment" "argocd" {
  role       = aws_iam_role.argocd.name
  policy_arn = aws_iam_policy.argocd.arn
}

# ============================================
# 모니터링용 IAM 역할
# ============================================

# Prometheus용 IAM 역할
resource "aws_iam_role" "prometheus" {
  name = "${var.project_name}-prometheus-${var.environment}"

  assume_role_policy = var.eks_cluster_name != "" ? jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${var.account_id}:oidc-provider/${replace(try(data.aws_eks_cluster.main[0].identity[0].oidc[0].issuer, ""), "https://", "")}"
        }
        Condition = {
          StringEquals = {
            "${replace(try(data.aws_eks_cluster.main[0].identity[0].oidc[0].issuer, ""), "https://", "")}:sub" = "system:serviceaccount:monitoring:prometheus"
            "${replace(try(data.aws_eks_cluster.main[0].identity[0].oidc[0].issuer, ""), "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
    }) : jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-prometheus-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
  }
}

# Prometheus 정책: CloudWatch, EKS 메트릭 수집
data "aws_iam_policy_document" "prometheus" {
  statement {
    sid    = "AllowCloudWatchMetrics"
    effect = "Allow"
    actions = [
      "cloudwatch:PutMetricData",
      "cloudwatch:GetMetricStatistics",
      "cloudwatch:ListMetrics"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "AllowEKSDescribe"
    effect = "Allow"
    actions = [
      "eks:DescribeCluster"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "prometheus" {
  name        = "${var.project_name}-prometheus-${var.environment}"
  description = "Policy for Prometheus to collect metrics"
  policy      = data.aws_iam_policy_document.prometheus.json
}

resource "aws_iam_role_policy_attachment" "prometheus" {
  role       = aws_iam_role.prometheus.name
  policy_arn = aws_iam_policy.prometheus.arn
}

# Fluent Bit용 IAM 역할
resource "aws_iam_role" "fluentbit" {
  name = "${var.project_name}-fluentbit-${var.environment}"

  assume_role_policy = var.eks_cluster_name != "" ? jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${var.account_id}:oidc-provider/${replace(try(data.aws_eks_cluster.main[0].identity[0].oidc[0].issuer, ""), "https://", "")}"
        }
        Condition = {
          StringEquals = {
            "${replace(try(data.aws_eks_cluster.main[0].identity[0].oidc[0].issuer, ""), "https://", "")}:sub" = "system:serviceaccount:logging:fluent-bit"
            "${replace(try(data.aws_eks_cluster.main[0].identity[0].oidc[0].issuer, ""), "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
    }) : jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-fluentbit-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
  }
}

# Fluent Bit 정책: CloudWatch Logs 쓰기
data "aws_iam_policy_document" "fluentbit" {
  statement {
    sid    = "AllowCloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams"
    ]
    resources = [
      "arn:aws:logs:${var.region}:${var.account_id}:log-group:/aws/eks/${var.project_name}-${var.environment}/*",
      "arn:aws:logs:${var.region}:${var.account_id}:log-group:/aws/eks/${var.project_name}-${var.environment}"
    ]
  }
}

resource "aws_iam_policy" "fluentbit" {
  name        = "${var.project_name}-fluentbit-${var.environment}"
  description = "Policy for Fluent Bit to send logs to CloudWatch"
  policy      = data.aws_iam_policy_document.fluentbit.json
}

resource "aws_iam_role_policy_attachment" "fluentbit" {
  role       = aws_iam_role.fluentbit.name
  policy_arn = aws_iam_policy.fluentbit.arn
}

# ============================================
# 애플리케이션용 IAM 역할 (IRSA)
# ============================================

# 애플리케이션 Pod용 IAM 역할 (Secrets Manager, RDS 접근)
resource "aws_iam_role" "app_pod" {
  name = "${var.project_name}-app-pod-${var.environment}"

  assume_role_policy = var.eks_cluster_name != "" ? jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${var.account_id}:oidc-provider/${replace(try(data.aws_eks_cluster.main[0].identity[0].oidc[0].issuer, ""), "https://", "")}"
        }
        Condition = {
          StringEquals = {
            "${replace(try(data.aws_eks_cluster.main[0].identity[0].oidc[0].issuer, ""), "https://", "")}:sub" = "system:serviceaccount:default:*"
            "${replace(try(data.aws_eks_cluster.main[0].identity[0].oidc[0].issuer, ""), "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
    }) : jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-app-pod-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
  }
}

# 애플리케이션 Pod 정책: Secrets Manager, RDS 접근
data "aws_iam_policy_document" "app_pod" {
  statement {
    sid    = "AllowSecretsManagerAccess"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]
    resources = [
      "arn:aws:secretsmanager:${var.region}:${var.account_id}:secret:${var.project_name}/*"
    ]
  }

  statement {
    sid    = "AllowKMSDecrypt"
    effect = "Allow"
    actions = [
      "kms:Decrypt",
      "kms:DescribeKey"
    ]
    resources = [
      aws_kms_key.secrets.arn
    ]
  }
}

resource "aws_iam_policy" "app_pod" {
  name        = "${var.project_name}-app-pod-${var.environment}"
  description = "Policy for application pods to access Secrets Manager and RDS"
  policy      = data.aws_iam_policy_document.app_pod.json
}

resource "aws_iam_role_policy_attachment" "app_pod" {
  role       = aws_iam_role.app_pod.name
  policy_arn = aws_iam_policy.app_pod.arn
}