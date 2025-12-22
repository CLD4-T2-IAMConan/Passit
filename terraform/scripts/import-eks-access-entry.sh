#!/bin/bash

# EKS Access Entry를 Terraform state에 import하는 스크립트
#
# 사용 방법:
# ./terraform/scripts/import-eks-access-entry.sh dev

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "Error: $TERRAFORM_DIR 디렉토리가 존재하지 않습니다."
    exit 1
fi

echo "=========================================="
echo "EKS Access Entry Import"
echo "Environment: $ENVIRONMENT"
echo "=========================================="

cd "$TERRAFORM_DIR"

# 클러스터 이름 가져오기
CLUSTER_NAME=$(awk -F'"' '/^cluster_name[[:space:]]*=/ {print $2}' terraform.tfvars | head -1 | xargs)
if [ -z "$CLUSTER_NAME" ]; then
    echo "Error: 클러스터 이름을 찾을 수 없습니다."
    exit 1
fi

PRINCIPAL_ARN="arn:aws:iam::727646470302:user/iamconan"
REGION=${AWS_REGION:-ap-northeast-2}

echo ""
echo "클러스터: $CLUSTER_NAME"
echo "사용자: $PRINCIPAL_ARN"
echo "리전: $REGION"
echo ""

# Access Entry 존재 확인
if ! aws eks describe-access-entry \
  --cluster-name "$CLUSTER_NAME" \
  --principal-arn "$PRINCIPAL_ARN" \
  --region "$REGION" > /dev/null 2>&1; then
    echo "Error: Access Entry가 존재하지 않습니다."
    echo "먼저 Access Entry를 생성하세요."
    exit 1
fi

echo "✅ Access Entry 존재 확인"
echo ""

# Terraform import 경로 확인
# terraform-aws-modules/eks 모듈의 리소스 경로
IMPORT_PATH="module.eks.module.eks.aws_eks_access_entry.this[\"iamconan\"]"
ACCESS_ENTRY_ID="${CLUSTER_NAME}:${PRINCIPAL_ARN}"

echo "Import 실행 중..."
echo "  Resource: $IMPORT_PATH"
echo "  ID: $ACCESS_ENTRY_ID"
echo ""

# Import 실행
terraform import "$IMPORT_PATH" "$ACCESS_ENTRY_ID"

echo ""
echo "=========================================="
echo "Import 완료"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "1. terraform plan 실행하여 변경사항 확인"
echo "2. 필요시 terraform apply 실행"
echo ""

