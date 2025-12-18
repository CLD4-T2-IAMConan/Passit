# Security Groups

# ============================================
# ALB용 Security Group
# ============================================

resource "aws_security_group" "alb" {
  name        = "${var.project_name}-${var.environment}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }


  tags = {
    Name        = "${var.project_name}-${var.environment}-alb-sg"
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "ALB security"
  }
}

# ============================================
# EKS Worker Node용 Security Group
# ============================================

resource "aws_security_group" "eks_worker" {
  name        = "${var.project_name}-${var.environment}-eks-sg"
  description = "Security group for EKS worker nodes"
  vpc_id      = var.vpc_id

  ingress {
    description     = "MSA service ports from ALB"
    from_port       = 8081
    to_port         = 8085
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "Allow traffic from other worker nodes"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    self        = true
  }

  egress {
      description = "Allow all outbound traffic"
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = ["0.0.0.0/0"]
  }


  tags = {
    Name        = "${var.project_name}-${var.environment}-eks-sg"
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "EKS worker node security"
  }
}

# ============================================
# RDS용 Security Group (Aurora MySQL)
# ============================================

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-${var.environment}-rds-sg"
  description = "Security group for Aurora MySQL database"
  vpc_id      = var.vpc_id

  ingress {
    description     = "MySQL from EKS worker nodes"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_worker.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-rds-sg"
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "Aurora MySQL security"
  }
}

# ============================================
# ElastiCache용 Security Group (Valkey)
# ============================================

resource "aws_security_group" "elasticache" {
  name        = "${var.project_name}-${var.environment}-elasticache-sg"
  description = "Security group for ElastiCache Valkey"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Valkey from EKS worker nodes"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_worker.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-elasticache-sg"
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "ElastiCache Valkey security"
  }
}
