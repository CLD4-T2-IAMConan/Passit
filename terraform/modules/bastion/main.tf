# Bastion Host Module

# 최신 Amazon Linux 2023 AMI 조회
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Bastion Host Security Group
resource "aws_security_group" "bastion" {
  name_prefix = "${var.project_name}-${var.environment}-bastion-"
  description = "Security group for Bastion Host"
  vpc_id      = var.vpc_id

  # SSH 접근 (특정 IP에서만 허용)
  ingress {
    description = "SSH from allowed CIDR blocks"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # 아웃바운드: 모든 트래픽 허용
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    {
      Name        = "${var.project_name}-${var.environment}-bastion-sg"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = var.owner
      Team        = var.team
    },
    var.tags
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Session Manager를 위한 IAM Role
resource "aws_iam_role" "bastion" {
  count = var.enable_session_manager ? 1 : 0

  name_prefix = "${var.project_name}-${var.environment}-bastion-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    {
      Name        = "${var.project_name}-${var.environment}-bastion-role"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = var.owner
      Team        = var.team
    },
    var.tags
  )
}

# Session Manager 정책 연결
resource "aws_iam_role_policy_attachment" "bastion_ssm" {
  count = var.enable_session_manager ? 1 : 0

  role       = aws_iam_role.bastion[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "bastion" {
  count = var.enable_session_manager ? 1 : 0

  name_prefix = "${var.project_name}-${var.environment}-bastion-"
  role        = aws_iam_role.bastion[0].name

  tags = merge(
    {
      Name        = "${var.project_name}-${var.environment}-bastion-profile"
      Environment = var.environment
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}

# Bastion Host EC2 Instance
resource "aws_instance" "bastion" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type
  subnet_id     = var.public_subnet_id

  vpc_security_group_ids = [aws_security_group.bastion.id]

  # Session Manager 사용 시 Instance Profile 연결
  iam_instance_profile = var.enable_session_manager ? aws_iam_instance_profile.bastion[0].name : null

  # SSH 키페어 (선택적)
  key_name = var.key_name != "" ? var.key_name : null

  # User data: 필요한 패키지 설치 (postgresql-client, redis-cli 등)
  user_data = <<-EOF
              #!/bin/bash
              set -e

              # 시스템 업데이트
              dnf update -y

              # PostgreSQL 클라이언트 설치
              dnf install -y postgresql15

              # Redis CLI 설치
              dnf install -y redis6

              # 유용한 도구 설치
              dnf install -y telnet nc bind-utils wget curl

              # Session Manager 플러그인 설치 (선택적)
              curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/linux_64bit/session-manager-plugin.rpm" -o "session-manager-plugin.rpm"
              dnf install -y session-manager-plugin.rpm
              rm -f session-manager-plugin.rpm

              echo "Bastion Host setup completed" > /var/log/bastion-setup.log
              EOF

  # 종료 방지 (실수로 인스턴스 삭제 방지)
  disable_api_termination = var.environment == "prod" ? true : false

  # EBS 최적화
  ebs_optimized = true

  # 루트 볼륨 설정
  root_block_device {
    volume_type           = "gp3"
    volume_size           = 30
    delete_on_termination = true
    encrypted             = true

    tags = merge(
      {
        Name        = "${var.project_name}-${var.environment}-bastion-root"
        Environment = var.environment
        ManagedBy   = "Terraform"
      },
      var.tags
    )
  }

  # 메타데이터 옵션 (보안 강화)
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2 강제
    http_put_response_hop_limit = 1
  }

  tags = merge(
    {
      Name        = "${var.project_name}-${var.environment}-bastion"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = var.owner
      Team        = var.team
      Role        = "Bastion"
    },
    var.tags
  )

  # AMI와 user_data 변경 시 인스턴스 재생성 방지
  # AMI는 최신 버전으로 자동 업데이트되지 않도록 하고,
  # user_data 변경도 인스턴스 재생성을 유발하지 않도록 함
  lifecycle {
    ignore_changes = [
      ami,
      user_data,
      user_data_replace_on_change
    ]
  }
}

# RDS Security Group에 Bastion 접근 허용
resource "aws_security_group_rule" "rds_from_bastion" {
  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.bastion.id
  security_group_id        = var.rds_security_group_id
  description              = "Allow MySQL access from Bastion Host"
}

# ElastiCache Security Group에 Bastion 접근 허용
resource "aws_security_group_rule" "elasticache_from_bastion" {
  type                     = "ingress"
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.bastion.id
  security_group_id        = var.elasticache_security_group_id
  description              = "Allow Redis/Valkey access from Bastion Host"
}

# EKS Cluster Security Group에 Bastion 접근 허용 (선택적)
# ⚠️ 주의: var.eks_cluster_security_group_id가 리소스 output인 경우,
# terraform plan 시 "count value depends on resource attributes" 에러가 발생할 수 있습니다.
# 이 경우 terraform apply 시 -target 옵션을 사용하여 EKS 클러스터를 먼저 생성하거나,
# 변수를 직접 문자열로 전달하여 계획 단계에서 결정 가능하도록 해야 합니다.
resource "aws_security_group_rule" "eks_from_bastion" {
  # for_each를 사용하여 빈 set을 허용
  # 변수가 리소스 output인 경우, 계획 단계에서 값을 알 수 없을 수 있음
  # 이 경우 terraform apply 시 -target 옵션을 사용하여 EKS 클러스터를 먼저 생성해야 함
  for_each = var.eks_cluster_security_group_id != null && var.eks_cluster_security_group_id != "" ? { create = true } : {}

  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.bastion.id
  security_group_id        = var.eks_cluster_security_group_id
  description              = "Allow HTTPS access from Bastion Host to EKS API"
}
