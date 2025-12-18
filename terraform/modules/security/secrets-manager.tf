# Secrets Manager

# ============================================
# Database (RDS) 자격 증명 저장
# ============================================

resource "aws_secretsmanager_secret" "db" {
  name                    = "${var.project_name}/${var.environment}/db"
  description             = "RDS database credentials (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)"
  recovery_window_in_days = 7

  kms_key_id = aws_kms_key.secrets.arn

  tags = {
    Name        = "${var.project_name}-db-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "Database credentials"
  }
}

# Database 자격 증명 값 (초기값, 실제로는 수동으로 설정하거나 별도 스크립트로 설정)
resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    DB_HOST     = "" # RDS 생성 후 업데이트 필요
    DB_PORT     = "3306"
    DB_NAME     = "passit"
    DB_USER     = "admin"
    DB_PASSWORD = "CHANGE_ME_IN_PRODUCTION" # 프로덕션에서는 반드시 변경 필요
  })
}

# ============================================
# Email (SMTP) 자격 증명
# ============================================

resource "aws_secretsmanager_secret" "smtp" {
  name                    = "${var.project_name}/${var.environment}/smtp"
  description             = "SMTP email credentials (MAIL_USERNAME, MAIL_PASSWORD)"
  recovery_window_in_days = 7

  kms_key_id = aws_kms_key.secrets.arn

  tags = {
    Name        = "${var.project_name}-smtp-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "SMTP email credentials"
  }
}

# SMTP 자격 증명 값 (초기값)
resource "aws_secretsmanager_secret_version" "smtp" {
  secret_id = aws_secretsmanager_secret.smtp.id
  secret_string = jsonencode({
    MAIL_USERNAME = "CHANGE_ME_IN_PRODUCTION" # Gmail 계정
    MAIL_PASSWORD = "CHANGE_ME_IN_PRODUCTION" # Gmail 앱 비밀번호
  })
}

# ============================================
# OAuth (Kakao Login) 자격 증명
# ============================================

resource "aws_secretsmanager_secret" "kakao" {
  name                    = "${var.project_name}/${var.environment}/kakao"
  description             = "Kakao OAuth credentials (KAKAO_REST_API_KEY, KAKAO_CLIENT_SECRET, KAKAO_ADMIN_KEY)"
  recovery_window_in_days = 7

  kms_key_id = aws_kms_key.secrets.arn

  tags = {
    Name        = "${var.project_name}-kakao-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "Kakao OAuth credentials"
  }
}

# Kakao OAuth 자격 증명 값 (초기값)
resource "aws_secretsmanager_secret_version" "kakao" {
  secret_id = aws_secretsmanager_secret.kakao.id
  secret_string = jsonencode({
    KAKAO_REST_API_KEY  = "CHANGE_ME_IN_PRODUCTION"
    KAKAO_CLIENT_SECRET = "CHANGE_ME_IN_PRODUCTION"
    KAKAO_ADMIN_KEY     = "CHANGE_ME_IN_PRODUCTION"
  })
}

# ============================================
# Initial Admin Account
# ============================================

resource "aws_secretsmanager_secret" "admin" {
  name                    = "${var.project_name}/${var.environment}/admin"
  description             = "Initial admin account credentials (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_NICKNAME)"
  recovery_window_in_days = 7

  kms_key_id = aws_kms_key.secrets.arn

  tags = {
    Name        = "${var.project_name}-admin-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "Initial admin account"
  }
}

# Admin 계정 자격 증명 값 (초기값)
resource "aws_secretsmanager_secret_version" "admin" {
  secret_id = aws_secretsmanager_secret.admin.id
  secret_string = jsonencode({
    ADMIN_EMAIL    = "admin@passit.com"
    ADMIN_PASSWORD = "CHANGE_ME_IN_PRODUCTION"
    ADMIN_NAME     = "Administrator"
    ADMIN_NICKNAME = "admin"
  })
}

# ============================================
# 애플리케이션 시크릿 (기타)
# ============================================

resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${var.project_name}/${var.environment}/app/secrets"
  description             = "Application secrets (JWT secrets, API keys, etc.)"
  recovery_window_in_days = 7

  kms_key_id = aws_kms_key.secrets.arn

  tags = {
    Name        = "${var.project_name}-app-secrets-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "Application secrets"
  }
}

# 애플리케이션 시크릿 값 (초기값)
resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    jwt_secret = "CHANGE_ME_IN_PRODUCTION"
    api_key    = "CHANGE_ME_IN_PRODUCTION"
  })
}

# ============================================
# ElastiCache 자격 증명 (필요시)
# ============================================

resource "aws_secretsmanager_secret" "elasticache_credentials" {
  name                    = "${var.project_name}/elasticache/credentials/${var.environment}"
  description             = "ElastiCache credentials"
  recovery_window_in_days = 7

  kms_key_id = aws_kms_key.secrets.arn

  tags = {
    Name        = "${var.project_name}-elasticache-credentials-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "ElastiCache credentials"
  }
}

resource "aws_secretsmanager_secret_version" "elasticache_credentials" {
  secret_id = aws_secretsmanager_secret.elasticache_credentials.id
  secret_string = jsonencode({
    auth_token = "CHANGE_ME_IN_PRODUCTION"
  })
}
