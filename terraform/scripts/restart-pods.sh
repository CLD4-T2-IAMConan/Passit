#!/bin/bash

# Pod 재시작 스크립트
# 사용법: ./restart-pods.sh [dev|prod] [service_name] 또는 [all]

set -e

ENVIRONMENT=${1:-dev}
SERVICE=${2:-all}

echo "🔄 Pod 재시작: ${ENVIRONMENT}"
echo "=========================================="
echo ""

# EKS 클러스터 연결
CLUSTER_NAME="passit-${ENVIRONMENT}-eks"
aws eks update-kubeconfig --name "${CLUSTER_NAME}" --region ap-northeast-2 > /dev/null 2>&1 || {
  echo "❌ EKS 클러스터 연결 실패"
  exit 1
}

if [ "$SERVICE" = "all" ]; then
  # 모든 서비스 Pod 재시작
  SERVICES=("account" "chat" "cs" "ticket" "trade")
  
  echo "1️⃣  모든 서비스 Pod 재시작 중..."
  echo ""
  
  for NS in "${SERVICES[@]}"; do
    if kubectl get namespace "$NS" > /dev/null 2>&1; then
      PODS=$(kubectl get pods -n "$NS" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
      
      if [ -n "$PODS" ]; then
        echo "   📦 ${NS} 서비스:"
        for POD in $PODS; do
          echo "      🗑️  ${POD} 삭제 중..."
          kubectl delete pod "$POD" -n "$NS" > /dev/null 2>&1 || true
        done
        echo "      ✅ 재시작 완료"
        echo ""
      fi
    fi
  done
else
  # 특정 서비스만 재시작
  if kubectl get namespace "$SERVICE" > /dev/null 2>&1; then
    echo "1️⃣  ${SERVICE} 서비스 Pod 재시작 중..."
    echo ""
    
    PODS=$(kubectl get pods -n "$SERVICE" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
    
    if [ -n "$PODS" ]; then
      for POD in $PODS; do
        echo "   🗑️  ${POD} 삭제 중..."
        kubectl delete pod "$POD" -n "$SERVICE" > /dev/null 2>&1 || true
      done
      echo "   ✅ 재시작 완료"
    else
      echo "   ⚠️  Pod가 없습니다"
    fi
  else
    echo "   ❌ Namespace가 없습니다: ${SERVICE}"
    exit 1
  fi
fi

echo ""
echo "2️⃣  Pod 상태 확인 (10초 후)..."
sleep 10

if [ "$SERVICE" = "all" ]; then
  for NS in "${SERVICES[@]}"; do
    if kubectl get namespace "$NS" > /dev/null 2>&1; then
      echo ""
      echo "   📦 ${NS} 서비스:"
      kubectl get pods -n "$NS" 2>/dev/null | grep -v "NAME" || echo "      Pod 없음"
    fi
  done
else
  echo ""
  echo "   📦 ${SERVICE} 서비스:"
  kubectl get pods -n "$SERVICE" 2>/dev/null | grep -v "NAME" || echo "      Pod 없음"
fi

echo ""
echo "=========================================="
echo "✅ 완료!"
echo "=========================================="
echo ""
echo "💡 추가 확인:"
echo "   kubectl get pods --all-namespaces | grep -E 'account|chat|cs|ticket|trade'"
echo "   kubectl logs -n <namespace> <pod-name> --tail=50"

