#!/bin/bash

# 강제로 Terraform destroy를 실행하는 스크립트
# EKS 클러스터가 이미 삭제된 경우 사용
#
# 사용 방법:
# ./terraform/scripts/force-destroy.sh dev

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "Error: $TERRAFORM_DIR 디렉토리가 존재하지 않습니다."
    exit 1
fi

echo "=========================================="
echo "강제 Terraform Destroy"
echo "Environment: $ENVIRONMENT"
echo "=========================================="
echo ""

cd "$TERRAFORM_DIR"

# 1. Kubernetes/Helm 리소스를 state에서 제거
echo "1. Kubernetes/Helm 리소스를 state에서 제거 중..."
for resource in $(terraform state list 2>/dev/null | grep -E "(kubernetes_|helm_release)" || true); do
    echo "  제거: $resource"
    terraform state rm "$resource" 2>/dev/null || true
done

# 2. Security 모듈의 data source를 state에서 제거
echo ""
echo "2. Security 모듈의 data source를 state에서 제거 중..."
for resource in $(terraform state list 2>/dev/null | grep "module.security.data" || true); do
    echo "  제거: $resource"
    terraform state rm "$resource" 2>/dev/null || true
done

# 3. Security 모듈을 제외하고 destroy 실행
echo ""
echo "3. Security 모듈을 제외하고 destroy 실행 중..."
terraform destroy \
  -target=module.network \
  -target=module.eks \
  -target=module.data \
  -target=module.autoscaling.aws_iam_role.cluster_autoscaler \
  -target=module.autoscaling.aws_iam_policy.cluster_autoscaler \
  -target=module.autoscaling.aws_iam_role_policy_attachment.cluster_autoscaler \
  -target=module.monitoring.aws_prometheus_workspace.this \
  -target=module.monitoring.aws_iam_role.amp_ingest \
  -target=module.monitoring.aws_iam_policy.amp_ingest \
  -target=module.monitoring.aws_iam_role_policy_attachment.amp_ingest \
  -target=module.monitoring.aws_cloudwatch_log_group \
  -target=module.monitoring.aws_cloudwatch_metric_alarm \
  -target=module.cicd.aws_iam_role \
  -target=module.cicd.aws_iam_policy \
  -target=module.cicd.aws_iam_role_policy_attachment \
  -target=module.cicd.aws_s3_bucket \
  -target=module.cicd.aws_cloudfront_distribution \
  -auto-approve

echo ""
echo "=========================================="
echo "완료"
echo "=========================================="
echo "Security 모듈의 리소스는 별도로 삭제해야 합니다:"
echo "  - Security Groups"
echo "  - KMS Keys"
echo "  - Secrets Manager"
echo ""

