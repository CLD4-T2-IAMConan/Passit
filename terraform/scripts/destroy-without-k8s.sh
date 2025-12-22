#!/bin/bash

# Kubernetes 리소스를 제외하고 Terraform destroy를 실행하는 스크립트
#
# 사용 방법:
# ./terraform/scripts/destroy-without-k8s.sh dev

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "Error: $TERRAFORM_DIR 디렉토리가 존재하지 않습니다."
    exit 1
fi

echo "=========================================="
echo "Terraform Destroy (Kubernetes 리소스 제외)"
echo "Environment: $ENVIRONMENT"
echo "=========================================="
echo ""

cd "$TERRAFORM_DIR"

# Kubernetes 리소스를 제외한 모든 리소스 삭제
echo "Kubernetes 리소스를 제외하고 삭제를 시작합니다..."
echo ""

terraform destroy \
  -target=module.network \
  -target=module.security \
  -target=module.eks \
  -target=module.data \
  -target=module.autoscaling.aws_iam_role.cluster_autoscaler \
  -target=module.autoscaling.aws_iam_policy.cluster_autoscaler \
  -target=module.autoscaling.aws_iam_role_policy_attachment.cluster_autoscaler \
  -target=module.monitoring \
  -target=module.cicd.aws_iam_role \
  -target=module.cicd.aws_iam_policy \
  -target=module.cicd.aws_iam_role_policy_attachment \
  -target=module.cicd.aws_s3_bucket \
  -target=module.cicd.aws_s3_bucket_public_access_block \
  -target=module.cicd.aws_s3_bucket_versioning \
  -target=module.cicd.aws_s3_bucket_server_side_encryption_configuration \
  -target=module.cicd.aws_cloudfront_distribution \
  -target=module.cicd.aws_cloudfront_origin_access_control \
  -target=module.cicd.aws_s3_bucket_policy \
  -auto-approve

echo ""
echo "=========================================="
echo "완료"
echo "=========================================="
echo "Kubernetes 리소스는 EKS 클러스터가 삭제되면 자동으로 삭제됩니다."
echo ""

