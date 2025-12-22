#!/bin/bash

# EKS 클러스터에 서비스를 테스트 배포하는 스크립트
#
# 사용 방법:
# ./terraform/scripts/test-deploy-service.sh dev account
# ./terraform/scripts/test-deploy-service.sh dev ticket

set -e

ENVIRONMENT=${1:-dev}
SERVICE_NAME=${2:-account}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"
SERVICE_DIR="$SCRIPT_DIR/../../service-${SERVICE_NAME}"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "Error: $TERRAFORM_DIR 디렉토리가 존재하지 않습니다."
    exit 1
fi

if [ ! -d "$SERVICE_DIR" ]; then
    echo "Error: $SERVICE_DIR 디렉토리가 존재하지 않습니다."
    exit 1
fi

echo "=========================================="
echo "서비스 테스트 배포"
echo "Environment: $ENVIRONMENT"
echo "Service: $SERVICE_NAME"
echo "=========================================="
echo ""

cd "$TERRAFORM_DIR"

# 1. EKS 클러스터 연결
echo "1. EKS 클러스터 연결 중..."
CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null || echo "passit-${ENVIRONMENT}-eks")
REGION=${AWS_REGION:-ap-northeast-2}

if [ -z "$CLUSTER_NAME" ]; then
    echo "Error: 클러스터 이름을 찾을 수 없습니다."
    exit 1
fi

echo "  클러스터: $CLUSTER_NAME"
echo "  리전: $REGION"

aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$REGION" > /dev/null 2>&1

# 2. 클러스터 접속 확인
if ! kubectl cluster-info > /dev/null 2>&1; then
    echo "Error: 클러스터에 접속할 수 없습니다."
    exit 1
fi

echo "  ✅ 클러스터 연결 완료"
echo ""

# 3. Namespace 확인/생성
echo "2. Namespace 확인 중..."
NAMESPACE="$SERVICE_NAME"

if ! kubectl get namespace "$NAMESPACE" > /dev/null 2>&1; then
    echo "  Namespace '$NAMESPACE' 생성 중..."
    kubectl create namespace "$NAMESPACE"
else
    echo "  Namespace '$NAMESPACE' 이미 존재함"
fi
echo ""

# 4. Helm chart로 배포
echo "3. Helm chart로 배포 중..."
cd "$SERVICE_DIR"

if [ ! -d "helm" ]; then
    echo "Error: helm 디렉토리가 없습니다."
    exit 1
fi

# Helm release 이름
RELEASE_NAME="${SERVICE_NAME}-service"

# 기존 release가 있으면 업그레이드, 없으면 설치
if helm list -n "$NAMESPACE" | grep -q "$RELEASE_NAME"; then
    echo "  기존 release 업그레이드 중..."
    helm upgrade "$RELEASE_NAME" ./helm \
      --namespace "$NAMESPACE" \
      --set image.repository="ghcr.io/cld4-t2-iamconan/service-${SERVICE_NAME}" \
      --set image.tag="latest" \
      --set image.pullPolicy=Always
else
    echo "  새 release 설치 중..."
    helm install "$RELEASE_NAME" ./helm \
      --namespace "$NAMESPACE" \
      --create-namespace \
      --set image.repository="ghcr.io/cld4-t2-iamconan/service-${SERVICE_NAME}" \
      --set image.tag="latest" \
      --set image.pullPolicy=Always
fi

echo ""
echo "4. 배포 상태 확인 중..."
echo ""

# Pod 상태 확인
echo "Pod 상태:"
kubectl get pods -n "$NAMESPACE" -l app="${SERVICE_NAME}-service" || kubectl get pods -n "$NAMESPACE"

echo ""
echo "Service 상태:"
kubectl get svc -n "$NAMESPACE"

echo ""
echo "=========================================="
echo "배포 완료"
echo "=========================================="
echo ""
echo "다음 명령어로 확인하세요:"
echo "  kubectl get pods -n $NAMESPACE"
echo "  kubectl logs -n $NAMESPACE -l app=${SERVICE_NAME}-service"
echo "  kubectl port-forward -n $NAMESPACE svc/${RELEASE_NAME} 8080:80"
echo ""

