#!/bin/bash

# S3 버킷 테스트 스크립트
# 사용법: ./test-s3.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}
PROJECT_NAME="passit"
REGION="ap-northeast-2"

echo "=========================================="
echo "S3 버킷 테스트 - ${ENVIRONMENT} 환경"
echo "=========================================="

# AWS CLI 설치 확인
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI가 설치되어 있지 않습니다."
    echo "   설치: https://aws.amazon.com/cli/"
    exit 1
fi

# 버킷 이름 패턴
BUCKETS=("uploads" "logs" "backup")
BUCKET_PREFIX="${PROJECT_NAME}-${ENVIRONMENT}"

echo ""
echo "📋 버킷 목록 확인 중..."
echo ""

# 각 버킷 테스트
for BUCKET_NAME in "${BUCKETS[@]}"; do
    FULL_BUCKET_NAME="${BUCKET_PREFIX}-${BUCKET_NAME}"
    
    echo "----------------------------------------"
    echo "버킷: ${FULL_BUCKET_NAME}"
    echo "----------------------------------------"
    
    # 버킷 존재 확인
    if aws s3api head-bucket --bucket "$FULL_BUCKET_NAME" --region "$REGION" 2>/dev/null; then
        echo "✅ 버킷 존재 확인"
    else
        echo "❌ 버킷이 존재하지 않거나 접근할 수 없습니다."
        continue
    fi
    
    # 버킷 정보 조회
    echo ""
    echo "📊 버킷 정보:"
    BUCKET_INFO=$(aws s3api get-bucket-location --bucket "$FULL_BUCKET_NAME" --region "$REGION" 2>/dev/null || echo "{}")
    echo "  Location: $(echo "$BUCKET_INFO" | grep -o '"LocationConstraint"[^,]*' | cut -d'"' -f4 || echo "$REGION")"
    
    # 버킷 버전 관리 확인
    VERSIONING=$(aws s3api get-bucket-versioning --bucket "$FULL_BUCKET_NAME" --region "$REGION" 2>/dev/null || echo "{}")
    VERSION_STATUS=$(echo "$VERSIONING" | grep -o '"Status"[^,]*' | cut -d'"' -f4 || echo "Disabled")
    echo "  Versioning: ${VERSION_STATUS}"
    
    # 암호화 확인
    ENCRYPTION=$(aws s3api get-bucket-encryption --bucket "$FULL_BUCKET_NAME" --region "$REGION" 2>/dev/null || echo "{}")
    if echo "$ENCRYPTION" | grep -q "SSEAlgorithm"; then
        SSE_ALGO=$(echo "$ENCRYPTION" | grep -o '"SSEAlgorithm"[^,]*' | cut -d'"' -f4)
        echo "  Encryption: ${SSE_ALGO}"
    else
        echo "  Encryption: 확인 불가"
    fi
    
    # 파일 업로드 테스트
    echo ""
    echo "🧪 파일 업로드 테스트:"
    TEST_FILE="/tmp/test-s3-${BUCKET_NAME}-$(date +%s).txt"
    TEST_CONTENT="S3 테스트 파일 - $(date)"
    echo "$TEST_CONTENT" > "$TEST_FILE"
    
    TEST_KEY="test/connection-test-$(date +%s).txt"
    
    if aws s3 cp "$TEST_FILE" "s3://${FULL_BUCKET_NAME}/${TEST_KEY}" --region "$REGION" 2>/dev/null; then
        echo "✅ 업로드 성공: s3://${FULL_BUCKET_NAME}/${TEST_KEY}"
        
        # 파일 다운로드 테스트
        DOWNLOAD_FILE="/tmp/downloaded-${BUCKET_NAME}-$(date +%s).txt"
        if aws s3 cp "s3://${FULL_BUCKET_NAME}/${TEST_KEY}" "$DOWNLOAD_FILE" --region "$REGION" 2>/dev/null; then
            DOWNLOADED_CONTENT=$(cat "$DOWNLOAD_FILE")
            if [ "$DOWNLOADED_CONTENT" = "$TEST_CONTENT" ]; then
                echo "✅ 다운로드 성공 및 내용 일치 확인"
            else
                echo "❌ 다운로드한 내용이 원본과 다릅니다"
            fi
            rm -f "$DOWNLOAD_FILE"
        else
            echo "❌ 다운로드 실패"
        fi
        
        # 테스트 파일 삭제
        if aws s3 rm "s3://${FULL_BUCKET_NAME}/${TEST_KEY}" --region "$REGION" 2>/dev/null; then
            echo "✅ 테스트 파일 삭제 완료"
        else
            echo "⚠️  테스트 파일 삭제 실패 (수동으로 삭제해주세요)"
        fi
    else
        echo "❌ 업로드 실패"
        echo ""
        echo "가능한 원인:"
        echo "  1. IAM 권한 부족 (s3:PutObject 필요)"
        echo "  2. 버킷 정책 제한"
        echo "  3. KMS 키 권한 부족 (암호화 사용 시)"
    fi
    
    # 임시 파일 정리
    rm -f "$TEST_FILE"
    
    echo ""
done

echo "=========================================="
echo "✅ S3 버킷 테스트 완료!"
echo "=========================================="
echo ""
echo "📝 추가 확인 사항:"
echo "  - 버킷 정책 확인: aws s3api get-bucket-policy --bucket <bucket-name>"
echo "  - 버킷 ACL 확인: aws s3api get-bucket-acl --bucket <bucket-name>"
echo "  - 버킷 객체 목록: aws s3 ls s3://<bucket-name>/"
