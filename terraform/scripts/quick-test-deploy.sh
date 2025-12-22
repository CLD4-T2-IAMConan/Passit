#!/bin/bash

# 빠른 테스트 배포 스크립트
# 간단한 nginx pod를 배포하여 클러스터가 정상 작동하는지 확인
#
# 사용 방법:
# ./terraform/scripts/quick-test-deploy.sh dev

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "Error: $TERRAFORM_DIR 디렉토리가 존재하지 않습니다."
    exit 1
fi

cd "$TERRAFORM_DIR"

echo "=========================================="
echo "빠른 테스트 배포"
echo "Environment: $ENVIRONMENT"
echo "=========================================="
echo ""

# 1. EKS 클러스터 연결
echo "1. EKS 클러스터 연결 중..."
CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null || echo "passit-${ENVIRONMENT}-eks")
REGION=${AWS_REGION:-ap-northeast-2}

aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$REGION" > /dev/null 2>&1

if ! kubectl cluster-info > /dev/null 2>&1; then
    echo "Error: 클러스터에 접속할 수 없습니다."
    exit 1
fi

echo "  ✅ 클러스터 연결 완료: $CLUSTER_NAME"
echo ""

# 2. 테스트 Namespace 생성
echo "2. 테스트 Namespace 생성 중..."
kubectl create namespace test --dry-run=client -o yaml | kubectl apply -f - > /dev/null 2>&1
echo "  ✅ Namespace 'test' 준비 완료"
echo ""

# 3. 간단한 테스트 Pod 배포
echo "3. 테스트 Pod 배포 중..."
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-nginx
  namespace: test
spec:
  replicas: 1
  selector:
    matchLabels:
      app: test-nginx
  template:
    metadata:
      labels:
        app: test-nginx
    spec:
      containers:
      - name: nginx
        image: nginx:alpine
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
---
apiVersion: v1
kind: Service
metadata:
  name: test-nginx
  namespace: test
spec:
  selector:
    app: test-nginx
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
EOF

echo "  ✅ 테스트 Pod 배포 완료"
echo ""

# 4. 배포 상태 확인
echo "4. 배포 상태 확인 중..."
echo ""

for i in {1..30}; do
    if kubectl get pod -n test -l app=test-nginx -o jsonpath='{.items[0].status.phase}' 2>/dev/null | grep -q "Running"; then
        echo "  ✅ Pod가 실행 중입니다!"
        break
    fi
    echo "  대기 중... ($i/30)"
    sleep 2
done

echo ""
echo "=========================================="
echo "배포 완료"
echo "=========================================="
echo ""
echo "Pod 상태:"
kubectl get pods -n test

echo ""
echo "Service 상태:"
kubectl get svc -n test

echo ""
echo "테스트 방법:"
echo "  1. Pod 로그 확인:"
echo "     kubectl logs -n test -l app=test-nginx"
echo ""
echo "  2. Pod에 접속:"
echo "     kubectl exec -n test -it \$(kubectl get pod -n test -l app=test-nginx -o jsonpath='{.items[0].metadata.name}') -- /bin/sh"
echo ""
echo "  3. 포트 포워딩:"
echo "     kubectl port-forward -n test svc/test-nginx 8080:80"
echo "     curl http://localhost:8080"
echo ""
echo "  4. 정리:"
echo "     kubectl delete namespace test"
echo ""

