#!/bin/bash

# EKS 클러스터에 접속하는 스크립트
#
# 사용 방법:
# ./terraform/scripts/connect-eks.sh dev
# ./terraform/scripts/connect-eks.sh prod
#
# 또는 환경 변수로 설정:
# export AWS_REGION=ap-northeast-2
# export EKS_CLUSTER_NAME=your-cluster-name

set -e
set -o pipefail

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "Error: $TERRAFORM_DIR 디렉토리가 존재하지 않습니다."
    echo ""
    echo "사용 가능한 환경: dev, prod"
    exit 1
fi

echo "=========================================="
echo "EKS 클러스터 접속 설정"
echo "Environment: $ENVIRONMENT"
echo "=========================================="

# Terraform 디렉토리로 이동
cd "$TERRAFORM_DIR" || exit 1

# Terraform 초기화 확인
if [ ! -d ".terraform" ]; then
    echo ""
    echo "Warning: Terraform이 초기화되지 않았습니다."
    echo "terraform init을 먼저 실행하세요."
    echo ""
    read -p "지금 terraform init을 실행하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        terraform init
    else
        exit 1
    fi
fi

# AWS 프로필 설정 (환경에 따라 자동 선택)
if [ -z "$AWS_PROFILE" ]; then
    case "$ENVIRONMENT" in
        dev|prod|dr)
            export AWS_PROFILE=passit
            echo "AWS_PROFILE을 'passit'으로 설정했습니다."
            ;;
        *)
            echo "Warning: AWS_PROFILE이 설정되지 않았습니다. 기본 프로필을 사용합니다."
            ;;
    esac
fi

# AWS 자격 증명 확인
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "Error: AWS 자격 증명이 설정되지 않았습니다."
    echo "다음 중 하나를 수행하세요:"
    echo "  1. AWS_PROFILE 환경 변수 설정 (예: export AWS_PROFILE=passit)"
    echo "  2. aws configure 실행"
    echo "  3. AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY 설정"
    exit 1
fi

# 현재 AWS 계정 정보 표시
echo ""
echo "AWS 계정 정보:"
aws sts get-caller-identity

# 클러스터 이름 가져오기
echo ""
echo "Terraform output에서 클러스터 정보 가져오는 중..."

# Terraform state 확인
if ! terraform state list > /dev/null 2>&1; then
    echo "Error: Terraform state를 읽을 수 없습니다."
    echo "다음을 확인하세요:"
    echo "  1. terraform init이 실행되었는지"
    echo "  2. terraform apply가 성공적으로 완료되었는지"
    echo "  3. AWS 자격 증명이 올바른지 (S3 backend 사용 시)"
    exit 1
fi

CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null || echo "")

if [ -z "$CLUSTER_NAME" ]; then
    echo "Warning: Terraform output에서 클러스터 이름을 가져올 수 없습니다."
    echo "직접 클러스터 이름을 입력하거나, terraform apply를 먼저 실행하세요."
    echo ""
    read -p "EKS 클러스터 이름을 입력하세요 (예: passit-dev-eks): " CLUSTER_NAME

    if [ -z "$CLUSTER_NAME" ]; then
        echo "Error: 클러스터 이름이 필요합니다."
        exit 1
    fi
fi

# AWS 리전 가져오기
REGION=$(terraform output -raw region 2>/dev/null || echo "")
if [ -z "$REGION" ]; then
    REGION=${AWS_REGION:-ap-northeast-2}
    echo "Warning: Terraform output에서 region을 가져올 수 없어 기본값 사용: $REGION"
fi

echo ""
echo "클러스터 정보:"
echo "  이름: $CLUSTER_NAME"
echo "  리전: $REGION"

# 클러스터 존재 확인
echo ""
echo "클러스터 존재 여부 확인 중..."
if ! aws eks describe-cluster --name "$CLUSTER_NAME" --region "$REGION" > /dev/null 2>&1; then
    echo "Error: 클러스터 '$CLUSTER_NAME'를 찾을 수 없습니다."
    echo "다음을 확인하세요:"
    echo "  1. 클러스터 이름이 올바른지"
    echo "  2. AWS 리전이 올바른지"
    echo "  3. 클러스터가 생성되었는지"
    exit 1
fi

# kubeconfig 업데이트
echo ""
echo "kubeconfig 업데이트 중..."
aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$REGION"

# 접속 확인
echo ""
echo "클러스터 접속 확인 중..."
if kubectl cluster-info > /dev/null 2>&1; then
    echo "✅ EKS 클러스터에 성공적으로 접속했습니다!"
    echo ""
    echo "현재 컨텍스트:"
    kubectl config current-context
    echo ""
    echo "클러스터 정보:"
    kubectl cluster-info
    echo ""
    echo "사용 가능한 명령어:"
    echo "  kubectl get nodes          # 노드 목록 확인"
    echo "  kubectl get pods -A        # 모든 Pod 목록"
    echo "  kubectl get svc -A         # 모든 Service 목록"
    echo ""
    echo "테스트 실행:"
    echo "  cd service-account"
    echo "  ./scripts/test-in-eks-pod.sh"
else
    echo "Error: 클러스터에 접속할 수 없습니다."
    echo "권한을 확인하세요."
    exit 1
fi

