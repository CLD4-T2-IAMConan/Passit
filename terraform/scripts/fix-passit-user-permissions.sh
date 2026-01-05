#!/bin/bash

# passit_user 권한 수정 스크립트
# RDS에 접속해서 passit_user에게 passit_db 권한을 부여합니다.

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "❌ Error: $TERRAFORM_DIR 디렉토리가 존재하지 않습니다."
    exit 1
fi

echo "=========================================="
echo "passit_user 권한 수정"
echo "=========================================="
echo "Environment: ${ENVIRONMENT}"
echo "=========================================="
echo ""

cd "$TERRAFORM_DIR"

# Terraform output 값 추출
RDS_ENDPOINT=$(terraform output -raw rds_cluster_endpoint 2>/dev/null || echo "")
BASTION_ID=$(terraform output -raw bastion_instance_id 2>/dev/null || echo "")

if [ -z "$RDS_ENDPOINT" ]; then
    echo "❌ Error: RDS endpoint를 찾을 수 없습니다."
    exit 1
fi

if [ -z "$BASTION_ID" ]; then
    echo "❌ Error: Bastion instance ID를 찾을 수 없습니다."
    exit 1
fi

# DB 정보 (기본값)
DB_NAME="passit_db"
PASSIT_USER="passit_user"
PASSIT_PASSWORD="passit_password"
MASTER_USER="admin"
MASTER_PASSWORD=""

# Secrets Manager에서 가져오기 시도
if terraform output -raw db_secret_arn &>/dev/null; then
    SECRET_ARN=$(terraform output -raw db_secret_arn)
    if [ -n "$SECRET_ARN" ] && [ "$SECRET_ARN" != "null" ]; then
        echo "📋 Secrets Manager에서 DB 정보 가져오는 중..."
        if command -v jq &> /dev/null; then
            SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --query SecretString --output text 2>/dev/null || echo "")
            if [ -n "$SECRET_JSON" ]; then
                DB_NAME=$(echo "$SECRET_JSON" | jq -r '.dbname // "passit_db"' 2>/dev/null || echo "passit_db")
                MASTER_USER=$(echo "$SECRET_JSON" | jq -r '.username // "admin"' 2>/dev/null || echo "admin")
                MASTER_PASSWORD=$(echo "$SECRET_JSON" | jq -r '.password' 2>/dev/null || echo "")
                PASSIT_USER=$(echo "$SECRET_JSON" | jq -r '.passit_user // "passit_user"' 2>/dev/null || echo "passit_user")
                PASSIT_PASSWORD=$(echo "$SECRET_JSON" | jq -r '.passit_password // "passit_password"' 2>/dev/null || echo "passit_password")
            fi
        fi
    fi
fi

# Master password가 없으면 terraform 변수에서 가져오기 시도
if [ -z "$MASTER_PASSWORD" ]; then
    echo "⚠️  Master password를 찾을 수 없습니다."
    echo "   terraform.tfvars 파일에서 rds_master_password를 확인하거나"
    echo "   직접 입력하세요:"
    echo ""
    echo "   또는 terraform.tfvars 파일을 확인:"
    echo "   grep rds_master_password $TERRAFORM_DIR/terraform.tfvars"
    echo ""
    read -sp "Master password (입력하지 않으면 스크립트 종료): " MASTER_PASSWORD
    echo ""
    if [ -z "$MASTER_PASSWORD" ]; then
        echo "❌ 비밀번호가 입력되지 않았습니다."
        exit 1
    fi
fi

# MySQL 클라이언트 확인
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL 클라이언트가 설치되어 있지 않습니다."
    echo "   macOS: brew install mysql-client"
    echo "   Ubuntu: sudo apt-get install mysql-client"
    exit 1
fi

echo "📋 RDS에 passit_user 권한 수정 중..."
echo "   Endpoint: $RDS_ENDPOINT"
echo "   Database: $DB_NAME"
echo "   User: $PASSIT_USER"
echo ""

# 기존 포트 포워딩 프로세스 확인 및 종료
LOCAL_PORT=13306
REGION="ap-northeast-2"

if lsof -Pi :$LOCAL_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "⚠️  포트 $LOCAL_PORT가 이미 사용 중입니다. 기존 프로세스를 종료합니다..."
  kill -9 $(lsof -ti:$LOCAL_PORT) 2>/dev/null || true
  sleep 2
fi

# Session Manager를 통한 포트 포워딩 (백그라운드)
echo "   포트 포워딩 시작..."
echo "   Bastion: $BASTION_ID"
echo "   RDS: $RDS_ENDPOINT"
echo "   Local Port: $LOCAL_PORT"

