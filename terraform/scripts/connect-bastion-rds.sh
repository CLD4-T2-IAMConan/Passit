#!/bin/bash

# Bastion을 통한 RDS 접속 스크립트 (Session Manager Port Forwarding)
# Terraform output에서 자동으로 값을 가져와서 RDS에 접속합니다.

set -e

ENVIRONMENT=${1:-dev}
REGION=${2:-ap-northeast-2}
LOCAL_PORT=${3:-3306}  # MySQL 기본 포트

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "❌ Error: $TERRAFORM_DIR 디렉토리가 존재하지 않습니다."
    exit 1
fi

echo "=========================================="
echo "Bastion을 통한 RDS 접속 (Session Manager)"
echo "=========================================="
echo "Environment: ${ENVIRONMENT}"
echo "Region: ${REGION}"
echo "Local Port: ${LOCAL_PORT}"
echo "=========================================="
echo ""

# Terraform output에서 값 가져오기
cd "$TERRAFORM_DIR"

echo "📋 Terraform output에서 정보 가져오는 중..."
BASTION_INSTANCE_ID=$(terraform output -raw bastion_instance_id 2>/dev/null || echo "")
RDS_ENDPOINT=$(terraform output -raw rds_cluster_endpoint 2>/dev/null || echo "")

if [ -z "$BASTION_INSTANCE_ID" ]; then
    echo "❌ Error: Bastion Instance ID를 찾을 수 없습니다."
    echo "   Terraform apply를 먼저 실행하세요."
    exit 1
fi

if [ -z "$RDS_ENDPOINT" ]; then
    echo "❌ Error: RDS Endpoint를 찾을 수 없습니다."
    echo "   Terraform apply를 먼저 실행하세요."
    exit 1
fi

echo "  ✅ Bastion Instance ID: ${BASTION_INSTANCE_ID}"
echo "  ✅ RDS Endpoint: ${RDS_ENDPOINT}"
echo ""

# Session Manager Plugin 설치 확인
if ! command -v session-manager-plugin &> /dev/null; then
    echo "⚠️  Session Manager Plugin이 설치되어 있지 않습니다."
    echo ""
    echo "설치 방법:"
    echo "  macOS:   brew install --cask session-manager-plugin"
    echo "  Linux:   https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html"
    echo ""
    read -p "계속하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 포트 사용 중인지 확인
if lsof -Pi :$LOCAL_PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  포트 $LOCAL_PORT가 이미 사용 중입니다."
    echo ""
    echo "사용 중인 프로세스:"
    lsof -Pi :$LOCAL_PORT -sTCP:LISTEN
    echo ""
    read -p "프로세스를 종료하고 계속하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill -9 $(lsof -ti:$LOCAL_PORT) 2>/dev/null || true
        sleep 1
    else
        echo "취소되었습니다."
        exit 1
    fi
fi

echo "🚀 RDS Port Forwarding 시작..."
echo ""
echo "  Local:  localhost:${LOCAL_PORT}"
echo "  Remote: ${RDS_ENDPOINT}:3306"
echo ""
echo "접속 방법:"
echo "  MySQL:   mysql -h 127.0.0.1 -P ${LOCAL_PORT} -u admin -p"
echo "  또는:    mysql -h localhost -P ${LOCAL_PORT} -u admin -p"
echo ""
echo "⚠️  이 터미널을 닫으면 포트 포워딩이 종료됩니다."
echo "   Ctrl+C로 종료할 수 있습니다."
echo ""
echo "=========================================="
echo ""

# Session Manager Port Forwarding 시작
aws ssm start-session \
  --target "$BASTION_INSTANCE_ID" \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters "{\"host\":[\"${RDS_ENDPOINT}\"],\"portNumber\":[\"3306\"],\"localPortNumber\":[\"${LOCAL_PORT}\"]}" \
  --region "$REGION"

