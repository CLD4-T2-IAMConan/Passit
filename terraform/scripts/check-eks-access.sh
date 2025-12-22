#!/bin/bash

# EKS Access 권한 확인 스크립트
#
# 사용 방법:
# ./terraform/scripts/check-eks-access.sh dev

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "Error: $TERRAFORM_DIR 디렉토리가 존재하지 않습니다."
    exit 1
fi

echo "=========================================="
echo "EKS Access 권한 진단"
echo "Environment: $ENVIRONMENT"
echo "=========================================="

cd "$TERRAFORM_DIR"

# AWS 자격 증명 확인
echo ""
echo "1. AWS 자격 증명 확인:"
echo "----------------------------------------"
if ! aws sts get-caller-identity; then
    echo "Error: AWS 자격 증명이 설정되지 않았습니다."
    exit 1
fi

# 클러스터 이름 가져오기
CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null || echo "")
if [ -z "$CLUSTER_NAME" ]; then
    CLUSTER_NAME=$(awk -F'"' '/^cluster_name[[:space:]]*=/ {print $2}' terraform.tfvars | head -1 | xargs)
fi

if [ -z "$CLUSTER_NAME" ]; then
    echo "Error: 클러스터 이름을 찾을 수 없습니다."
    exit 1
fi

REGION=${AWS_REGION:-ap-northeast-2}
PRINCIPAL_ARN="arn:aws:iam::727646470302:user/iamconan"

echo ""
echo "2. 클러스터 정보:"
echo "----------------------------------------"
echo "  이름: $CLUSTER_NAME"
echo "  리전: $REGION"
echo "  사용자: $PRINCIPAL_ARN"
echo ""

# 클러스터 존재 확인
echo "3. 클러스터 존재 확인:"
echo "----------------------------------------"
if ! aws eks describe-cluster --name "$CLUSTER_NAME" --region "$REGION" > /dev/null 2>&1; then
    echo "❌ 클러스터를 찾을 수 없습니다."
    exit 1
else
    echo "✅ 클러스터 존재 확인"
fi

# Access Entry 확인
echo ""
echo "4. Access Entry 확인:"
echo "----------------------------------------"
ACCESS_ENTRY=$(aws eks describe-access-entry \
  --cluster-name "$CLUSTER_NAME" \
  --principal-arn "$PRINCIPAL_ARN" \
  --region "$REGION" 2>&1 || echo "NOT_FOUND")

if echo "$ACCESS_ENTRY" | grep -q "NOT_FOUND\|does not exist"; then
    echo "❌ Access Entry가 존재하지 않습니다."
    echo ""
    echo "해결 방법:"
    echo "  ./terraform/scripts/fix-eks-access.sh $ENVIRONMENT"
    exit 1
else
    echo "✅ Access Entry 존재"
    echo "$ACCESS_ENTRY" | jq -r '.accessEntry | "  Type: \(.type)\n  Kubernetes Groups: \(.kubernetesGroups // [])\n  Username: \(.username // "N/A")"' 2>/dev/null || echo "  (상세 정보 확인 중...)"
fi

# Policy 확인
echo ""
echo "5. 할당된 Policy 확인:"
echo "----------------------------------------"
POLICIES=$(aws eks list-associated-access-policies \
  --cluster-name "$CLUSTER_NAME" \
  --principal-arn "$PRINCIPAL_ARN" \
  --region "$REGION" \
  --query 'associatedAccessPolicies[].{PolicyArn:policyArn,AccessScope:accessScope}' \
  --output json 2>&1 || echo "ERROR")

if echo "$POLICIES" | grep -q "ERROR\|does not exist"; then
    echo "❌ Policy를 확인할 수 없습니다."
    echo "$POLICIES"
    exit 1
else
    POLICY_COUNT=$(echo "$POLICIES" | jq '. | length' 2>/dev/null || echo "0")
    if [ "$POLICY_COUNT" -eq "0" ]; then
        echo "❌ Policy가 할당되지 않았습니다."
        echo ""
        echo "해결 방법:"
        echo "  ./terraform/scripts/fix-eks-access.sh $ENVIRONMENT"
        exit 1
    else
        echo "✅ Policy 할당됨 ($POLICY_COUNT개):"
        echo "$POLICIES" | jq -r '.[] | "  - \(.PolicyArn)\n    Scope: \(.AccessScope.Type)"' 2>/dev/null || echo "$POLICIES"
    fi
fi

# kubectl 접속 확인
echo ""
echo "6. kubectl 접속 확인:"
echo "----------------------------------------"
if ! kubectl cluster-info > /dev/null 2>&1; then
    echo "❌ kubectl이 클러스터에 접속할 수 없습니다."
    echo ""
    echo "kubeconfig 업데이트 중..."
    if aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$REGION" > /dev/null 2>&1; then
        echo "✅ kubeconfig 업데이트 완료"
        echo ""
        echo "다시 접속 확인 중..."
        if kubectl cluster-info > /dev/null 2>&1; then
            echo "✅ kubectl 접속 성공!"
        else
            echo "❌ 여전히 접속할 수 없습니다."
            echo ""
            echo "추가 확인 사항:"
            echo "  1. 현재 AWS 자격 증명이 iamconan 사용자인지 확인:"
            echo "     aws sts get-caller-identity"
            echo ""
            echo "  2. Access Entry의 Policy가 올바른지 확인:"
            echo "     aws eks list-associated-access-policies \\"
            echo "       --cluster-name $CLUSTER_NAME \\"
            echo "       --principal-arn $PRINCIPAL_ARN \\"
            echo "       --region $REGION"
            echo ""
            echo "  3. 클러스터 엔드포인트 접근 가능 여부 확인:"
            echo "     aws eks describe-cluster --name $CLUSTER_NAME --region $REGION | jq '.cluster.endpoint'"
            exit 1
        fi
    else
        echo "❌ kubeconfig 업데이트 실패"
        exit 1
    fi
else
    echo "✅ kubectl 접속 성공!"
    echo ""
    echo "클러스터 정보:"
    kubectl cluster-info
fi

echo ""
echo "=========================================="
echo "진단 완료"
echo "=========================================="

