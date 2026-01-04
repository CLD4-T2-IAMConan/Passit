#!/bin/bash

# AWS SES 이메일 주소 인증 스크립트
# SES Sandbox 모드에서는 인증된 이메일로만 전송 가능

set -e

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 기본값
# SES는 일부 리전에서만 지원됩니다 (us-east-1, us-west-2, ap-southeast-1 등)
# ap-northeast-2는 SES v2를 지원하지 않으므로 us-east-1 사용 권장
REGION=${REGION:-us-east-1}
EMAIL_ADDRESS=${1:-}

if [ -z "$EMAIL_ADDRESS" ]; then
    echo -e "${YELLOW}📧 인증할 이메일 주소를 입력하세요:${NC}"
    read -r EMAIL_ADDRESS
fi

if [ -z "$EMAIL_ADDRESS" ]; then
    echo -e "${RED}❌ 이메일 주소가 입력되지 않았습니다.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}  AWS SES 이메일 주소 인증${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""
echo -e "${GREEN}✅ 설정:${NC}"
echo -e "   Region: $REGION"
echo -e "   Email: $EMAIL_ADDRESS"
echo ""

# 이메일 주소 인증 요청
echo -e "${BLUE}[1/2] 이메일 주소 인증 요청 중...${NC}"
VERIFICATION_RESULT=$(aws sesv2 create-email-identity \
    --email-identity "$EMAIL_ADDRESS" \
    --region "$REGION" 2>&1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 인증 요청 성공!${NC}"
    echo ""
    echo -e "${YELLOW}📬 다음 단계:${NC}"
    echo -e "   1. $EMAIL_ADDRESS 메일함을 확인하세요"
    echo -e "   2. AWS에서 보낸 인증 이메일을 찾으세요"
    echo -e "   3. 이메일 내의 인증 링크를 클릭하세요"
    echo -e "   4. 인증 완료 후 아래 명령으로 상태를 확인하세요:"
    echo ""
    echo -e "${BLUE}   aws sesv2 get-email-identity \\${NC}"
    echo -e "${BLUE}     --email-identity $EMAIL_ADDRESS \\${NC}"
    echo -e "${BLUE}     --region $REGION${NC}"
    echo ""
else
    echo -e "${RED}❌ 인증 요청 실패${NC}"
    echo "$VERIFICATION_RESULT"
    exit 1
fi

# 인증 상태 확인
echo -e "${BLUE}[2/2] 현재 인증 상태 확인 중...${NC}"
STATUS=$(aws sesv2 get-email-identity \
    --email-identity "$EMAIL_ADDRESS" \
    --region "$REGION" \
    --query 'VerificationStatus' \
    --output text 2>/dev/null || echo "NOT_FOUND")

case "$STATUS" in
    "SUCCESS")
        echo -e "${GREEN}✅ 이메일 주소가 이미 인증되어 있습니다!${NC}"
        ;;
    "PENDING")
        echo -e "${YELLOW}⏳ 인증 대기 중... 이메일함을 확인하세요.${NC}"
        ;;
    "FAILED")
        echo -e "${RED}❌ 인증 실패. 다시 시도하세요.${NC}"
        ;;
    "NOT_FOUND"|"TemporaryFailure")
        echo -e "${YELLOW}⚠️  이메일 주소를 찾을 수 없거나 임시 오류가 발생했습니다.${NC}"
        echo -e "   잠시 후 다시 확인하세요."
        ;;
    *)
        echo -e "${YELLOW}⚠️  상태: $STATUS${NC}"
        ;;
esac

echo ""
echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}  인증된 이메일 목록 확인${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""
aws sesv2 list-email-identities \
    --region "$REGION" \
    --query 'EmailIdentities[*].[EmailIdentity,VerificationStatus]' \
    --output table 2>/dev/null || echo "목록 조회 실패"

echo ""
echo -e "${YELLOW}💡 참고:${NC}"
echo -e "   - SES Sandbox 모드에서는 인증된 이메일로만 전송 가능합니다"
echo -e "   - 프로덕션에서는 Sandbox 모드 해제를 요청해야 합니다"
echo -e "   - Sandbox 모드 해제: AWS Support에 요청"
echo ""

