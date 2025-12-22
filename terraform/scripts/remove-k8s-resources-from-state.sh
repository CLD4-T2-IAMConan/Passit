#!/bin/bash

# Kubernetes 리소스를 Terraform state에서 제거하는 스크립트
# EKS 클러스터가 이미 삭제되었거나 접근할 수 없을 때 사용
#
# 사용 방법:
# ./terraform/scripts/remove-k8s-resources-from-state.sh dev

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "Error: $TERRAFORM_DIR 디렉토리가 존재하지 않습니다."
    exit 1
fi

echo "=========================================="
echo "Kubernetes 리소스 State 제거"
echo "Environment: $ENVIRONMENT"
echo "=========================================="
echo ""

cd "$TERRAFORM_DIR"

# 제거할 Kubernetes 리소스 목록
RESOURCES=(
    # CICD 모듈
    "module.cicd.kubernetes_namespace_v1.argocd"
    "module.cicd.kubernetes_namespace_v1.services"
    "module.cicd.kubernetes_secret.ghcr"
    "module.cicd.kubernetes_service_account.backend_service"
    "module.cicd.kubernetes_cluster_role.backend_service"
    "module.cicd.kubernetes_cluster_role_binding.backend_service"
    "module.cicd.helm_release.argocd"
    
    # Monitoring 모듈
    "module.monitoring.kubernetes_namespace_v1.monitoring"
    "module.monitoring.kubernetes_namespace_v1.fluentbit"
    "module.monitoring.kubernetes_service_account_v1.fluentbit"
    "module.monitoring.kubernetes_service_account_v1.adot"
    "module.monitoring.helm_release.fluentbit"
    
    # Autoscaling 모듈
    "module.autoscaling.helm_release.cluster_autoscaler"
)

echo "다음 리소스들을 state에서 제거합니다:"
for resource in "${RESOURCES[@]}"; do
    echo "  - $resource"
done
echo ""

# 각 리소스에 대해 for_each가 있는 경우 처리
# service_namespaces에 따라 동적으로 생성된 리소스들
SERVICE_NAMESPACES=("account" "ticket" "trade" "chat" "cs")

for namespace in "${SERVICE_NAMESPACES[@]}"; do
    RESOURCES+=("module.cicd.kubernetes_namespace_v1.services[\"$namespace\"]")
    RESOURCES+=("module.cicd.kubernetes_secret.ghcr[0]")
    RESOURCES+=("module.cicd.kubernetes_secret.ghcr[1]")
    RESOURCES+=("module.cicd.kubernetes_secret.ghcr[2]")
    RESOURCES+=("module.cicd.kubernetes_secret.ghcr[3]")
    RESOURCES+=("module.cicd.kubernetes_secret.ghcr[4]")
    RESOURCES+=("module.cicd.kubernetes_service_account.backend_service[\"$namespace\"]")
    RESOURCES+=("module.cicd.kubernetes_cluster_role.backend_service[\"$namespace\"]")
    RESOURCES+=("module.cicd.kubernetes_cluster_role_binding.backend_service[\"$namespace\"]")
done

echo "실제 state에 존재하는 리소스만 제거합니다..."
echo ""

REMOVED_COUNT=0
FAILED_COUNT=0

for resource in "${RESOURCES[@]}"; do
    # state에 리소스가 존재하는지 확인
    if terraform state show "$resource" > /dev/null 2>&1; then
        echo "제거 중: $resource"
        if terraform state rm "$resource" 2>/dev/null; then
            echo "  ✅ 제거 완료"
            ((REMOVED_COUNT++))
        else
            echo "  ❌ 제거 실패"
            ((FAILED_COUNT++))
        fi
    else
        echo "건너뛰기 (state에 없음): $resource"
    fi
done

echo ""
echo "=========================================="
echo "완료"
echo "=========================================="
echo "제거된 리소스: $REMOVED_COUNT"
echo "실패한 리소스: $FAILED_COUNT"
echo ""
echo "이제 terraform destroy를 다시 실행할 수 있습니다."

