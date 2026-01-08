#!/bin/bash

# 모든 서비스 Pod 로그 확인 스크립트
# 사용법: ./check-all-service-logs.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}

echo "📋 모든 서비스 Pod 로그 확인: ${ENVIRONMENT}"
echo "=========================================="
echo ""

# EKS 클러스터 연결
CLUSTER_NAME="passit-${ENVIRONMENT}-eks"
aws eks update-kubeconfig --name "${CLUSTER_NAME}" --region ap-northeast-2 > /dev/null 2>&1 || {
  echo "❌ EKS 클러스터 연결 실패"
  exit 1
}

# 서비스 목록
SERVICES=("account" "chat" "cs" "ticket" "trade")

for SERVICE in "${SERVICES[@]}"; do
  if ! kubectl get namespace "$SERVICE" > /dev/null 2>&1; then
    continue
  fi
  
  PODS=$(kubectl get pods -n "$SERVICE" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
  
  if [ -z "$PODS" ]; then
    continue
  fi
  
  FIRST_POD=$(echo "$PODS" | awk '{print $1}')
  
  echo "📦 ${SERVICE} 서비스: ${FIRST_POD}"
  echo "----------------------------------------"
  
  # 최근 에러 로그만 확인
  LOGS=$(kubectl logs -n "$SERVICE" "$FIRST_POD" --tail=30 2>&1 | grep -i -E "error|exception|failed|fatal|crash|connection|refused" | tail -10 || echo "")
  
  if [ -n "$LOGS" ]; then
    echo "$LOGS"
  else
    # 에러가 없으면 마지막 5줄만
    kubectl logs -n "$SERVICE" "$FIRST_POD" --tail=5 2>&1 | tail -5 || echo "로그를 가져올 수 없습니다"
  fi
  
  echo ""
  echo ""
done

echo "=========================================="
echo "✅ 확인 완료!"
echo "=========================================="
echo ""
echo "💡 특정 서비스 상세 로그:"
echo "   ./terraform/scripts/check-pod-logs.sh ${ENVIRONMENT} <service_name>"

