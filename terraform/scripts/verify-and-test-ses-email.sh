#!/bin/bash

# AWS SES 이메일 인증 및 테스트 스크립트
# pkrystal.dev@gmail.com 인증 및 테스트

set -e

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# SES는 일부 리전에서만 지원됩니다
# ap-northeast-2는 지원하지 않으므로 us-east-1 사용
REGION=${REGION:-us-east-1}
EMAIL_ADDRESS="pkrystal.dev@gmail.com"

echo ""
echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}  AWS SES 이메일 인증 및 테스트${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""
echo -e "${GREEN}✅ 설정:${NC}"
echo -e "   Region: $REGION (SES 지원 리전)"
echo -e "   Email: $EMAIL_ADDRESS"
echo ""

# 현재 인증 상태 확인
echo -e "${BLUE}[1/4] 현재 인증 상태 확인 중...${NC}"
STATUS=$(aws sesv2 get-email-identity \
    --email-identity "$EMAIL_ADDRESS" \
    --region "$REGION" \
    --query 'VerificationStatus' \
    --output text 2>/dev/null || echo "NOT_FOUND")

case "$STATUS" in
    "SUCCESS")
        echo -e "${GREEN}✅ 이메일 주소가 이미 인증되어 있습니다!${NC}"
        SKIP_VERIFY=true
        ;;
    "PENDING")
        echo -e "${YELLOW}⏳ 인증 대기 중... 이메일함을 확인하세요.${NC}"
        SKIP_VERIFY=false
        ;;
    "NOT_FOUND"|*)
        echo -e "${YELLOW}⚠️  이메일 주소가 인증되지 않았습니다.${NC}"
        SKIP_VERIFY=false
        ;;
esac

# 인증 요청 (필요한 경우)
if [ "$SKIP_VERIFY" != "true" ]; then
    echo ""
    echo -e "${BLUE}[2/4] 이메일 주소 인증 요청 중...${NC}"
    
    # 기존 인증 요청이 있으면 삭제 후 재요청
    if [ "$STATUS" != "NOT_FOUND" ]; then
        echo "   기존 인증 요청 삭제 중..."
        aws sesv2 delete-email-identity \
            --email-identity "$EMAIL_ADDRESS" \
            --region "$REGION" 2>/dev/null || true
        sleep 2
    fi
    
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
        echo -e "   4. 인증 완료 후 이 스크립트를 다시 실행하세요"
        echo ""
        exit 0
    else
        echo -e "${RED}❌ 인증 요청 실패${NC}"
        echo "$VERIFICATION_RESULT"
        exit 1
    fi
else
    echo ""
    echo -e "${BLUE}[2/4] 인증 요청 건너뛰기 (이미 인증됨)${NC}"
fi

# 인증 상태 재확인
echo ""
echo -e "${BLUE}[3/4] 인증 상태 재확인 중...${NC}"
FINAL_STATUS=$(aws sesv2 get-email-identity \
    --email-identity "$EMAIL_ADDRESS" \
    --region "$REGION" \
    --query 'VerificationStatus' \
    --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$FINAL_STATUS" != "SUCCESS" ]; then
    echo -e "${RED}❌ 이메일이 아직 인증되지 않았습니다.${NC}"
    echo -e "   상태: $FINAL_STATUS"
    echo -e "   이메일함을 확인하고 인증 링크를 클릭하세요."
    exit 1
fi

echo -e "${GREEN}✅ 이메일 인증 확인 완료!${NC}"

# 테스트 이메일 전송
echo ""
echo -e "${BLUE}[4/4] 테스트 이메일 전송 중...${NC}"
TEST_SUBJECT="[Passit] SES 테스트 이메일"
TEST_BODY="이것은 AWS SES 테스트 이메일입니다. 정상적으로 수신되었다면 SES 설정이 올바르게 작동하는 것입니다."

SEND_RESULT=$(aws sesv2 send-email \
    --from-email-address "$EMAIL_ADDRESS" \
    --destination "ToAddresses=$EMAIL_ADDRESS" \
    --content "Simple={Subject={Data=$TEST_SUBJECT,Charset=UTF-8},Body={Text={Data=$TEST_BODY,Charset=UTF-8}}}" \
    --region "$REGION" 2>&1)

if [ $? -eq 0 ]; then
    MESSAGE_ID=$(echo "$SEND_RESULT" | grep -o '"MessageId":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    echo -e "${GREEN}✅ 테스트 이메일 전송 성공!${NC}"
    echo -e "   Message ID: $MESSAGE_ID"
    echo ""
    echo -e "${YELLOW}📬 $EMAIL_ADDRESS 메일함을 확인하세요.${NC}"
else
    echo -e "${RED}❌ 테스트 이메일 전송 실패${NC}"
    echo "$SEND_RESULT"
    exit 1
fi

echo ""
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}  ✅ 모든 작업 완료!${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo -e "${YELLOW}💡 참고:${NC}"
echo -e "   - application-ses.yml의 region을 $REGION으로 변경하세요"
echo -e "   - SES Sandbox 모드에서는 인증된 이메일로만 전송 가능합니다"
echo ""

