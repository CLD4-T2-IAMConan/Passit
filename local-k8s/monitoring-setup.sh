#!/bin/bash

# 로컬 K8s 모니터링 스택 설치 스크립트
# 사용법: ./monitoring-setup.sh [install|uninstall|status]

set -e

NAMESPACE="monitoring"
PROMETHEUS_OPERATOR_CHART="prometheus-community/kube-prometheus-stack"
PROMETHEUS_OPERATOR_VERSION="55.0.0"
LOKI_STACK_CHART="grafana/loki-stack"
LOKI_STACK_VERSION="2.9.11"  # 최신 버전 확인 필요 (deprecated 가능성)

function check_local_context() {
    # 로컬 Kubernetes 클러스터 컨텍스트 확인
    CURRENT_CONTEXT=$(kubectl config current-context 2>/dev/null)
    
    # 로컬 클러스터 목록 (kind, minikube, k3d 등)
    LOCAL_CONTEXTS=("kind-passit-local" "kind-monitoring-local" "minikube" "k3d-*" "docker-desktop")
    
    # 현재 컨텍스트가 로컬인지 확인
    IS_LOCAL=false
    for local_ctx in "${LOCAL_CONTEXTS[@]}"; do
        if [[ "$CURRENT_CONTEXT" == *"$local_ctx"* ]] || [[ "$CURRENT_CONTEXT" == "$local_ctx" ]]; then
            IS_LOCAL=true
            break
        fi
    done
    
    # EKS나 다른 원격 클러스터인 경우 경고
    if [[ "$IS_LOCAL" == false ]] && [[ "$CURRENT_CONTEXT" == *"eks"* ]] || [[ "$CURRENT_CONTEXT" == *"EKS"* ]]; then
        echo "⚠️  경고: 현재 kubectl 컨텍스트가 EKS 클러스터로 설정되어 있습니다: $CURRENT_CONTEXT"
        echo ""
        echo "로컬 Kubernetes 클러스터를 찾는 중..."
        
        # 로컬 클러스터 찾기
        AVAILABLE_CONTEXTS=$(kubectl config get-contexts -o name 2>/dev/null)
        LOCAL_CLUSTER=""
        
        for ctx in $AVAILABLE_CONTEXTS; do
            if [[ "$ctx" == "kind-passit-local" ]] || [[ "$ctx" == "kind-monitoring-local" ]]; then
                LOCAL_CLUSTER="$ctx"
                break
            fi
        done
        
        if [[ -n "$LOCAL_CLUSTER" ]]; then
            echo "✅ 로컬 클러스터를 찾았습니다: $LOCAL_CLUSTER"
            read -p "이 클러스터로 전환하시겠습니까? (Y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
                kubectl config use-context "$LOCAL_CLUSTER"
                echo "✅ 컨텍스트를 $LOCAL_CLUSTER로 변경했습니다."
            else
                echo "❌ 설치를 중단합니다."
                exit 1
            fi
        else
            echo "❌ 로컬 Kubernetes 클러스터를 찾을 수 없습니다."
            echo ""
            echo "로컬 클러스터를 생성하거나 컨텍스트를 수동으로 변경하세요:"
            echo "  # kind 클러스터 생성 예시"
            echo "  kind create cluster --name passit-local"
            echo ""
            echo "  # 컨텍스트 변경"
            echo "  kubectl config use-context <local-cluster-name>"
            exit 1
        fi
    fi
    
    # 최종 컨텍스트 확인
    FINAL_CONTEXT=$(kubectl config current-context 2>/dev/null)
    echo "📌 현재 kubectl 컨텍스트: $FINAL_CONTEXT"
    echo ""
}

