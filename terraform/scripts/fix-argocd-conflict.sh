#!/bin/bash

# ArgoCD Helm 충돌 해결 스크립트
#
# 사용 방법:
# ./terraform/scripts/fix-argocd-conflict.sh dev

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "Error: $TERRAFORM_DIR 디렉토리가 존재하지 않습니다."
    exit 1
fi

echo "=========================================="
echo "ArgoCD Helm 충돌 해결"
echo "Environment: $ENVIRONMENT"
echo "=========================================="

cd "$TERRAFORM_DIR"

# kubectl 접속 확인
if ! kubectl cluster-info > /dev/null 2>&1; then
    echo "Error: kubectl이 클러스터에 접속할 수 없습니다."
    echo "먼저 EKS에 접속하세요: ./terraform/scripts/connect-eks.sh $ENVIRONMENT"
    exit 1
fi

echo ""
echo "기존 ArgoCD 리소스 확인 중..."
echo ""

# ArgoCD namespace 확인
if kubectl get namespace argocd > /dev/null 2>&1; then
    echo "✅ ArgoCD namespace 존재"
    
    # 기존 Helm release 확인
    if helm list -n argocd | grep -q argocd; then
        echo "⚠️  기존 Helm release 발견"
        echo ""
        echo "기존 Helm release 삭제 옵션:"
        echo "1. 기존 Helm release 삭제 (권장)"
        echo "2. 수동으로 리소스 정리"
        echo "3. 취소"
        echo ""
        read -p "선택 (1/2/3): " -n 1 -r
        echo ""
        
        if [[ $REPLY == "1" ]]; then
            echo "기존 Helm release 삭제 중..."
            helm uninstall argocd -n argocd || true
            echo "✅ Helm release 삭제 완료"
        elif [[ $REPLY == "2" ]]; then
            echo ""
            echo "수동 정리 명령어:"
            echo "  # ServiceAccount 삭제"
            echo "  kubectl delete serviceaccount argocd-application-controller -n argocd"
            echo ""
            echo "  # 또는 전체 namespace 삭제 (주의: 모든 ArgoCD 리소스 삭제)"
            echo "  kubectl delete namespace argocd"
            echo ""
            exit 0
        else
            echo "취소되었습니다."
            exit 0
        fi
    else
        echo "⚠️  Helm release가 없지만 리소스가 존재합니다."
        echo ""
        echo "기존 ServiceAccount 확인 중..."
        if kubectl get serviceaccount argocd-application-controller -n argocd > /dev/null 2>&1; then
            echo "⚠️  기존 ServiceAccount 발견: argocd-application-controller"
            echo ""
            read -p "ServiceAccount를 삭제하시겠습니까? (y/N): " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                kubectl delete serviceaccount argocd-application-controller -n argocd || true
                echo "✅ ServiceAccount 삭제 완료"
            fi
        fi
    fi
else
    echo "✅ ArgoCD namespace가 없습니다. 새로 생성됩니다."
fi

echo ""
echo "=========================================="
echo "다음 단계"
echo "=========================================="
echo "1. Terraform apply 실행:"
echo "   cd terraform/envs/$ENVIRONMENT"
echo "   terraform apply"
echo ""

