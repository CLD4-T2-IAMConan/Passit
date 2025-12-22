#!/bin/bash

# RDS 클러스터의 deletion protection을 비활성화하는 스크립트
#
# 사용 방법:
# ./terraform/scripts/disable-rds-deletion-protection.sh prod

set -e

ENVIRONMENT=${1:-prod}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "Error: $TERRAFORM_DIR 디렉토리가 존재하지 않습니다."
    exit 1
fi

cd "$TERRAFORM_DIR"

echo "=========================================="
echo "RDS Deletion Protection 비활성화"
echo "Environment: $ENVIRONMENT"
echo "=========================================="
echo ""

# 1. RDS 클러스터 확인
echo "1. RDS 클러스터 확인 중..."
CLUSTER_IDENTIFIER="passit-${ENVIRONMENT}-aurora-cluster"
REGION=${AWS_REGION:-ap-northeast-2}

if ! aws rds describe-db-clusters \
  --db-cluster-identifier "$CLUSTER_IDENTIFIER" \
  --region "$REGION" > /dev/null 2>&1; then
    echo "  ❌ RDS 클러스터 '$CLUSTER_IDENTIFIER'를 찾을 수 없습니다."
    exit 1
fi

echo "  ✅ 클러스터 확인됨: $CLUSTER_IDENTIFIER"
echo ""

# 2. 현재 deletion protection 상태 확인
echo "2. 현재 deletion protection 상태 확인 중..."
CURRENT_STATUS=$(aws rds describe-db-clusters \
  --db-cluster-identifier "$CLUSTER_IDENTIFIER" \
  --region "$REGION" \
  --query 'DBClusters[0].DeletionProtection' \
  --output text)

echo "  현재 상태: $CURRENT_STATUS"
echo ""

if [ "$CURRENT_STATUS" = "false" ]; then
    echo "  ✅ Deletion protection이 이미 비활성화되어 있습니다."
    exit 0
fi

# 3. Deletion protection 비활성화
echo "3. Deletion protection 비활성화 중..."
echo "  ⚠️  주의: 이 작업은 RDS 클러스터를 삭제 가능하게 만듭니다!"
echo ""

read -p "계속하시겠습니까? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "취소되었습니다."
    exit 0
fi

aws rds modify-db-cluster \
  --db-cluster-identifier "$CLUSTER_IDENTIFIER" \
  --no-deletion-protection \
  --apply-immediately \
  --region "$REGION" > /dev/null

echo "  ✅ Deletion protection 비활성화 요청 완료"
echo ""

# 4. 상태 확인
echo "4. 상태 확인 중..."
for i in {1..30}; do
    STATUS=$(aws rds describe-db-clusters \
      --db-cluster-identifier "$CLUSTER_IDENTIFIER" \
      --region "$REGION" \
      --query 'DBClusters[0].DeletionProtection' \
      --output text)
    
    if [ "$STATUS" = "false" ]; then
        echo "  ✅ Deletion protection이 비활성화되었습니다!"
        break
    fi
    
    echo "  대기 중... ($i/30)"
    sleep 5
done

echo ""
echo "=========================================="
echo "완료"
echo "=========================================="
echo ""
echo "이제 Terraform으로 RDS 클러스터를 삭제할 수 있습니다:"
echo "  terraform destroy -target=module.data"
echo ""

