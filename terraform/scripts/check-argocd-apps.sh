#!/bin/bash

# ArgoCD Application 상태 확인 스크립트
# 사용법: ./check-argocd-apps.sh

set -e

# 색상 출력
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔍 ArgoCD Application 상태 확인${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

NAMESPACE="argocd"
SERVICES_NAMESPACE="services"

# 1. ArgoCD Application 목록
echo -e "${YELLOW}📋 1. ArgoCD Application 목록${NC}"
echo ""
kubectl get applications -n "$NAMESPACE" -o wide
echo ""

# 2. 각 Application 상세 상태
echo -e "${YELLOW}📊 2. Application 상세 상태${NC}"
echo ""

SERVICES=("account-service-dev" "ticket-service-dev" "trade-service-dev" "cs-service-dev" "chat-service-dev")

for SERVICE in "${SERVICES[@]}"; do
    if kubectl get application "$SERVICE" -n "$NAMESPACE" > /dev/null 2>&1; then
        SYNC_STATUS=$(kubectl get application "$SERVICE" -n "$NAMESPACE" -o jsonpath='{.status.sync.status}' 2>/dev/null || echo "Unknown")
        HEALTH_STATUS=$(kubectl get application "$SERVICE" -n "$NAMESPACE" -o jsonpath='{.status.health.status}' 2>/dev/null || echo "Unknown")
        
        echo -e "${CYAN}📦 $SERVICE${NC}"
        echo -n "  Sync: "
        case $SYNC_STATUS in
            Synced)
                echo -e "${GREEN}✅ Synced${NC}"
                ;;
            OutOfSync)
                echo -e "${YELLOW}⚠️  OutOfSync${NC}"
                ;;
            Unknown)
                echo -e "${RED}❌ Unknown${NC}"
                ;;
            *)
                echo -e "${YELLOW}⚠️  $SYNC_STATUS${NC}"
                ;;
        esac
        
        echo -n "  Health: "
        case $HEALTH_STATUS in
            Healthy)
                echo -e "${GREEN}✅ Healthy${NC}"
                ;;
            Degraded)
                echo -e "${RED}❌ Degraded${NC}"
                ;;
            Progressing)
                echo -e "${YELLOW}🔄 Progressing${NC}"
                ;;
            *)
                echo -e "${YELLOW}⚠️  $HEALTH_STATUS${NC}"
                ;;
        esac
        
        # 리소스 상태
        RESOURCE_COUNT=$(kubectl get application "$SERVICE" -n "$NAMESPACE" -o jsonpath='{.status.resources}' 2>/dev/null | grep -o 'kind' | wc -l | tr -d ' ' || echo "0")
        if [ "$RESOURCE_COUNT" -gt 0 ]; then
            echo "  Resources: $RESOURCE_COUNT"
        fi
        
        # 최근 오류 확인
        if [ "$SYNC_STATUS" = "Unknown" ] || [ "$HEALTH_STATUS" = "Degraded" ]; then
            ERROR_MSG=$(kubectl get application "$SERVICE" -n "$NAMESPACE" -o jsonpath='{.status.conditions[?(@.type=="ComparisonError")].message}' 2>/dev/null | head -c 100 || echo "")
            if [ -n "$ERROR_MSG" ]; then
                echo -e "  ${RED}오류: ${ERROR_MSG}...${NC}"
            fi
        fi
        echo ""
    fi
done

# 3. 실제 배포된 리소스 확인
echo -e "${YELLOW}🚀 3. 실제 배포된 리소스 확인${NC}"
echo ""

# Pod 확인
echo "Pod 상태:"
POD_COUNT=$(kubectl get pods -n "$SERVICES_NAMESPACE" --no-headers 2>/dev/null | wc -l | tr -d ' ')
if [ "$POD_COUNT" -gt 0 ]; then
    kubectl get pods -n "$SERVICES_NAMESPACE" -o wide
else
    echo -e "${YELLOW}  ⚠️  Pod가 없습니다.${NC}"
fi
echo ""

