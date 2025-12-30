#!/bin/bash
# Passit 관련 EBS 볼륨 삭제 스크립트

set -e

PROJECT_NAME="passit"
REGION="ap-northeast-2"

# 색상 정의
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 Passit 관련 EBS 볼륨 찾기 및 삭제${NC}"
echo ""

# 1. passit 태그가 있는 볼륨 찾기
echo "🔍 1. Project 태그로 볼륨 검색 중..."
VOLUMES_PROJECT=$(aws ec2 describe-volumes \
    --filters "Name=tag:Project,Values=$PROJECT_NAME" "Name=status,Values=available" \
    --query 'Volumes[].VolumeId' \
    --output text \
    --region $REGION 2>/dev/null || echo "")

# 2. eks:cluster-name 태그로 passit 클러스터 볼륨 찾기
echo "🔍 2. EKS 클러스터 태그로 볼륨 검색 중..."
VOLUMES_EKS=$(aws ec2 describe-volumes \
    --filters "Name=tag:eks:cluster-name,Values=passit-*" "Name=status,Values=available" \
    --query 'Volumes[].VolumeId' \
    --output text \
    --region $REGION 2>/dev/null || echo "")

# 3. Env 태그로 찾기
echo "🔍 3. Env 태그로 볼륨 검색 중..."
VOLUMES_ENV=$(aws ec2 describe-volumes \
    --filters "Name=tag:Env,Values=dev,prod" "Name=status,Values=available" \
    --query 'Volumes[?contains(Tags[?Key==`eks:cluster-name`].Value, `passit`)].VolumeId' \
    --output text \
    --region $REGION 2>/dev/null || echo "")

# 모든 볼륨 ID 합치기 (중복 제거)
ALL_VOLUMES=$(echo "$VOLUMES_PROJECT $VOLUMES_EKS $VOLUMES_ENV" | tr ' ' '\n' | sort -u | tr '\n' ' ')

if [ -z "$ALL_VOLUMES" ] || [ "$ALL_VOLUMES" = " " ]; then
    echo -e "${GREEN}✅ 삭제할 볼륨이 없습니다.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}발견된 볼륨:${NC}"
for VOL_ID in $ALL_VOLUMES; do
    if [ -n "$VOL_ID" ] && [ "$VOL_ID" != "None" ]; then
        VOL_INFO=$(aws ec2 describe-volumes --volume-ids $VOL_ID --region $REGION --query 'Volumes[0]' 2>/dev/null || echo "")
        if [ -n "$VOL_INFO" ]; then
            SIZE=$(echo "$VOL_INFO" | grep -o '"Size": [0-9]*' | grep -o '[0-9]*' || echo "?")
            STATE=$(echo "$VOL_INFO" | grep -o '"State": "[^"]*"' | cut -d'"' -f4 || echo "?")
            CLUSTER=$(aws ec2 describe-volumes --volume-ids $VOL_ID --region $REGION --query 'Volumes[0].Tags[?Key==`eks:cluster-name`].Value' --output text 2>/dev/null || echo "")
            echo "   - $VOL_ID (Size: ${SIZE}GB, State: $STATE, Cluster: $CLUSTER)"
        fi
    fi
done

echo ""
echo -e "${RED}⚠️  위 볼륨들을 삭제하시겠습니까?${NC}"
read -p "계속하시겠습니까? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${GREEN}✅ 취소되었습니다.${NC}"
    exit 0
fi

echo ""
echo -e "${RED}🗑️  볼륨 삭제 시작...${NC}"
echo ""

DELETED=0
FAILED=0

for VOL_ID in $ALL_VOLUMES; do
    if [ -n "$VOL_ID" ] && [ "$VOL_ID" != "None" ]; then
        echo "   볼륨 삭제 중: $VOL_ID"
        if aws ec2 delete-volume --volume-id $VOL_ID --region $REGION 2>/dev/null; then
            echo -e "     ${GREEN}✅ 삭제 완료${NC}"
            DELETED=$((DELETED + 1))
        else
            echo -e "     ${RED}❌ 삭제 실패 (아직 attached되어 있거나 다른 이유)${NC}"
            FAILED=$((FAILED + 1))
        fi
    fi
done

echo ""
echo -e "${GREEN}✅ 완료!${NC}"
echo "   삭제 성공: $DELETED"
echo "   삭제 실패: $FAILED"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${YELLOW}📝 실패한 볼륨은 아직 EC2 인스턴스에 연결되어 있을 수 있습니다.${NC}"
    echo "   인스턴스를 먼저 종료한 후 다시 시도하세요."
fi

