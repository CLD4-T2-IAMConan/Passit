#!/bin/bash

# EKS Access Entry 추가 스크립트
# IAM 사용자에게 EKS 클러스터 접근 권한을 부여합니다.

set -e

ENVIRONMENT=${1:-dev}
IAM_USER=${2:-""}

if [ -z "$IAM_USER" ]; then
    echo "사용법: $0 <env> <iam-user> [region]"
    echo "예시: $0 dev t2-krystal"
    echo "예시: $0 dr t2-krystal"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "❌ Error: $TERRAFORM_DIR 디렉토리가 존재하지 않습니다."
    exit 1
fi

# Terraform output에서 리전 가져오기
cd "$TERRAFORM_DIR"
REGION=$(terraform output -raw region 2>/dev/null || echo "")

# 리전이 없으면 환경별 기본값 사용
if [ -z "$REGION" ]; then
    case "$ENVIRONMENT" in
        dr)
            REGION=${3:-ap-northeast-1}  # Tokyo
            ;;
        *)
            REGION=${3:-ap-northeast-2}  # Seoul
            ;;
    esac
fi

echo "=========================================="
echo "EKS Access Entry 추가"
echo "=========================================="
echo "Environment: ${ENVIRONMENT}"
echo "IAM User: ${IAM_USER}"
echo "Region: ${REGION}"
echo "=========================================="
echo ""

# AWS 계정 ID 확인
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
PRINCIPAL_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:user/${IAM_USER}"

echo "📋 AWS 계정 정보:"
echo "  Account ID: ${AWS_ACCOUNT_ID}"
echo "  Principal ARN: ${PRINCIPAL_ARN}"
echo ""

# Terraform output에서 클러스터 이름 가져오기 (이미 cd 했으므로 다시 cd 불필요)
CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null || echo "passit-${ENVIRONMENT}-eks")

if [ -z "$CLUSTER_NAME" ]; then
    echo "⚠️  Terraform output에서 클러스터 이름을 가져올 수 없습니다."
    read -p "EKS 클러스터 이름을 입력하세요: " CLUSTER_NAME
fi

echo "📦 클러스터 정보:"
echo "  이름: ${CLUSTER_NAME}"
echo ""

# 클러스터 존재 확인
echo "🔍 클러스터 존재 여부 확인 중..."
if ! aws eks describe-cluster --name "$CLUSTER_NAME" --region "$REGION" > /dev/null 2>&1; then
    echo "❌ Error: 클러스터 '$CLUSTER_NAME'를 찾을 수 없습니다."
    exit 1
fi
echo "  ✅ 클러스터 확인됨"
echo ""

# 기존 Access Entry 확인
echo "🔍 기존 Access Entry 확인 중..."
EXISTING_ENTRY=$(aws eks list-access-entries \
    --cluster-name "$CLUSTER_NAME" \
    --region "$REGION" \
    --query "accessEntries[?principalArn=='${PRINCIPAL_ARN}']" \
    --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_ENTRY" ]; then
    echo "  ℹ️  Access Entry가 이미 존재합니다."
    echo "  Principal ARN: ${PRINCIPAL_ENTRY}"
    read -p "  기존 Entry를 업데이트하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "  취소되었습니다."
        exit 0
    fi
else
    echo "  ℹ️  새로운 Access Entry를 생성합니다."
fi
echo ""

# Access Entry 생성 또는 업데이트
echo "📝 Access Entry 생성/업데이트 중..."

# Access Entry가 없으면 생성
if [ -z "$EXISTING_ENTRY" ]; then
    echo "  Access Entry 생성 중..."
    aws eks create-access-entry \
        --cluster-name "$CLUSTER_NAME" \
        --principal-arn "$PRINCIPAL_ARN" \
        --type STANDARD \
        --region "$REGION"
    echo "  ✅ Access Entry 생성 완료"
else
    echo "  Access Entry가 이미 존재합니다. Policy만 연결합니다."
fi
echo ""

# Admin Policy 연결
echo "🔗 Admin Policy 연결 중..."
aws eks associate-access-policy \
    --cluster-name "$CLUSTER_NAME" \
    --principal-arn "$PRINCIPAL_ARN" \
    --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
    --access-scope type=cluster \
    --region "$REGION" 2>/dev/null || {
    echo "  ⚠️  Policy 연결 실패 (이미 연결되어 있을 수 있습니다)"
}

echo "  ✅ Policy 연결 완료"
echo ""

# 확인
echo "🔍 Access Entry 확인 중..."
aws eks describe-access-entry \
    --cluster-name "$CLUSTER_NAME" \
    --principal-arn "$PRINCIPAL_ARN" \
    --region "$REGION" 2>/dev/null && echo "  ✅ Access Entry 확인됨" || echo "  ⚠️  Access Entry 확인 실패"
echo ""

echo "=========================================="
echo "✅ EKS Access Entry 추가 완료!"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "1. kubeconfig 업데이트:"
echo "   aws eks update-kubeconfig --name ${CLUSTER_NAME} --region ${REGION}"
echo ""
echo "2. 접속 확인:"
echo "   kubectl get nodes"
echo ""
echo "⚠️  참고: Terraform 코드에도 추가하는 것을 권장합니다:"
echo "   terraform/modules/eks/main.tf의 access_entries에 추가"
echo ""

