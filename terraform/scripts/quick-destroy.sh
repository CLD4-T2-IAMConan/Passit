#!/bin/bash

# Security 모듈을 제외하고 빠르게 destroy 실행
# EKS 클러스터가 이미 삭제된 경우 사용
#
# 사용 방법:
# ./terraform/scripts/quick-destroy.sh dev

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
echo "Terraform Destroy (Security 모듈 제외)"
echo "Environment: $ENVIRONMENT"
echo "=========================================="
echo ""

# Security 모듈을 제외하고 destroy 실행
terraform destroy \
  -target=module.network \
  -target=module.eks \
  -target=module.data \
  -target=module.autoscaling \
  -target=module.monitoring \
  -target=module.cicd \
  -auto-approve

echo ""
echo "=========================================="
echo "완료"
echo "=========================================="
echo "Security 모듈의 리소스는 별도로 삭제해야 합니다."
echo ""

