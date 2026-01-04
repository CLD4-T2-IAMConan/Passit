#!/bin/bash

# 현재 Pod 상태 빠른 확인 스크립트
# 사용법: ./check-current-pod-status.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}

echo "📊 현재 Pod 상태: ${ENVIRONMENT}"
echo "=========================================="
echo ""

# EKS 클러스터 연결
CLUSTER_NAME="passit-${ENVIRONMENT}-eks"

# kubeconfig가 이미 설정되어 있는지 확인
if ! kubectl cluster-info > /dev/null 2>&1; then
  # kubeconfig가 없으면 업데이트 시도
  aws eks update-kubeconfig --name "${CLUSTER_NAME}" --region ap-northeast-2 > /dev/null 2>&1 || {
    echo "❌ EKS 클러스터 연결 실패"
    exit 1
  }
fi

# 서비스 목록
SERVICES=("account" "chat" "cs" "ticket" "trade")

echo "서비스별 Pod 상태:"
echo ""

for NS in "${SERVICES[@]}"; do
  if kubectl get namespace "$NS" > /dev/null 2>&1; then
    echo "📦 ${NS}:"
    kubectl get pods -n "$NS" 2>/dev/null | grep -v "NAME" || echo "   Pod 없음"
    echo ""
  fi
done

echo "=========================================="
echo "에러 Pod 상세:"
echo "=========================================="
echo ""

# 에러 Pod 확인
for NS in "${SERVICES[@]}"; do
  if kubectl get namespace "$NS" > /dev/null 2>&1; then
    ERROR_PODS=$(kubectl get pods -n "$NS" -o json 2>/dev/null | \
      jq -r '.items[] | select(.status.phase != "Running" or (.status.containerStatuses[0].restartCount // 0) > 0) | .metadata.name' 2>/dev/null || echo "")
    
    if [ -n "$ERROR_PODS" ]; then
      echo "$ERROR_PODS" | while read -r pod_name; do
        if [ -n "$pod_name" ]; then
          echo "📋 ${NS}/${pod_name}:"
          STATUS=$(kubectl get pod "$pod_name" -n "$NS" -o jsonpath='{.status.phase}' 2>/dev/null || echo "Unknown")
          RESTARTS=$(kubectl get pod "$pod_name" -n "$NS" -o jsonpath='{.status.containerStatuses[0].restartCount}' 2>/dev/null || echo "0")
          echo "   상태: ${STATUS}, 재시작: ${RESTARTS}회"
          
          # 최근 이벤트
          echo "   최근 이벤트:"
          kubectl describe pod "$pod_name" -n "$NS" 2>/dev/null | grep -A 3 "Events:" | tail -3 | sed 's/^/      /' || echo "      이벤트 없음"
          echo ""
        fi
      done
    fi
  fi
done

echo "=========================================="
echo "✅ 확인 완료!"
echo "=========================================="