function install() {
    echo "🚀 모니터링 스택 설치를 시작합니다..."
    
    # 로컬 컨텍스트 확인
    check_local_context
    
    # Namespace 생성
    echo "📦 Namespace 생성 중..."
    kubectl apply -f monitoring-namespace.yaml
    
    # Helm repo 추가
    echo "📚 Helm repository 추가 중..."
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo add grafana https://grafana.github.io/helm-charts
    helm repo update
    
    # Prometheus Operator 설치
    echo "📊 Prometheus Operator 설치 중..."
    helm upgrade --install kube-prometheus-stack \
        prometheus-community/kube-prometheus-stack \
        --version ${PROMETHEUS_OPERATOR_VERSION} \
        --namespace ${NAMESPACE} \
        --create-namespace \
        --values prometheus-operator-values.yaml \
        --wait
    
    # Loki Stack 설치
    echo "📝 Loki Stack 설치 중..."
    # 주의: loki-stack chart가 deprecated된 경우, loki와 promtail을 별도로 설치하세요
    # helm repo add loki https://grafana.github.io/loki/charts
    # helm upgrade --install loki loki/loki --namespace ${NAMESPACE} --values loki-values.yaml
    # helm upgrade --install promtail grafana/promtail --namespace ${NAMESPACE} --values promtail-values.yaml
    helm upgrade --install loki-stack \
        grafana/loki-stack \
        --version ${LOKI_STACK_VERSION} \
        --namespace ${NAMESPACE} \
        --values loki-stack-values.yaml \
        --wait || echo "⚠️  loki-stack 설치 실패. loki와 promtail을 별도로 설치하세요."
    
    # Prometheus Alert Rules 적용
    echo "🔔 Prometheus Alert Rules 적용 중..."
    kubectl apply -f prometheus-alert-rules.yaml
    
    echo "✅ 모니터링 스택 설치가 완료되었습니다!"
    echo ""
    echo "📋 접속 정보:"
    echo "  - Grafana: http://localhost:30901 (admin/admin123!)"
    echo "  - Prometheus: http://localhost:30900"
    echo "  - Alertmanager: http://localhost:30903"
    echo "  - Loki: http://localhost:30902"
    echo ""
    echo "📊 Pod 상태 확인:"
    kubectl get pods -n ${NAMESPACE}
}

function uninstall() {
    echo "🗑️  모니터링 스택 제거를 시작합니다..."
    
    # Helm charts 제거
    helm uninstall kube-prometheus-stack -n ${NAMESPACE} || true
    helm uninstall loki-stack -n ${NAMESPACE} || true
    
    # CRDs 제거 (선택사항)
    read -p "CRDs도 제거하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kubectl delete crd prometheuses.monitoring.coreos.com || true
        kubectl delete crd prometheusrules.monitoring.coreos.com || true
        kubectl delete crd servicemonitors.monitoring.coreos.com || true
        kubectl delete crd podmonitors.monitoring.coreos.com || true
        kubectl delete crd alertmanagers.monitoring.coreos.com || true
    fi
    
    # Namespace 제거
    kubectl delete namespace ${NAMESPACE} || true
    
    echo "✅ 모니터링 스택 제거가 완료되었습니다!"
}

function status() {
    echo "📊 모니터링 스택 상태 확인 중..."
    echo ""
    echo "=== Namespace ==="
    kubectl get namespace ${NAMESPACE} || echo "Namespace가 존재하지 않습니다."
    echo ""
    echo "=== Pods ==="
    kubectl get pods -n ${NAMESPACE}
    echo ""
    echo "=== Services ==="
    kubectl get svc -n ${NAMESPACE}
    echo ""
    echo "=== PrometheusRules ==="
    kubectl get prometheusrules -n ${NAMESPACE}
    echo ""
    echo "=== ServiceMonitors ==="
    kubectl get servicemonitors -n ${NAMESPACE}
}

function port_forward() {
    echo "🔌 Port forwarding 시작..."
    echo "Ctrl+C를 눌러 종료하세요."
    echo ""
    
    kubectl port-forward -n ${NAMESPACE} svc/kube-prometheus-stack-grafana 30901:80 &
    GRAFANA_PID=$!
    
    kubectl port-forward -n ${NAMESPACE} svc/kube-prometheus-stack-prometheus 30900:9090 &
    PROMETHEUS_PID=$!
    
    kubectl port-forward -n ${NAMESPACE} svc/kube-prometheus-stack-alertmanager 30903:9093 &
    ALERTMANAGER_PID=$!
    
    kubectl port-forward -n ${NAMESPACE} svc/loki 30902:3100 &
    LOKI_PID=$!
    
    echo "Port forwarding이 시작되었습니다:"
    echo "  - Grafana: http://localhost:30901"
    echo "  - Prometheus: http://localhost:30900"
    echo "  - Alertmanager: http://localhost:30903"
    echo "  - Loki: http://localhost:30902"
    echo ""
    echo "종료하려면 Ctrl+C를 누르세요."
    
    trap "kill $GRAFANA_PID $PROMETHEUS_PID $ALERTMANAGER_PID $LOKI_PID" EXIT
    wait
}

# 메인 로직
case "${1:-}" in
    install)
        install
        ;;
    uninstall)
        uninstall
        ;;
    status)
        status
        ;;
    port-forward)
        port_forward
        ;;
    *)
        echo "사용법: $0 [install|uninstall|status|port-forward]"
        echo ""
        echo "명령어:"
        echo "  install       - 모니터링 스택 설치"
        echo "  uninstall     - 모니터링 스택 제거"
        echo "  status        - 모니터링 스택 상태 확인"
        echo "  port-forward  - Port forwarding 시작 (NodePort 미사용 시)"
        exit 1
        ;;
esac

