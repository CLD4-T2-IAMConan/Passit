#!/bin/bash
# 태그로 Passit 관련 모든 리소스 찾아서 삭제하는 스크립트

set -e

PROJECT_NAME="passit"
REGION="ap-northeast-2"

# 색상 정의
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║  태그 기반 Passit 리소스 완전 삭제 스크립트              ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 확인
echo -e "${RED}⚠️  이 스크립트는 Project=$PROJECT_NAME 태그가 있는 모든 리소스를 삭제합니다!${NC}"
echo ""
read -p "계속하시겠습니까? (yes/no): " CONFIRM1
if [ "$CONFIRM1" != "yes" ]; then
    echo -e "${GREEN}✅ 취소되었습니다.${NC}"
    exit 0
fi

read -p "다시 한 번 확인: 'DELETE BY TAG'를 입력하세요: " CONFIRM2
if [ "$CONFIRM2" != "DELETE BY TAG" ]; then
    echo -e "${GREEN}✅ 취소되었습니다.${NC}"
    exit 0
fi

echo ""
echo -e "${RED}🚨 태그 기반 삭제 시작...${NC}"
echo ""

# Resource Groups Tagging API로 모든 리소스 찾기
echo "📦 모든 passit 태그 리소스 검색 중..."
ALL_RESOURCES=$(aws resourcegroupstaggingapi get-resources \
    --tag-filters "Key=Project,Values=$PROJECT_NAME" \
    --region $REGION \
    --query 'ResourceTagMappingList[].ResourceARN' \
    --output text 2>/dev/null || echo "")

if [ -z "$ALL_RESOURCES" ]; then
    echo -e "${GREEN}✅ passit 태그가 있는 리소스가 없습니다.${NC}"
    exit 0
fi

echo "발견된 리소스 개수: $(echo $ALL_RESOURCES | wc -w | tr -d ' ')"
echo ""

# 리소스 타입별로 분류하여 삭제
for RESOURCE_ARN in $ALL_RESOURCES; do
    if [ -z "$RESOURCE_ARN" ] || [ "$RESOURCE_ARN" = "None" ]; then
        continue
    fi
    
    echo "처리 중: $RESOURCE_ARN"
    
    # ARN에서 리소스 타입 추출
    if echo "$RESOURCE_ARN" | grep -q "arn:aws:ec2.*:volume/"; then
        # EBS Volume
        VOL_ID=$(echo "$RESOURCE_ARN" | awk -F'/' '{print $NF}')
        echo "   EBS Volume 삭제: $VOL_ID"
        aws ec2 delete-volume --volume-id $VOL_ID --region $REGION 2>/dev/null || echo "     ⚠️  삭제 실패"
        
    elif echo "$RESOURCE_ARN" | grep -q "arn:aws:ec2.*:instance/"; then
        # EC2 Instance
        INSTANCE_ID=$(echo "$RESOURCE_ARN" | awk -F'/' '{print $NF}')
        echo "   EC2 Instance 종료: $INSTANCE_ID"
        aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $REGION 2>/dev/null || echo "     ⚠️  종료 실패"
        
    elif echo "$RESOURCE_ARN" | grep -q "arn:aws:ec2.*:vpc/"; then
        # VPC (이미 다른 스크립트에서 처리)
        echo "   VPC는 네트워크 삭제 스크립트에서 처리됩니다."
        
    elif echo "$RESOURCE_ARN" | grep -q "arn:aws:eks"; then
        # EKS Cluster
        CLUSTER_NAME=$(echo "$RESOURCE_ARN" | awk -F'/' '{print $NF}')
        echo "   EKS Cluster: $CLUSTER_NAME (별도 처리 필요)"
        
    elif echo "$RESOURCE_ARN" | grep -q "arn:aws:rds"; then
        # RDS
        echo "   RDS: 별도 처리 필요"
        
    elif echo "$RESOURCE_ARN" | grep -q "arn:aws:s3"; then
        # S3 Bucket
        BUCKET_NAME=$(echo "$RESOURCE_ARN" | awk -F':::' '{print $NF}' | awk -F'/' '{print $1}')
        echo "   S3 Bucket: $BUCKET_NAME (별도 처리 필요)"
        
    elif echo "$RESOURCE_ARN" | grep -q "arn:aws:secretsmanager"; then
        # Secrets Manager
        SECRET_NAME=$(echo "$RESOURCE_ARN" | awk -F':' '{print $NF}')
        echo "   Secret 삭제: $SECRET_NAME"
        aws secretsmanager delete-secret --secret-id "$SECRET_NAME" --force-delete-without-recovery --region $REGION 2>/dev/null || echo "     ⚠️  삭제 실패"
        
    elif echo "$RESOURCE_ARN" | grep -q "arn:aws:iam.*:role/"; then
        # IAM Role
        ROLE_NAME=$(echo "$RESOURCE_ARN" | awk -F'/' '{print $NF}')
        echo "   IAM Role: $ROLE_NAME (별도 처리 필요)"
        
    elif echo "$RESOURCE_ARN" | grep -q "arn:aws:aps"; then
        # Prometheus Workspace
        WORKSPACE_ID=$(echo "$RESOURCE_ARN" | awk -F'/' '{print $NF}')
        echo "   Prometheus Workspace 삭제: $WORKSPACE_ID"
        aws amp delete-workspace --workspace-id $WORKSPACE_ID --region $REGION 2>/dev/null || echo "     ⚠️  삭제 실패"
        
    else
        echo "   알 수 없는 리소스 타입: $RESOURCE_ARN"
    fi
done

echo ""
echo -e "${GREEN}✅ 태그 기반 삭제 완료!${NC}"
echo ""
echo -e "${YELLOW}📝 참고:${NC}"
echo "  - 일부 리소스는 타입별로 별도 삭제가 필요할 수 있습니다"
echo "  - 남은 리소스 확인:"
echo "    aws resourcegroupstaggingapi get-resources --tag-filters Key=Project,Values=$PROJECT_NAME --region $REGION"

