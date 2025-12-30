#!/bin/bash
set -e

# EKS Access Entry 추가 스크립트
# 사용법: ./add-eks-user.sh <IAM_USER_ARN> [POLICY_TYPE]

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 기본 설정
CLUSTER_NAME="passit-dev-eks"
REGION="ap-northeast-2"
DEFAULT_POLICY="admin"

# 사용법 출력
usage() {
    echo "사용법: $0 <IAM_USER_ARN> [POLICY_TYPE]"
    echo ""
    echo "예시:"
    echo "  $0 arn:aws:iam::727646470302:user/t2-username"
    echo "  $0 arn:aws:iam::727646470302:user/t2-username view"
    echo ""
    echo "POLICY_TYPE 옵션:"
    echo "  admin    - AmazonEKSClusterAdminPolicy (기본값)"
    echo "  edit     - AmazonEKSEditPolicy"
    echo "  view     - AmazonEKSViewPolicy"
    exit 1
}

# 인자 확인
if [ $# -lt 1 ]; then
    echo -e "${RED}오류: IAM User ARN이 필요합니다${NC}"
    usage
fi

IAM_ARN=$1
POLICY_TYPE=${2:-$DEFAULT_POLICY}

# Policy ARN 매핑
case $POLICY_TYPE in
    admin)
        POLICY_ARN="arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
        POLICY_NAME="Cluster Admin"
        ;;
    edit)
        POLICY_ARN="arn:aws:eks::aws:cluster-access-policy/AmazonEKSEditPolicy"
        POLICY_NAME="Edit"
        ;;
    view)
        POLICY_ARN="arn:aws:eks::aws:cluster-access-policy/AmazonEKSViewPolicy"
        POLICY_NAME="View (Read-only)"
        ;;
    *)
        echo -e "${RED}오류: 잘못된 POLICY_TYPE입니다${NC}"
        usage
        ;;
esac

echo -e "${GREEN}=== EKS Access Entry 추가 ===${NC}"
echo "클러스터: $CLUSTER_NAME"
echo "리전: $REGION"
echo "IAM ARN: $IAM_ARN"
echo "권한: $POLICY_NAME"
echo ""

# AWS CLI 설치 확인
if ! command -v aws &> /dev/null; then
    echo -e "${RED}오류: AWS CLI가 설치되지 않았습니다${NC}"
    exit 1
fi

# 현재 AWS 인증 정보 확인
echo -e "${YELLOW}현재 AWS 인증 정보:${NC}"
aws sts get-caller-identity
echo ""

# 확인
read -p "계속 진행하시겠습니까? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "취소되었습니다."
    exit 0
fi

# Access Entry가 이미 존재하는지 확인
echo -e "${YELLOW}기존 Access Entry 확인 중...${NC}"
if aws eks describe-access-entry \
    --cluster-name $CLUSTER_NAME \
    --principal-arn "$IAM_ARN" \
    --region $REGION &> /dev/null; then

    echo -e "${YELLOW}Access Entry가 이미 존재합니다. Policy만 업데이트합니다.${NC}"
    ENTRY_EXISTS=true
else
    echo -e "${GREEN}새로운 Access Entry를 생성합니다.${NC}"
    ENTRY_EXISTS=false
fi

# Access Entry 생성 (존재하지 않는 경우)
if [ "$ENTRY_EXISTS" = false ]; then
    echo -e "${YELLOW}Access Entry 생성 중...${NC}"
    aws eks create-access-entry \
        --cluster-name $CLUSTER_NAME \
        --principal-arn "$IAM_ARN" \
        --region $REGION

    echo -e "${GREEN}✓ Access Entry 생성 완료${NC}"
fi

# Policy 연결
echo -e "${YELLOW}Policy 연결 중...${NC}"

# 기존 Policy 확인 및 제거
EXISTING_POLICIES=$(aws eks list-associated-access-policies \
    --cluster-name $CLUSTER_NAME \
    --principal-arn "$IAM_ARN" \
    --region $REGION \
    --query 'associatedAccessPolicies[].policyArn' \
    --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_POLICIES" ]; then
    echo -e "${YELLOW}기존 Policy 제거 중...${NC}"
    for policy in $EXISTING_POLICIES; do
        aws eks disassociate-access-policy \
            --cluster-name $CLUSTER_NAME \
            --principal-arn "$IAM_ARN" \
            --policy-arn "$policy" \
            --region $REGION
        echo "  - 제거됨: $policy"
    done
fi

# 새 Policy 연결
aws eks associate-access-policy \
    --cluster-name $CLUSTER_NAME \
    --principal-arn "$IAM_ARN" \
    --policy-arn $POLICY_ARN \
    --access-scope type=cluster \
    --region $REGION

echo -e "${GREEN}✓ Policy 연결 완료${NC}"

# 결과 확인
echo ""
echo -e "${GREEN}=== Access Entry 설정 완료 ===${NC}"
echo ""
echo "Access Entry 정보:"
aws eks describe-access-entry \
    --cluster-name $CLUSTER_NAME \
    --principal-arn "$IAM_ARN" \
    --region $REGION

echo ""
echo "연결된 Policy:"
aws eks list-associated-access-policies \
    --cluster-name $CLUSTER_NAME \
    --principal-arn "$IAM_ARN" \
    --region $REGION

echo ""
echo -e "${GREEN}=== 다음 단계 ===${NC}"
echo "1. 팀원에게 다음 명령어 실행 안내:"
echo -e "   ${YELLOW}aws eks update-kubeconfig --name $CLUSTER_NAME --region $REGION${NC}"
echo ""
echo "2. kubectl 접근 확인:"
echo -e "   ${YELLOW}kubectl cluster-info${NC}"
echo -e "   ${YELLOW}kubectl get nodes${NC}"
echo ""
echo "3. (선택) Terraform 코드에도 추가:"
echo "   - 파일: terraform/modules/eks/main.tf"
echo "   - access_entries 블록에 추가"
