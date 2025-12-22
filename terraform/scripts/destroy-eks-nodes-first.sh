#!/bin/bash

# EKS 노드 그룹을 먼저 삭제한 후 클러스터를 삭제하는 스크립트
#
# 사용 방법:
# ./terraform/scripts/destroy-eks-nodes-first.sh dev

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
echo "EKS 노드 그룹 먼저 삭제"
echo "Environment: $ENVIRONMENT"
echo "=========================================="
echo ""

# 1. 노드 그룹만 먼저 삭제
echo "1. 노드 그룹 삭제 중..."
terraform destroy \
  -target=module.eks.module.eks.aws_eks_node_group.this \
  -auto-approve || echo "노드 그룹이 이미 삭제되었거나 없습니다."

# 2. 잠시 대기 (노드 그룹 삭제 완료 대기)
echo ""
echo "2. 노드 그룹 삭제 완료 대기 중 (30초)..."
sleep 30

# 3. 클러스터 삭제
echo ""
echo "3. EKS 클러스터 삭제 중..."
terraform destroy \
  -target=module.eks \
  -auto-approve

echo ""
echo "=========================================="
echo "완료"
echo "=========================================="

