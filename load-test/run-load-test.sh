#!/bin/bash

# 부하 테스트 실행 스크립트
# 사용법: ./run-load-test.sh [env] [script]
# 예: ./run-load-test.sh dev auth.js

ENV=${1:-dev}
SCRIPT=${2:-user-journey.js}

# 환경별 설정 로드
CONFIG_FILE="config/${ENV}.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ 설정 파일을 찾을 수 없습니다: $CONFIG_FILE"
    exit 1
fi

# 설정 파일에서 값 추출 (jq 필요)
BASE_URL=$(cat "$CONFIG_FILE" | grep -o '"baseUrl": "[^"]*' | cut -d'"' -f4)
TEST_EMAIL=$(cat "$CONFIG_FILE" | grep -o '"testEmail": "[^"]*' | cut -d'"' -f4)
TEST_EMAIL_PREFIX=$(cat "$CONFIG_FILE" | grep -o '"testEmailPrefix": "[^"]*' | cut -d'"' -f4)
TEST_PASSWORD=$(cat "$CONFIG_FILE" | grep -o '"testPassword": "[^"]*' | cut -d'"' -f4)

# 결과 디렉토리 생성
RESULTS_DIR="results/${ENV}"
mkdir -p "$RESULTS_DIR"

# 타임스탬프
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RESULT_FILE="${RESULTS_DIR}/${SCRIPT%.js}-${TIMESTAMP}.json"

echo "🚀 부하 테스트 시작"
echo "환경: $ENV"
echo "스크립트: $SCRIPT"
echo "BASE_URL: $BASE_URL"
echo "결과 파일: $RESULT_FILE"
echo ""

# k6 실행
k6 run \
  --env BASE_URL="$BASE_URL" \
  --env TEST_EMAIL="$TEST_EMAIL" \
  --env TEST_EMAIL_PREFIX="$TEST_EMAIL_PREFIX" \
  --env TEST_PASSWORD="$TEST_PASSWORD" \
  --out json="$RESULT_FILE" \
  "scripts/${SCRIPT}"

echo ""
echo "✅ 테스트 완료"
echo "결과 파일: $RESULT_FILE"

