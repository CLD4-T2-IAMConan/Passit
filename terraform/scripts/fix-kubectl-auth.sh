#!/bin/bash

# kubectl 인증 문제 해결 스크립트
#
# 사용 방법:
# ./terraform/scripts/fix-kubectl-auth.sh dev

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "Error: $TERRAFORM_DIR 디렉토리가 존재하지 않습니다."
    exit 1
fi

cd "$TERRAFORM_DIR"

echo "=========================================="
echo "kubectl 인증 문제 해결"
echo "Environment: $ENVIRONMENT"
echo "=========================================="
echo ""

# 1. AWS 자격 증명 확인
echo "1. AWS 자격 증명 확인 중..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "  ❌ AWS 자격 증명이 설정되지 않았습니다."
    echo ""
    echo "다음 중 하나를 수행하세요:"
    echo "  export AWS_PROFILE=your-profile"
    echo "  또는"
    echo "  aws configure"
    exit 1
fi

AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_USER=$(aws sts get-caller-identity --query Arn --output text)
echo "  ✅ AWS 자격 증명 확인됨"
echo "    계정: $AWS_ACCOUNT"
echo "    사용자: $AWS_USER"
echo ""

# 2. 클러스터 이름 가져오기
echo "2. 클러스터 정보 확인 중..."
CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null || echo "passit-${ENVIRONMENT}-eks")
REGION=${AWS_REGION:-ap-northeast-2}

echo "  클러스터: $CLUSTER_NAME"
echo "  리전: $REGION"
echo ""

# 3. 클러스터 존재 확인
echo "3. 클러스터 존재 여부 확인 중..."
if ! aws eks describe-cluster --name "$CLUSTER_NAME" --region "$REGION" > /dev/null 2>&1; then
    echo "  ❌ 클러스터 '$CLUSTER_NAME'를 찾을 수 없습니다."
    echo ""
    echo "가능한 원인:"
    echo "  1. 클러스터가 아직 생성되지 않음"
    echo "  2. 클러스터가 삭제됨"
    echo "  3. 클러스터 이름이 잘못됨"
    echo ""
    echo "해결 방법:"
    echo "  terraform apply -target=module.eks"
    exit 1
fi

echo "  ✅ 클러스터 존재 확인됨"
echo ""

# 4. kubeconfig 업데이트
echo "4. kubeconfig 업데이트 중..."
aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$REGION"

echo "  ✅ kubeconfig 업데이트 완료"
echo ""

# 5. 연결 테스트
echo "5. 클러스터 연결 테스트 중..."
if kubectl cluster-info > /dev/null 2>&1; then
    echo "  ✅ 클러스터 연결 성공!"
    echo ""
    echo "클러스터 정보:"
    kubectl cluster-info
    echo ""
    echo "노드 확인:"
    kubectl get nodes
else
    echo "  ❌ 클러스터 연결 실패"
    echo ""
    echo "가능한 원인:"
    echo "  1. EKS Access Entry 권한 문제"
    echo "  2. 클러스터가 삭제 중이거나 접근 불가"
    echo ""
    echo "해결 방법:"
    echo "  1. EKS Access Entry 확인:"
    echo "     aws eks list-access-entries --cluster-name $CLUSTER_NAME --region $REGION"
    echo ""
    echo "  2. 현재 사용자 ARN 확인:"
    echo "     aws sts get-caller-identity --query Arn --output text"
    echo ""
    echo "  3. Access Entry 추가 (필요시):"
    echo "     aws eks create-access-entry --cluster-name $CLUSTER_NAME --principal-arn <YOUR_ARN> --region $REGION"
    exit 1
fi

echo ""
echo "=========================================="
echo "완료"
echo "=========================================="
echo ""
echo "이제 kubectl 명령어를 사용할 수 있습니다:"
echo "  kubectl get pods -A"
echo "  kubectl get nodes"
echo ""

