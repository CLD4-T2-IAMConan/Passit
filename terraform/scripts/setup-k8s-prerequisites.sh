#!/bin/bash

# Kubernetes 기본 설정 자동화 스크립트
# Namespace, GHCR Pull Secret, Database Secrets, AWS Load Balancer Controller를 자동으로 설정합니다.

set -e

ENVIRONMENT=${1:-dev}
REGION=${2:-ap-northeast-2}

# 환경 변수 확인
if [ -z "$GITHUB_USERNAME" ] || [ -z "$GITHUB_PAT" ]; then
    echo "⚠️  경고: GITHUB_USERNAME 또는 GITHUB_PAT 환경 변수가 설정되지 않았습니다."
    echo "   GHCR Pull Secret 생성을 건너뜁니다."
    echo ""
    echo "   설정 방법:"
    echo "   export GITHUB_USERNAME=your_username"
    echo "   export GITHUB_PAT=your_personal_access_token"
    echo ""
    read -p "계속하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    SKIP_GHCR=true
else
    SKIP_GHCR=false
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "❌ Error: $TERRAFORM_DIR 디렉토리가 존재하지 않습니다."
    exit 1
fi

echo "=========================================="
echo "Kubernetes 기본 설정"
echo "=========================================="
echo "Environment: ${ENVIRONMENT}"
echo "Region: ${REGION}"
echo "=========================================="
echo ""

# 1. EKS 클러스터 연결 확인
echo "📋 1. EKS 클러스터 연결 확인 중..."
cd "$TERRAFORM_DIR"

CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null || echo "passit-${ENVIRONMENT}-eks")

if ! aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$REGION" > /dev/null 2>&1; then
    echo "❌ Error: 클러스터에 접속할 수 없습니다."
    echo "   클러스터 이름: $CLUSTER_NAME"
    exit 1
fi

if ! kubectl cluster-info > /dev/null 2>&1; then
    echo "❌ Error: kubectl이 클러스터에 접속할 수 없습니다."
    exit 1
fi

echo "  ✅ 클러스터 연결 완료: $CLUSTER_NAME"
echo ""

# 2. Namespace 생성
echo "📦 2. Namespace 생성 중..."

# services namespace
if kubectl get namespace services > /dev/null 2>&1; then
    echo "  ℹ️  Namespace 'services' 이미 존재합니다."
else
    kubectl create namespace services
    echo "  ✅ Namespace 'services' 생성 완료"
fi

# argocd namespace
if kubectl get namespace argocd > /dev/null 2>&1; then
    echo "  ℹ️  Namespace 'argocd' 이미 존재합니다."
else
    kubectl create namespace argocd
    echo "  ✅ Namespace 'argocd' 생성 완료"
fi
echo ""

# 3. GHCR Pull Secret 생성
if [ "$SKIP_GHCR" = false ]; then
    echo "🔐 3. GHCR Pull Secret 생성 중..."
    
    if kubectl get secret ghcr-pull-secret -n services > /dev/null 2>&1; then
        echo "  ℹ️  Secret 'ghcr-pull-secret' 이미 존재합니다."
        read -p "  기존 Secret을 업데이트하시겠습니까? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kubectl delete secret ghcr-pull-secret -n services
            kubectl create secret docker-registry ghcr-pull-secret \
                --docker-server=ghcr.io \
                --docker-username="$GITHUB_USERNAME" \
                --docker-password="$GITHUB_PAT" \
                --namespace=services
            echo "  ✅ GHCR Pull Secret 업데이트 완료"
        fi
    else
        kubectl create secret docker-registry ghcr-pull-secret \
            --docker-server=ghcr.io \
            --docker-username="$GITHUB_USERNAME" \
            --docker-password="$GITHUB_PAT" \
            --namespace=services
        echo "  ✅ GHCR Pull Secret 생성 완료"
    fi
else
    echo "⏭️  3. GHCR Pull Secret 생성 건너뜀 (환경 변수 미설정)"
fi
echo ""

# 4. Database & Valkey Secrets 생성
echo "🗄️  4. Database & Valkey Secrets 생성 중..."

# Terraform output에서 DB 비밀번호 가져오기
DB_PASSWORD=$(terraform output -raw rds_master_password 2>/dev/null || echo "")

