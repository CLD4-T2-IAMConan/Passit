#!/bin/bash

# Prod 환경에 서비스 Pod 배포 스크립트
# 사용법: ./terraform/scripts/deploy-services-prod.sh

set -e
set -o pipefail

# 색상 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

ENVIRONMENT="prod"
REGION="ap-northeast-2"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"
ARGOCD_DIR="$SCRIPT_DIR/../argocd"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 Prod 환경 서비스 Pod 배포${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1. EKS 클러스터 접속
echo -e "${YELLOW}📡 1. EKS 클러스터 접속 설정 중...${NC}"
cd "$TERRAFORM_DIR" || exit 1

# AWS 프로필 설정
if [ -z "$AWS_PROFILE" ]; then
    export AWS_PROFILE=passit
    echo "  AWS_PROFILE을 'passit'으로 설정했습니다."
fi

# AWS 자격 증명 확인
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: AWS 자격 증명이 설정되지 않았습니다.${NC}"
    exit 1
fi

# 클러스터 이름 가져오기
CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null || echo "passit-prod-eks")
if [ -z "$CLUSTER_NAME" ]; then
    CLUSTER_NAME="passit-prod-eks"
fi

echo "  클러스터: $CLUSTER_NAME"
echo "  리전: $REGION"

# kubeconfig 업데이트
if ! aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$REGION" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: 클러스터에 접속할 수 없습니다.${NC}"
    exit 1
fi

# 접속 확인
if ! kubectl cluster-info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: kubectl이 클러스터에 접속할 수 없습니다.${NC}"
    exit 1
fi

echo -e "${GREEN}  ✅ 클러스터 접속 완료${NC}"
echo ""

# 2. Kubernetes 사전 요구사항 확인
echo -e "${YELLOW}🔍 2. Kubernetes 사전 요구사항 확인 중...${NC}"

# 서비스별 Namespace 확인 및 생성
SERVICE_NAMESPACES=("account" "ticket" "trade" "chat" "cs")

for namespace in "${SERVICE_NAMESPACES[@]}"; do
    if ! kubectl get namespace "$namespace" > /dev/null 2>&1; then
        echo -e "${YELLOW}  ⚠️  Namespace '$namespace'가 없습니다. 생성합니다...${NC}"
        kubectl create namespace "$namespace"
        echo -e "${GREEN}  ✅ Namespace '$namespace' 생성 완료${NC}"
    else
        echo -e "${GREEN}  ✅ Namespace '$namespace' 존재함${NC}"
    fi
done

if ! kubectl get namespace argocd > /dev/null 2>&1; then
    echo -e "${YELLOW}  ⚠️  Namespace 'argocd'가 없습니다. 생성합니다...${NC}"
    kubectl create namespace argocd
    echo -e "${GREEN}  ✅ Namespace 'argocd' 생성 완료${NC}"
else
    echo -e "${GREEN}  ✅ Namespace 'argocd' 존재함${NC}"
fi
echo ""

# 3. ArgoCD 설치 확인
echo -e "${YELLOW}🔍 3. ArgoCD 설치 상태 확인 중...${NC}"

if ! kubectl get deployment argocd-server -n argocd > /dev/null 2>&1; then
    echo -e "${YELLOW}  ⚠️  ArgoCD가 설치되어 있지 않습니다.${NC}"
    echo "  ArgoCD를 설치하려면 다음 명령어를 실행하세요:"
    echo "    kubectl create namespace argocd"
    echo "    kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml"
    echo ""
    read -p "  지금 ArgoCD를 설치하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "  ArgoCD 설치 중..."
        kubectl create namespace argocd 2>/dev/null || true
        kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
        echo "  ⏳ ArgoCD가 준비될 때까지 대기 중..."
        kubectl wait --for=condition=available \
            --timeout=600s \
            deployment/argocd-server \
            -n argocd || echo "  ⚠️  ArgoCD가 아직 준비되지 않았습니다."
        echo -e "${GREEN}  ✅ ArgoCD 설치 완료${NC}"
    else
        echo -e "${RED}  ❌ ArgoCD가 필요합니다. 설치 후 다시 실행하세요.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}  ✅ ArgoCD가 설치되어 있습니다.${NC}"
fi
echo ""

# 4. ArgoCD App of Apps 배포
echo -e "${YELLOW}📦 4. ArgoCD App of Apps 배포 중...${NC}"

cd "$SCRIPT_DIR/.." || exit 1

if [ ! -f "$ARGOCD_DIR/app-of-apps.yaml" ]; then
    echo -e "${RED}❌ Error: app-of-apps.yaml 파일을 찾을 수 없습니다.${NC}"
    exit 1
fi

