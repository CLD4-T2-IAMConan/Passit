#!/bin/bash

# Valkey (ElastiCache) 연결 테스트 스크립트
# 사용법: ./test-valkey.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}
PROJECT_NAME="passit"
REGION="ap-northeast-2"
SECRET_NAME="${PROJECT_NAME}/${ENVIRONMENT}/valkey/connection"

echo "=========================================="
echo "Valkey 연결 테스트 - ${ENVIRONMENT} 환경"
echo "=========================================="

# AWS CLI 설치 확인
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI가 설치되어 있지 않습니다."
    echo "   설치: https://aws.amazon.com/cli/"
    exit 1
fi

# redis-cli 설치 확인
if ! command -v redis-cli &> /dev/null; then
    echo "⚠️  redis-cli가 설치되어 있지 않습니다."
    echo "   macOS: brew install redis"
    echo "   Ubuntu: sudo apt-get install redis-tools"
    echo ""
    echo "연결 정보만 확인하겠습니다..."
    REDIS_CLI_AVAILABLE=false
else
    REDIS_CLI_AVAILABLE=true
fi

# Secrets Manager에서 연결 정보 가져오기
echo ""
echo "📋 Secrets Manager에서 연결 정보 조회 중..."
SECRET_VALUE=$(aws secretsmanager get-secret-value \
    --secret-id "${SECRET_NAME}" \
    --region "${REGION}" \
    --query 'SecretString' \
    --output text 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "❌ Secrets Manager에서 연결 정보를 가져올 수 없습니다."
    echo "   Secret Name: ${SECRET_NAME}"
    echo "   Region: ${REGION}"
    exit 1
fi

# JSON 파싱 (jq 사용 가능하면)
if command -v jq &> /dev/null; then
    ENDPOINT=$(echo "$SECRET_VALUE" | jq -r '.primary_endpoint')
    PORT=$(echo "$SECRET_VALUE" | jq -r '.port')
    ENGINE=$(echo "$SECRET_VALUE" | jq -r '.engine')
else
    # jq 없으면 간단한 파싱
    ENDPOINT=$(echo "$SECRET_VALUE" | grep -o '"primary_endpoint"[^,]*' | cut -d'"' -f4)
    PORT=$(echo "$SECRET_VALUE" | grep -o '"port"[^,]*' | grep -o '[0-9]*')
    ENGINE=$(echo "$SECRET_VALUE" | grep -o '"engine"[^,]*' | cut -d'"' -f4)
fi

echo "✅ 연결 정보 확인 완료"
echo ""
echo "연결 정보:"
echo "  Engine: ${ENGINE}"
echo "  Endpoint: ${ENDPOINT}"
echo "  Port: ${PORT}"
echo ""

# redis-cli로 연결 테스트
if [ "$REDIS_CLI_AVAILABLE" = true ]; then
    echo "🔌 Valkey 연결 테스트 중..."
    
    # PING 테스트
    if redis-cli -h "$ENDPOINT" -p "$PORT" PING 2>/dev/null | grep -q "PONG"; then
        echo "✅ 연결 성공! PING -> PONG"
    else
        echo "❌ 연결 실패"
        echo ""
        echo "가능한 원인:"
        echo "  1. Security Group이 EKS 노드에서의 접근을 허용하지 않음"
        echo "  2. 네트워크 경로 문제 (VPC 내부에서만 접근 가능)"
        echo "  3. ElastiCache 클러스터가 아직 생성 중이거나 사용 불가능"
        echo ""
        echo "EKS Pod에서 테스트하려면:"
        echo "  kubectl run -it --rm redis-test --image=redis:7-alpine --restart=Never -- redis-cli -h ${ENDPOINT} -p ${PORT} PING"
        exit 1
    fi
    
    echo ""
    echo "📊 기본 정보 조회:"
    INFO=$(redis-cli -h "$ENDPOINT" -p "$PORT" INFO server 2>/dev/null | head -5)
    echo "$INFO"
    
    echo ""
    echo "🧪 데이터 쓰기/읽기 테스트:"
    TEST_KEY="test:valkey:connection"
    TEST_VALUE="$(date +%s)"
    
    redis-cli -h "$ENDPOINT" -p "$PORT" SET "$TEST_KEY" "$TEST_VALUE" > /dev/null 2>&1
    READ_VALUE=$(redis-cli -h "$ENDPOINT" -p "$PORT" GET "$TEST_KEY" 2>/dev/null)
    
    if [ "$READ_VALUE" = "$TEST_VALUE" ]; then
        echo "✅ 쓰기/읽기 성공!"
        echo "   Key: ${TEST_KEY}"
        echo "   Value: ${TEST_VALUE}"
    else
        echo "❌ 쓰기/읽기 실패"
        exit 1
    fi
    
    # 테스트 데이터 삭제
    redis-cli -h "$ENDPOINT" -p "$PORT" DEL "$TEST_KEY" > /dev/null 2>&1
    echo "✅ 테스트 데이터 삭제 완료"
    
    echo ""
    echo "=========================================="
    echo "✅ 모든 테스트 통과!"
    echo "=========================================="
else
    echo "⚠️  redis-cli가 없어 연결 테스트를 건너뜁니다."
    echo ""
    echo "EKS Pod에서 테스트하려면:"
    echo "  kubectl run -it --rm redis-test --image=redis:7-alpine --restart=Never -- redis-cli -h ${ENDPOINT} -p ${PORT} PING"
fi
