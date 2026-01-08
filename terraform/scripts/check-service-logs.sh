#!/bin/bash

# 서비스 Pod 로그 확인 및 문제 진단 스크립트
# 사용법: ./check-service-logs.sh [service-name]

set -e

# 색상 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SERVICE=${1:-""}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 서비스 Pod 로그 확인 및 문제 진단${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1. Pod 상태 확인
echo -e "${YELLOW}📊 1. Pod 상태 확인${NC}"
echo ""

if [ -n "$SERVICE" ]; then
    # 특정 서비스만 확인
    NAMESPACE=$SERVICE
    echo "서비스: $SERVICE"
    kubectl get pods -n "$NAMESPACE" 2>/dev/null || echo -e "${RED}  ❌ Namespace '$NAMESPACE'를 찾을 수 없습니다.${NC}"
else
    # 모든 서비스 확인
    SERVICES=("account" "ticket" "trade" "cs" "chat")
    
    for NS in "${SERVICES[@]}"; do
        echo -e "${CYAN}📦 $NS${NC}"
        kubectl get pods -n "$NS" 2>/dev/null || echo -e "${YELLOW}  ⚠️  Namespace '$NS'에 Pod가 없습니다.${NC}"
        echo ""
    done
fi
echo ""

# 2. 문제가 있는 Pod 로그 확인
echo -e "${YELLOW}🔍 2. 문제가 있는 Pod 로그 확인${NC}"
echo ""

if [ -n "$SERVICE" ]; then
    # 특정 서비스의 문제 Pod 확인
    NAMESPACE=$SERVICE
    ERROR_PODS=$(kubectl get pods -n "$NAMESPACE" -o jsonpath='{.items[?(@.status.phase!="Running" || @.status.containerStatuses[0].ready==false)].metadata.name}' 2>/dev/null || echo "")
    
    if [ -n "$ERROR_PODS" ]; then
        for POD in $ERROR_PODS; do
            echo -e "${RED}❌ $POD${NC}"
            echo "로그 (최근 50줄):"
            kubectl logs -n "$NAMESPACE" "$POD" --tail=50 2>&1 | tail -30
            echo ""
            echo "상태:"
            kubectl describe pod -n "$NAMESPACE" "$POD" | grep -A 5 "State:" || true
            echo ""
        done
    else
        echo -e "${GREEN}  ✅ 문제가 있는 Pod가 없습니다.${NC}"
    fi
else
    # 모든 서비스의 문제 Pod 확인
    SERVICES=("account" "ticket" "trade" "cs" "chat")
    
    for NS in "${SERVICES[@]}"; do
        ERROR_PODS=$(kubectl get pods -n "$NS" -o jsonpath='{.items[?(@.status.phase!="Running" || @.status.containerStatuses[0].ready==false)].metadata.name}' 2>/dev/null || echo "")
        
        if [ -n "$ERROR_PODS" ]; then
            echo -e "${CYAN}📦 $NS${NC}"
            for POD in $ERROR_PODS; do
                STATUS=$(kubectl get pod -n "$NS" "$POD" -o jsonpath='{.status.phase}' 2>/dev/null || echo "Unknown")
                READY=$(kubectl get pod -n "$NS" "$POD" -o jsonpath='{.status.containerStatuses[0].ready}' 2>/dev/null || echo "false")
                
                echo -e "${RED}  ❌ $POD (Status: $STATUS, Ready: $READY)${NC}"
                echo "  최근 에러 로그:"
                kubectl logs -n "$NS" "$POD" --tail=20 2>&1 | grep -i "error\|exception\|failed" | tail -5 || kubectl logs -n "$NS" "$POD" --tail=10 2>&1 | tail -5
                echo ""
            done
        fi
    done
fi
echo ""

# 3. 일반적인 문제 패턴 확인
echo -e "${YELLOW}🔎 3. 일반적인 문제 패턴 확인${NC}"
echo ""

