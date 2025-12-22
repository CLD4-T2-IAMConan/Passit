#!/bin/bash

# EKS Access Entry에 Policy 추가하는 스크립트
#
# 사용 방법:
# ./terraform/scripts/fix-eks-access.sh dev
# ./terraform/scripts/fix-eks-access.sh prod

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "Error: $TERRAFORM_DIR 디렉토리가 존재하지 않습니다."
    exit 1
fi

echo "=========================================="
echo "EKS Access Entry Policy 추가"
echo "Environment: $ENVIRONMENT"
echo "=========================================="

# Terraform 디렉토리로 이동
cd "$TERRAFORM_DIR"

# AWS 자격 증명 확인
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "Error: AWS 자격 증명이 설정되지 않았습니다."
    exit 1
fi

# 클러스터 이름 가져오기
CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null || echo "")

# Terraform output에서 가져오지 못한 경우 terraform.tfvars에서 읽기
if [ -z "$CLUSTER_NAME" ]; then
    echo "Terraform output에서 클러스터 이름을 가져올 수 없습니다."
    echo "terraform.tfvars에서 확인 중..."
    
    if [ -f "terraform.tfvars" ]; then
        # terraform.tfvars에서 cluster_name 값 추출 (간단하고 확실한 방법)
        # awk를 사용하여 = 뒤의 따옴표 안 값만 추출
        CLUSTER_NAME=$(awk -F'"' '/^cluster_name[[:space:]]*=/ {print $2}' terraform.tfvars | head -1)
        
        # 공백 제거
        CLUSTER_NAME=$(echo "$CLUSTER_NAME" | xargs)
        
        # 유효성 검사 (알파벳, 숫자, 하이픈만 허용)
        if [ -n "$CLUSTER_NAME" ] && [[ "$CLUSTER_NAME" =~ ^[a-zA-Z0-9-]+$ ]]; then
            echo "✅ terraform.tfvars에서 클러스터 이름 발견: $CLUSTER_NAME"
        else
            echo "Warning: 클러스터 이름 파싱 실패 또는 유효하지 않음: '$CLUSTER_NAME'"
            CLUSTER_NAME=""
        fi
    fi
fi

# 여전히 없으면 AWS CLI로 시도
if [ -z "$CLUSTER_NAME" ]; then
    echo "AWS CLI로 클러스터 목록을 확인 중..."
    
    # 환경에 맞는 클러스터 이름 패턴 추정
    if [ "$ENVIRONMENT" == "dev" ]; then
        CLUSTER_PATTERN="passit-dev"
    elif [ "$ENVIRONMENT" == "prod" ]; then
        CLUSTER_PATTERN="passit-prod"
    else
        CLUSTER_PATTERN="passit-$ENVIRONMENT"
    fi
    
    # AWS CLI로 클러스터 목록 가져오기
    CLUSTERS=$(aws eks list-clusters --region ap-northeast-2 --query 'clusters[]' --output text 2>/dev/null || echo "")
    
    if [ -n "$CLUSTERS" ]; then
        # 패턴에 맞는 클러스터 찾기
        CLUSTER_NAME=$(echo "$CLUSTERS" | grep -i "$CLUSTER_PATTERN" | head -1)
        
        if [ -z "$CLUSTER_NAME" ]; then
            # 패턴에 맞지 않으면 첫 번째 클러스터 사용
            CLUSTER_NAME=$(echo "$CLUSTERS" | head -1)
        fi
    fi
    
    # 여전히 없으면 사용자 입력 요청
    if [ -z "$CLUSTER_NAME" ]; then
        echo ""
        echo "사용 가능한 클러스터 목록:"
        aws eks list-clusters --region ap-northeast-2 --query 'clusters[]' --output table 2>/dev/null || echo "클러스터 목록을 가져올 수 없습니다."
        echo ""
        read -p "EKS 클러스터 이름을 입력하세요: " CLUSTER_NAME
        
        if [ -z "$CLUSTER_NAME" ]; then
            echo "Error: 클러스터 이름이 필요합니다."
            exit 1
        fi
    else
        echo "찾은 클러스터: $CLUSTER_NAME"
    fi
fi

# AWS 리전 가져오기
REGION=$(terraform output -raw region 2>/dev/null || echo "ap-northeast-2")
if [ -z "$REGION" ]; then
    REGION=${AWS_REGION:-ap-northeast-2}
fi

PRINCIPAL_ARN="arn:aws:iam::727646470302:user/iamconan"
POLICY_ARN="arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"

echo ""
echo "클러스터 정보:"
echo "  이름: $CLUSTER_NAME"
echo "  리전: $REGION"
echo "  사용자: $PRINCIPAL_ARN"
echo ""

# Access Entry 존재 확인
echo "Access Entry 확인 중..."
if ! aws eks describe-access-entry \
  --cluster-name "$CLUSTER_NAME" \
  --principal-arn "$PRINCIPAL_ARN" \
  --region "$REGION" > /dev/null 2>&1; then
    echo "Access Entry가 존재하지 않습니다. 생성 중..."
    
    # Access Entry 생성
    aws eks create-access-entry \
      --cluster-name "$CLUSTER_NAME" \
      --principal-arn "$PRINCIPAL_ARN" \
      --region "$REGION"
    
    echo "✅ Access Entry 생성 완료"
else
    echo "✅ Access Entry 존재 확인"
fi

# Policy 할당 확인
echo ""
echo "할당된 Policy 확인 중..."
POLICIES=$(aws eks list-associated-access-policies \
  --cluster-name "$CLUSTER_NAME" \
  --principal-arn "$PRINCIPAL_ARN" \
  --region "$REGION" \
  --query 'associatedAccessPolicies[].policyArn' \
  --output text 2>/dev/null || echo "")

if echo "$POLICIES" | grep -q "$POLICY_ARN"; then
    echo "✅ Policy가 이미 할당되어 있습니다."
else
    echo "Policy 할당 중..."
    
    # Policy 할당
    aws eks associate-access-policy \
      --cluster-name "$CLUSTER_NAME" \
      --principal-arn "$PRINCIPAL_ARN" \
      --policy-arn "$POLICY_ARN" \
      --access-scope type=cluster \
      --region "$REGION"
    
    echo "✅ Policy 할당 완료"
fi

echo ""
echo "=========================================="
echo "설정 완료"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "1. kubeconfig 재설정:"
echo "   aws eks update-kubeconfig --name $CLUSTER_NAME --region $REGION"
echo ""
echo "2. 접속 확인:"
echo "   kubectl cluster-info"
echo "   kubectl get nodes"
echo ""

