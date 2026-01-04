# Secrets Manager

# ============================================
# Database (RDS) 자격 증명 저장
# ============================================

resource "aws_secretsmanager_secret" "db" {
  name                    = "${var.project_name}/${var.environment}/db"
  description             = "RDS database credentials (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)"
  recovery_window_in_days = 0

  kms_key_id = aws_kms_key.secrets.arn

  tags = {
    Name        = "${var.project_name}-db-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "Database credentials"
  }
}

# Database 자격 증명 값 (tfvars에서 설정)
resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    DB_HOST     = var.db_secrets.db_host
    DB_PORT     = var.db_secrets.db_port
    DB_NAME     = var.db_secrets.db_name
    DB_USER     = var.db_secrets.db_user
    DB_PASSWORD = var.db_secrets.db_password
  })
}

# ============================================
# Email (SMTP) 자격 증명
# ============================================

resource "aws_secretsmanager_secret" "smtp" {
  name                    = "${var.project_name}/${var.environment}/smtp"
  description             = "SMTP email credentials (MAIL_USERNAME, MAIL_PASSWORD)"
  recovery_window_in_days = 0

  kms_key_id = aws_kms_key.secrets.arn

  tags = {
    Name        = "${var.project_name}-smtp-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "SMTP email credentials"
  }
}

# SMTP 자격 증명 값 (tfvars에서 설정)
resource "aws_secretsmanager_secret_version" "smtp" {
  secret_id = aws_secretsmanager_secret.smtp.id
  secret_string = jsonencode({
    MAIL_USERNAME = var.smtp_secrets.mail_username
    MAIL_PASSWORD = var.smtp_secrets.mail_password
  })
}

# ============================================
# OAuth (Kakao Login) 자격 증명
# ============================================

resource "aws_secretsmanager_secret" "kakao" {
  name                    = "${var.project_name}/${var.environment}/kakao"
  description             = "Kakao OAuth credentials (KAKAO_REST_API_KEY, KAKAO_CLIENT_SECRET, KAKAO_ADMIN_KEY)"
  recovery_window_in_days = 0

  kms_key_id = aws_kms_key.secrets.arn

  tags = {
    Name        = "${var.project_name}-kakao-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "Kakao OAuth credentials"
  }
}

# Kakao OAuth 자격 증명 값 (tfvars에서 설정)
resource "aws_secretsmanager_secret_version" "kakao" {
  secret_id = aws_secretsmanager_secret.kakao.id
  secret_string = jsonencode({
    KAKAO_REST_API_KEY  = var.kakao_secrets.rest_api_key
    KAKAO_CLIENT_SECRET = var.kakao_secrets.client_secret
    KAKAO_ADMIN_KEY     = var.kakao_secrets.admin_key
  })
}

# ============================================
# Initial Admin Account
# ============================================

resource "aws_secretsmanager_secret" "admin" {
  name                    = "${var.project_name}/${var.environment}/admin"
  description             = "Initial admin account credentials (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_NICKNAME)"
  recovery_window_in_days = 0

  kms_key_id = aws_kms_key.secrets.arn

  tags = {
    Name        = "${var.project_name}-admin-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "Initial admin account"
  }
}

# Admin 계정 자격 증명 값 (tfvars에서 설정)
resource "aws_secretsmanager_secret_version" "admin" {
  secret_id = aws_secretsmanager_secret.admin.id
  secret_string = jsonencode({
    ADMIN_EMAIL    = var.admin_secrets.email
    ADMIN_PASSWORD = var.admin_secrets.password
    ADMIN_NAME     = var.admin_secrets.name
    ADMIN_NICKNAME = var.admin_secrets.nickname
  })
}

# ============================================
# 애플리케이션 시크릿 (기타)
# ============================================

resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${var.project_name}/${var.environment}/app/secrets"
  description             = "Application secrets (JWT secrets, API keys, etc.)"
  recovery_window_in_days = 0

  kms_key_id = aws_kms_key.secrets.arn

  tags = {
    Name        = "${var.project_name}-app-secrets-${var.environment}"
    Project     = var.project_name
    Environment = var.environment
    Purpose     = "Application secrets"
  }
}

# 애플리케이션 시크릿 값 (tfvars에서 설정)
resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    jwt_secret = var.app_secrets.jwt_secret
    api_key    = var.app_secrets.api_key
  })
}

# ============================================
# ElastiCache 자격 증명 (필요시)
# ============================================

resource "aws_secretsmanager_secret" "elasticache_credentials" {
  name                    = "${var.project_name}/elasticache/credentials/${var.environment}"
  description             = "ElastiCache credentials"
  recovery_window_in_days = 0

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
    auth_token = var.elasticache_secrets.auth_token
  })
}