if [ -z "$DB_PASSWORD" ]; then
    echo "  ⚠️  경고: Terraform output에서 DB 비밀번호를 가져올 수 없습니다."
    echo "     수동으로 DB_PASSWORD 환경 변수를 설정하거나, Secret을 수동으로 생성하세요."
    read -p "  DB 비밀번호를 입력하세요 (Enter로 건너뛰기): " -s DB_PASSWORD
    echo
fi

if [ -n "$DB_PASSWORD" ]; then
    SERVICES=("account" "ticket" "trade" "cs" "chat")
    
    for service in "${SERVICES[@]}"; do
        if kubectl get secret "${service}-secret" -n services > /dev/null 2>&1; then
            echo "  ℹ️  Secret '${service}-secret' 이미 존재합니다."
        else
            kubectl create secret generic "${service}-secret" \
                --namespace=services \
                --from-literal=db.user=admin \
                --from-literal=db.password="$DB_PASSWORD" \
                --from-literal=valkey.password="" \
                --dry-run=client -o yaml | kubectl apply -f -
            echo "  ✅ Secret '${service}-secret' 생성 완료"
        fi
    done
else
    echo "  ⚠️  DB 비밀번호가 없어 Secret 생성을 건너뜁니다."
    echo "     나중에 수동으로 생성하세요:"
    echo "     kubectl create secret generic <service>-secret \\"
    echo "       --namespace=services \\"
    echo "       --from-literal=db.user=admin \\"
    echo "       --from-literal=db.password=<password> \\"
    echo "       --from-literal=valkey.password=\"\""
fi
echo ""

# 5. AWS Load Balancer Controller 설치
echo "⚖️  5. AWS Load Balancer Controller 설치 중..."

# Helm 레포지토리 확인
if ! helm repo list | grep -q "eks"; then
    echo "  📦 Helm 레포지토리 추가 중..."
    helm repo add eks https://aws.github.io/eks-charts
    helm repo update
    echo "  ✅ Helm 레포지토리 추가 완료"
fi

# Controller 설치 확인
if helm list -n kube-system | grep -q "aws-load-balancer-controller"; then
    echo "  ℹ️  AWS Load Balancer Controller가 이미 설치되어 있습니다."
    read -p "  재설치하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
            -n kube-system \
            --set clusterName="$CLUSTER_NAME" \
            --set serviceAccount.create=false \
            --set serviceAccount.name=aws-load-balancer-controller
        echo "  ✅ AWS Load Balancer Controller 업데이트 완료"
    fi
else
    echo "  📦 AWS Load Balancer Controller 설치 중..."
    helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
        -n kube-system \
        --set clusterName="$CLUSTER_NAME" \
        --set serviceAccount.create=false \
        --set serviceAccount.name=aws-load-balancer-controller
    
    echo "  ⏳ Controller가 준비될 때까지 대기 중..."
    kubectl wait --for=condition=available \
        --timeout=300s \
        deployment/aws-load-balancer-controller \
        -n kube-system || echo "  ⚠️  Controller가 아직 준비되지 않았습니다. 나중에 확인하세요."
    
    echo "  ✅ AWS Load Balancer Controller 설치 완료"
fi
echo ""

# 6. 설치 확인
echo "🔍 6. 설치 확인 중..."
echo ""
echo "Namespaces:"
kubectl get namespaces | grep -E "services|argocd" || echo "  (없음)"
echo ""

if [ "$SKIP_GHCR" = false ]; then
    echo "GHCR Pull Secret:"
    kubectl get secret ghcr-pull-secret -n services 2>/dev/null && echo "  ✅ 존재함" || echo "  ❌ 없음"
    echo ""
fi

echo "Database Secrets:"
kubectl get secrets -n services | grep -E "account-secret|ticket-secret|trade-secret|cs-secret|chat-secret" || echo "  (없음)"
echo ""

echo "AWS Load Balancer Controller:"
kubectl get deployment -n kube-system aws-load-balancer-controller 2>/dev/null && echo "  ✅ 설치됨" || echo "  ❌ 설치되지 않음"
echo ""

echo "=========================================="
echo "✅ Kubernetes 기본 설정 완료!"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "1. ArgoCD 설치 (4.5 단계)"
echo "2. Helm Values 업데이트 (4.6 단계)"
echo "3. 서비스 배포 (4.8 단계)"
echo ""