SSM_LOG_FILE=$(mktemp)
aws ssm start-session \
  --target "$BASTION_ID" \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters "{\"host\":[\"$RDS_ENDPOINT\"],\"portNumber\":[\"3306\"],\"localPortNumber\":[\"$LOCAL_PORT\"]}" \
  --region "$REGION" > "$SSM_LOG_FILE" 2>&1 &

SSM_PID=$!
echo "   포트 포워딩 시작 (PID: $SSM_PID)"
sleep 20

# 포트가 열릴 때까지 대기
echo "   포트 연결 확인 중..."
for i in {1..15}; do
  if nc -z 127.0.0.1 $LOCAL_PORT 2>/dev/null; then
    echo "   ✅ 포트 연결 성공"
    break
  fi
  echo "   연결 대기 중... ($i/15)"
  sleep 2
  
  # SSM 프로세스가 살아있는지 확인
  if ! ps -p $SSM_PID > /dev/null 2>&1; then
    echo "❌ SSM 포트 포워딩 프로세스가 종료되었습니다."
    echo "   로그 확인:"
    tail -20 "$SSM_LOG_FILE" 2>/dev/null || true
    rm -f "$SSM_LOG_FILE"
    exit 1
  fi
done

if ! nc -z 127.0.0.1 $LOCAL_PORT 2>/dev/null; then
  echo "❌ 포트 연결 실패 (30초 후에도 연결되지 않음)"
  echo "   SSM 로그:"
  tail -20 "$SSM_LOG_FILE" 2>/dev/null || true
  kill $SSM_PID 2>/dev/null || true
  rm -f "$SSM_LOG_FILE"
  exit 1
fi

# 로그 파일 정리 (성공 시)
rm -f "$SSM_LOG_FILE"

# MySQL 명령 실행
echo ""
echo "🔧 MySQL 권한 수정 중..."

# MySQL 명령을 파일로 작성
SQL_FILE=$(mktemp)
cat > "$SQL_FILE" <<'SQL'
CREATE DATABASE IF NOT EXISTS `passit_db`;
CREATE USER IF NOT EXISTS 'passit_user'@'%' IDENTIFIED BY 'passit_password';
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'passit_user'@'%';
GRANT ALL PRIVILEGES ON `passit_db`.* TO 'passit_user'@'%';
FLUSH PRIVILEGES;
SHOW GRANTS FOR 'passit_user'@'%';
SELECT User, Host, Db FROM mysql.db WHERE User = 'passit_user';
SQL

# MySQL 연결 테스트 먼저 수행
echo "   MySQL 연결 테스트 중..."
if ! mysql -h 127.0.0.1 -P $LOCAL_PORT -u "$MASTER_USER" -p"$MASTER_PASSWORD" -e "SELECT 1;" 2>&1 | grep -q "1"; then
  echo "❌ MySQL 연결 실패"
  echo ""
  echo "연결 테스트 결과:"
  mysql -h 127.0.0.1 -P $LOCAL_PORT -u "$MASTER_USER" -p"$MASTER_PASSWORD" -e "SELECT 1;" 2>&1 | grep -v "Using a password" || true
  rm -f "$SQL_FILE"
  kill $SSM_PID 2>/dev/null || true
  exit 1
fi
echo "   ✅ MySQL 연결 성공"

# MySQL 명령 실행 (macOS 호환)
echo "   MySQL 명령 실행 중..."
MYSQL_OUTPUT=$(mysql -h 127.0.0.1 -P $LOCAL_PORT -u "$MASTER_USER" -p"$MASTER_PASSWORD" < "$SQL_FILE" 2>&1)
MYSQL_EXIT_CODE=$?

if [ $MYSQL_EXIT_CODE -eq 0 ]; then
  echo "   ✅ MySQL 명령 실행 성공"
  echo ""
  echo "📋 실행 결과:"
  echo "$MYSQL_OUTPUT" | grep -v "Using a password" || true
else
  echo "❌ MySQL 명령 실행 실패 (exit code: $MYSQL_EXIT_CODE)"
  echo ""
  echo "에러 메시지:"
  echo "$MYSQL_OUTPUT" | grep -v "Using a password" || true
  rm -f "$SQL_FILE"
  kill $SSM_PID 2>/dev/null || true
  exit 1
fi

rm -f "$SQL_FILE"

echo ""
echo "✅ passit_user 권한 수정 완료!"

# SSM 세션 종료
kill $SSM_PID 2>/dev/null || true
sleep 1

echo ""
echo "다음 단계:"
echo "1. Pod를 재시작하여 새로운 권한 적용"
echo "   kubectl rollout restart deployment -n <namespace> <deployment-name>"
echo ""

