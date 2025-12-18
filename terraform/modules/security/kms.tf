# KMS Keys

# ============================================
# Secrets Manager용 KMS 키
# ============================================

resource "aws_kms_key" "secrets" {
  description             = "KMS key for Secrets Manager encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project_name}-secrets-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "Secrets Manager encryption"
  }
}

resource "aws_kms_alias" "secrets" {
  name          = "alias/${var.project_name}-secrets-${var.environment}"
  target_key_id = aws_kms_key.secrets.key_id
}

# ============================================
# RDS용 KMS 키
# ============================================

resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project_name}-rds-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "RDS encryption"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${var.project_name}-rds-${var.environment}"
  target_key_id = aws_kms_key.rds.key_id
}

# ============================================
# ElastiCache용 KMS 키
# ============================================

resource "aws_kms_key" "elasticache" {
  description             = "KMS key for ElastiCache encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project_name}-elasticache-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "ElastiCache encryption"
  }
}

resource "aws_kms_alias" "elasticache" {
  name          = "alias/${var.project_name}-elasticache-${var.environment}"
  target_key_id = aws_kms_key.elasticache.key_id
}

# ============================================
# EBS 볼륨용 KMS 키 (EKS Node Group)
# ============================================

resource "aws_kms_key" "ebs" {
  description             = "KMS key for EBS volume encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project_name}-ebs-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "EBS volume encryption"
  }
}

resource "aws_kms_alias" "ebs" {
  name          = "alias/${var.project_name}-ebs-${var.environment}"
  target_key_id = aws_kms_key.ebs.key_id
}