# App of Apps 배포
if kubectl get application passit-services -n argocd > /dev/null 2>&1; then
    echo "  App of Apps 'passit-services'가 이미 존재합니다."
    read -p "  업데이트하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kubectl apply -f "$ARGOCD_DIR/app-of-apps.yaml"
        echo -e "${GREEN}  ✅ App of Apps 업데이트 완료${NC}"
    fi
else
    kubectl apply -f "$ARGOCD_DIR/app-of-apps.yaml"
    echo -e "${GREEN}  ✅ App of Apps 배포 완료${NC}"
fi
echo ""

# 5. ArgoCD 동기화
echo -e "${YELLOW}🔄 5. ArgoCD 동기화 중...${NC}"

# ArgoCD CLI 설치 확인
if ! command -v argocd &> /dev/null; then
    echo "  ArgoCD CLI가 설치되어 있지 않습니다."
    echo "  설치 중..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install argocd
        else
            echo "  Homebrew가 없습니다. 수동으로 ArgoCD CLI를 설치하세요:"
            echo "    brew install argocd"
            echo "  또는:"
            echo "    curl -sSL -o argocd-darwin-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-darwin-amd64"
            echo "    sudo install -m 555 argocd-darwin-amd64 /usr/local/bin/argocd"
        fi
    else
        # Linux
        curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
        sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
        rm argocd-linux-amd64
    fi
fi

# ArgoCD 서버 포트 포워딩 및 로그인
echo "  ArgoCD 서버에 연결 중..."
# 기존 포트 포워딩 프로세스 종료
pkill -f "kubectl port-forward.*argocd-server" 2>/dev/null || true
sleep 2

kubectl port-forward svc/argocd-server -n argocd 8080:443 > /dev/null 2>&1 &
PORT_FORWARD_PID=$!
sleep 5

# ArgoCD 비밀번호 가져오기
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" 2>/dev/null | base64 -d || echo "")

if [ -n "$ARGOCD_PASSWORD" ]; then
    echo "  ArgoCD에 로그인 중..."
    argocd login localhost:8080 --username admin --password "$ARGOCD_PASSWORD" --insecure --grpc-web > /dev/null 2>&1 || true
    
    # App of Apps 동기화
    echo "  App of Apps 동기화 중..."
    argocd app sync passit-services --server-side > /dev/null 2>&1 || true
    
    # 개별 서비스 동기화
    echo "  개별 서비스 동기화 중..."
    PROD_SERVICES=("account-service-prod" "ticket-service-prod" "trade-service-prod" "chat-service-prod" "cs-service-prod")
    
    for service in "${PROD_SERVICES[@]}"; do
        echo "    동기화 중: $service"
        argocd app sync "$service" --server-side > /dev/null 2>&1 || echo "      ⚠️  $service 동기화 중 오류 (앱이 아직 생성되지 않았을 수 있음)"
    done
    
    # 포트 포워딩 종료
    kill $PORT_FORWARD_PID 2>/dev/null || true
    
    echo -e "${GREEN}  ✅ 동기화 완료${NC}"
else
    echo -e "${YELLOW}  ⚠️  ArgoCD 비밀번호를 가져올 수 없습니다. 수동으로 동기화하세요.${NC}"
    kill $PORT_FORWARD_PID 2>/dev/null || true
fi
echo ""

# 6. 배포 상태 확인
echo -e "${YELLOW}📊 6. 배포 상태 확인 중...${NC}"
echo ""

# ArgoCD Applications 확인
echo "ArgoCD Applications:"
kubectl get applications -n argocd 2>/dev/null || echo "  (없음)"
echo ""

# Pod 상태 확인 (각 서비스 namespace별로)
echo "Pod 상태:"
for namespace in "${SERVICE_NAMESPACES[@]}"; do
    if kubectl get pods -n "$namespace" > /dev/null 2>&1; then
        echo ""
        echo "Namespace: $namespace"
        kubectl get pods -n "$namespace" 2>/dev/null || echo "  (Pod 없음)"
    fi
done
echo ""

# 7. 완료 메시지
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ 배포 프로세스 완료!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "다음 명령어로 상태를 확인하세요:"
echo ""
echo "  # ArgoCD Applications 확인:"
echo "  kubectl get applications -n argocd"
echo ""
echo "  # Pod 상태 확인:"
for namespace in "${SERVICE_NAMESPACES[@]}"; do
    echo "  kubectl get pods -n $namespace"
done
echo ""
echo "  # 상세 상태 확인:"
echo "  ./terraform/scripts/check-argocd-apps.sh"
echo ""
echo "  # ArgoCD UI 접근:"
echo "  kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo "  # 브라우저: https://localhost:8080"
echo ""

