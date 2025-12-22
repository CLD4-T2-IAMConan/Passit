#!/bin/bash

# EKS 노드 그룹 생성 스크립트
#
# 사용 방법:
# ./terraform/scripts/create-nodegroup.sh dev

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
echo "EKS 노드 그룹 생성"
echo "Environment: $ENVIRONMENT"
echo "=========================================="
echo ""

# 1. 클러스터 확인
echo "1. EKS 클러스터 확인 중..."
CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null || echo "passit-${ENVIRONMENT}-eks")
REGION=${AWS_REGION:-ap-northeast-2}

if ! aws eks describe-cluster --name "$CLUSTER_NAME" --region "$REGION" > /dev/null 2>&1; then
    echo "  ❌ 클러스터 '$CLUSTER_NAME'를 찾을 수 없습니다."
    echo "  먼저 클러스터를 생성하세요: terraform apply -target=module.eks"
    exit 1
fi

echo "  ✅ 클러스터 확인됨: $CLUSTER_NAME"
echo ""

# 2. 기존 노드 그룹 확인
echo "2. 기존 노드 그룹 확인 중..."
NODEGROUPS=$(aws eks list-nodegroups --cluster-name "$CLUSTER_NAME" --region "$REGION" --query 'nodegroups' --output text 2>/dev/null || echo "")

if [ -n "$NODEGROUPS" ] && [ "$NODEGROUPS" != "None" ]; then
    echo "  기존 노드 그룹이 있습니다:"
    echo "$NODEGROUPS" | tr '\t' '\n' | while read ng; do
        echo "    - $ng"
    done
    echo ""
    read -p "기존 노드 그룹이 있습니다. 계속하시겠습니까? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "취소되었습니다."
        exit 0
    fi
else
    echo "  노드 그룹이 없습니다. 생성합니다."
fi

echo ""

# 3. Terraform으로 노드 그룹 생성
echo "3. Terraform으로 노드 그룹 생성 중..."
echo "  이 작업은 약 5-10분이 소요됩니다."
echo ""

terraform apply -target=module.eks -auto-approve

echo ""
echo "4. 노드 그룹 상태 확인 중..."
echo ""

# 노드 그룹 생성 대기
for i in {1..30}; do
    NODEGROUPS=$(aws eks list-nodegroups --cluster-name "$CLUSTER_NAME" --region "$REGION" --query 'nodegroups' --output text 2>/dev/null || echo "")
    
    if [ -n "$NODEGROUPS" ] && [ "$NODEGROUPS" != "None" ]; then
        NODEGROUP_NAME=$(echo "$NODEGROUPS" | tr '\t' '\n' | head -1)
        STATUS=$(aws eks describe-nodegroup \
            --cluster-name "$CLUSTER_NAME" \
            --nodegroup-name "$NODEGROUP_NAME" \
            --region "$REGION" \
            --query 'nodegroup.status' \
            --output text 2>/dev/null || echo "UNKNOWN")
        
        echo "  노드 그룹: $NODEGROUP_NAME"
        echo "  상태: $STATUS"
        
        if [ "$STATUS" = "ACTIVE" ]; then
            echo ""
            echo "  ✅ 노드 그룹이 활성화되었습니다!"
            break
        fi
    fi
    
    echo "  대기 중... ($i/30)"
    sleep 10
done

echo ""
echo "5. 노드 확인 중..."
echo ""

# kubeconfig 업데이트
aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$REGION" > /dev/null 2>&1

# 노드 확인
if kubectl get nodes > /dev/null 2>&1; then
    echo "  ✅ 노드가 준비되었습니다:"
    kubectl get nodes
else
    echo "  ⚠️  노드가 아직 준비되지 않았습니다. 잠시 후 다시 확인하세요:"
    echo "     kubectl get nodes"
fi

echo ""
echo "=========================================="
echo "완료"
echo "=========================================="
echo ""
echo "이제 Pod를 배포할 수 있습니다!"
echo ""