# Service 확인
echo "Service:"
SVC_COUNT=$(kubectl get svc -n "$SERVICES_NAMESPACE" --no-headers 2>/dev/null | wc -l | tr -d ' ')
if [ "$SVC_COUNT" -gt 0 ]; then
    kubectl get svc -n "$SERVICES_NAMESPACE"
else
    echo -e "${YELLOW}  ⚠️  Service가 없습니다.${NC}"
fi
echo ""

# Ingress 확인
echo "Ingress:"
INGRESS_COUNT=$(kubectl get ingress -n "$SERVICES_NAMESPACE" --no-headers 2>/dev/null | wc -l | tr -d ' ')
if [ "$INGRESS_COUNT" -gt 0 ]; then
    kubectl get ingress -n "$SERVICES_NAMESPACE"
    echo ""
    echo "ALB 주소:"
    for INGRESS in $(kubectl get ingress -n "$SERVICES_NAMESPACE" -o jsonpath='{.items[*].metadata.name}'); do
        ALB_HOSTNAME=$(kubectl get ingress "$INGRESS" -n "$SERVICES_NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
        if [ -n "$ALB_HOSTNAME" ]; then
            echo -e "  ${GREEN}$INGRESS: $ALB_HOSTNAME${NC}"
        else
            echo -e "  ${YELLOW}$INGRESS: ALB 주소 할당 중...${NC}"
        fi
    done
else
    echo -e "${YELLOW}  ⚠️  Ingress가 없습니다.${NC}"
fi
echo ""

# 4. 빠른 상태 요약
echo -e "${YELLOW}📈 4. 빠른 상태 요약${NC}"
echo ""

SYNCED_COUNT=0
HEALTHY_COUNT=0
TOTAL_COUNT=0

for SERVICE in "${SERVICES[@]}"; do
    if kubectl get application "$SERVICE" -n "$NAMESPACE" > /dev/null 2>&1; then
        ((TOTAL_COUNT++))
        SYNC_STATUS=$(kubectl get application "$SERVICE" -n "$NAMESPACE" -o jsonpath='{.status.sync.status}' 2>/dev/null || echo "Unknown")
        HEALTH_STATUS=$(kubectl get application "$SERVICE" -n "$NAMESPACE" -o jsonpath='{.status.health.status}' 2>/dev/null || echo "Unknown")
        
        if [ "$SYNC_STATUS" = "Synced" ]; then
            ((SYNCED_COUNT++))
        fi
        if [ "$HEALTH_STATUS" = "Healthy" ]; then
            ((HEALTHY_COUNT++))
        fi
    fi
done

echo "  전체 Application: $TOTAL_COUNT"
echo -n "  Synced: "
if [ "$SYNCED_COUNT" -eq "$TOTAL_COUNT" ]; then
    echo -e "${GREEN}$SYNCED_COUNT/$TOTAL_COUNT ✅${NC}"
else
    echo -e "${YELLOW}$SYNCED_COUNT/$TOTAL_COUNT ⚠️${NC}"
fi

echo -n "  Healthy: "
if [ "$HEALTHY_COUNT" -eq "$TOTAL_COUNT" ]; then
    echo -e "${GREEN}$HEALTHY_COUNT/$TOTAL_COUNT ✅${NC}"
else
    echo -e "${YELLOW}$HEALTHY_COUNT/$TOTAL_COUNT ⚠️${NC}"
fi

echo ""

# 5. 유용한 명령어 안내
echo -e "${YELLOW}💡 5. 유용한 명령어${NC}"
echo ""
echo "  Application 상세 정보:"
echo "    kubectl get application <app-name> -n argocd -o yaml"
echo ""
echo "  Application 리소스 확인:"
echo "    kubectl get application <app-name> -n argocd -o jsonpath='{.status.resources}'"
echo ""
echo "  Pod 로그 확인:"
echo "    kubectl logs -n services -l app.kubernetes.io/instance=<app-name>"
echo ""
echo "  ArgoCD UI 접근:"
echo "    kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo "    # 브라우저: https://localhost:8080"
echo ""
echo "  전체 배포 검증:"
echo "    ./verify-deployment.sh"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ 확인 완료!${NC}"