# RDS 연결 문제 확인
echo "RDS 연결 문제 확인:"
RDS_ERRORS=$(kubectl logs -n account -l app=account-service --tail=100 2>&1 | grep -i "UnknownHostException\|CommunicationsException" | head -1 || echo "")
if [ -n "$RDS_ERRORS" ]; then
    echo -e "${RED}  ❌ RDS 연결 문제 발견${NC}"
    echo "  에러: $RDS_ERRORS"
    echo ""
    echo "  확인 사항:"
    echo "    1. RDS 클러스터가 생성되었는지 확인"
    echo "    2. Helm values의 database.host가 올바른지 확인"
    echo "    3. Terraform output에서 실제 RDS 엔드포인트 확인"
    echo "       cd terraform/envs/dev && terraform output | grep rds"
else
    echo -e "${GREEN}  ✅ RDS 연결 문제 없음${NC}"
fi
echo ""

# Redis 연결 문제 확인
echo "Redis 연결 문제 확인:"
REDIS_ERRORS=$(kubectl logs -n account -l app=account-service --tail=100 2>&1 | grep -i "redis\|valkey" | grep -i "error\|exception\|failed" | head -1 || echo "")
if [ -n "$REDIS_ERRORS" ]; then
    echo -e "${RED}  ❌ Redis 연결 문제 발견${NC}"
    echo "  에러: $REDIS_ERRORS"
else
    echo -e "${GREEN}  ✅ Redis 연결 문제 없음${NC}"
fi
echo ""

# 4. 환경 변수 확인
echo -e "${YELLOW}⚙️  4. 환경 변수 확인 (account-service 예시)${NC}"
echo ""

ACCOUNT_POD=$(kubectl get pods -n account -l app=account-service -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -n "$ACCOUNT_POD" ]; then
    echo "Pod: $ACCOUNT_POD"
    echo "환경 변수:"
    kubectl exec -n account "$ACCOUNT_POD" -- env 2>/dev/null | grep -E "DB_|REDIS_" | sort || echo "  환경 변수를 가져올 수 없습니다."
else
    echo -e "${YELLOW}  ⚠️  account-service Pod를 찾을 수 없습니다.${NC}"
fi
echo ""

# 5. ConfigMap 및 Secret 확인
echo -e "${YELLOW}🔐 5. ConfigMap 및 Secret 확인${NC}"
echo ""

for NS in account ticket trade cs chat; do
    if kubectl get namespace "$NS" > /dev/null 2>&1; then
        echo -e "${CYAN}📦 $NS${NC}"
        
        # ConfigMap
        CM_COUNT=$(kubectl get configmap -n "$NS" --no-headers 2>/dev/null | wc -l | tr -d ' ')
        echo "  ConfigMap: $CM_COUNT"
        kubectl get configmap -n "$NS" 2>/dev/null | grep -v "kube-root" || echo "    (없음)"
        
        # Secret
        SECRET_COUNT=$(kubectl get secret -n "$NS" --no-headers 2>/dev/null | wc -l | tr -d ' ')
        echo "  Secret: $SECRET_COUNT"
        kubectl get secret -n "$NS" 2>/dev/null | grep -E "service|secret" || echo "    (없음)"
        echo ""
    fi
done

# 6. 해결 방법 제시
echo -e "${YELLOW}💡 6. 해결 방법${NC}"
echo ""
echo "일반적인 문제 해결 방법:"
echo ""
echo "1. RDS 연결 문제:"
echo "   - Terraform output 확인:"
echo "     cd terraform/envs/dev"
echo "     terraform output | grep rds"
echo ""
echo "   - Helm values 업데이트:"
echo "     ./terraform/scripts/update-helm-values.sh dev"
echo ""
echo "2. Pod 재시작:"
echo "   kubectl delete pod -n <namespace> <pod-name>"
echo ""
echo "3. 전체 서비스 재배포:"
echo "   kubectl rollout restart deployment -n <namespace>"
echo ""
echo "4. ArgoCD 동기화:"
echo "   argocd app sync <service-name>-dev"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ 확인 완료!${NC}"

