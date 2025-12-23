#!/bin/bash

# 기존 AWS 리소스를 Terraform state에 import하는 스크립트
# 주의: 이 스크립트는 기존 리소스들을 state에 가져옵니다

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "❌ Error: $TERRAFORM_DIR 디렉토리가 존재하지 않습니다."
    exit 1
fi

cd "$TERRAFORM_DIR"

echo "=========================================="
echo "기존 리소스 Import"
echo "Environment: ${ENVIRONMENT}"
echo "=========================================="
echo ""

# Import 함수 (에러 무시)
import_resource() {
    local RESOURCE=$1
    local ID=$2
    local DESCRIPTION=$3
    
    echo "📦 Importing: $DESCRIPTION"
    echo "   Resource: $RESOURCE"
    echo "   ID: $ID"
    
    # 실제 에러 메시지 확인
    IMPORT_OUTPUT=$(terraform import "$RESOURCE" "$ID" 2>&1)
    IMPORT_EXIT_CODE=$?
    
    if [ $IMPORT_EXIT_CODE -eq 0 ]; then
        echo "   ✅ 성공"
    else
        # 에러 메시지에서 원인 파악
        if echo "$IMPORT_OUTPUT" | grep -q "already managed"; then
            echo "   ℹ️  이미 state에 있음"
        elif echo "$IMPORT_OUTPUT" | grep -q "Cannot import"; then
            echo "   ⚠️  Import 불가능 (리소스 경로 확인 필요)"
            echo "      에러: $(echo "$IMPORT_OUTPUT" | grep -i "error" | head -1)"
        else
            echo "   ⚠️  실패"
            echo "      에러: $(echo "$IMPORT_OUTPUT" | grep -i "error" | head -1 || echo "$IMPORT_OUTPUT" | tail -1)"
        fi
    fi
    echo ""
}

# EKS Cluster
import_resource \
    "module.eks.module.eks.aws_eks_cluster.this[0]" \
    "passit-dev-eks" \
    "EKS Cluster"

# IAM Roles
import_resource \
    "module.security.aws_iam_role.eks_cluster" \
    "passit-eks-cluster-dev" \
    "EKS Cluster IAM Role"

import_resource \
    "module.security.aws_iam_role.eks_node_group" \
    "passit-eks-node-group-dev" \
    "EKS Node Group IAM Role"

import_resource \
    "module.security.aws_iam_role.github_actions" \
    "passit-github-actions-dev" \
    "GitHub Actions IAM Role"

import_resource \
    "module.security.aws_iam_role.argocd" \
    "passit-argocd-dev" \
    "ArgoCD IAM Role"

import_resource \
    "module.security.aws_iam_role.prometheus" \
    "passit-prometheus-dev" \
    "Prometheus IAM Role"

import_resource \
    "module.security.aws_iam_role.fluentbit" \
    "passit-fluentbit-dev" \
    "Fluent Bit IAM Role"

import_resource \
    "module.security.aws_iam_role.app_pod" \
    "passit-app-pod-dev" \
    "App Pod IAM Role"

# IAM Policies
import_resource \
    "module.security.aws_iam_policy.github_actions" \
    "arn:aws:iam::727646470302:policy/passit-github-actions-dev" \
    "GitHub Actions IAM Policy"

import_resource \
    "module.security.aws_iam_policy.argocd" \
    "arn:aws:iam::727646470302:policy/passit-argocd-dev" \
    "ArgoCD IAM Policy"

import_resource \
    "module.security.aws_iam_policy.prometheus" \
    "arn:aws:iam::727646470302:policy/passit-prometheus-dev" \
    "Prometheus IAM Policy"

import_resource \
    "module.security.aws_iam_policy.fluentbit" \
    "arn:aws:iam::727646470302:policy/passit-fluentbit-dev" \
    "Fluent Bit IAM Policy"

import_resource \
    "module.security.aws_iam_policy.app_pod" \
    "arn:aws:iam::727646470302:policy/passit-app-pod-dev" \
    "App Pod IAM Policy"

# ElastiCache
import_resource \
    "module.data.aws_elasticache_replication_group.valkey" \
    "passit-dev-valkey" \
    "ElastiCache Replication Group (Valkey)"

import_resource \
    "module.data.aws_elasticache_subnet_group.valkey[0]" \
    "passit-dev-valkey-subnet-group" \
    "ElastiCache Subnet Group"

import_resource \
    "module.data.aws_elasticache_parameter_group.valkey[0]" \
    "passit-dev-valkey-pg" \
    "ElastiCache Parameter Group"

# S3 Buckets
import_resource \
    "module.data.aws_s3_bucket.this[\"uploads\"]" \
    "passit-dev-uploads" \
    "S3 Uploads Bucket"

import_resource \
    "module.data.aws_s3_bucket.this[\"logs\"]" \
    "passit-dev-logs" \
    "S3 Logs Bucket"

import_resource \
    "module.data.aws_s3_bucket.this[\"backup\"]" \
    "passit-dev-backup" \
    "S3 Backup Bucket"

# Secrets Manager
import_resource \
    "module.security.aws_secretsmanager_secret.db" \
    "passit/dev/db" \
    "Secrets Manager DB Secret"

import_resource \
    "module.security.aws_secretsmanager_secret.smtp" \
    "passit/dev/smtp" \
    "Secrets Manager SMTP Secret"

import_resource \
    "module.security.aws_secretsmanager_secret.kakao" \
    "passit/dev/kakao" \
    "Secrets Manager Kakao Secret"

import_resource \
    "module.security.aws_secretsmanager_secret.admin" \
    "passit/dev/admin" \
    "Secrets Manager Admin Secret"

import_resource \
    "module.security.aws_secretsmanager_secret.app_secrets" \
    "passit/dev/app/secrets" \
    "Secrets Manager App Secrets"

import_resource \
    "module.security.aws_secretsmanager_secret.elasticache_credentials" \
    "passit/elasticache/credentials/dev" \
    "Secrets Manager ElastiCache Credentials"

import_resource \
    "module.data.aws_secretsmanager_secret.valkey" \
    "passit/dev/valkey/connection" \
    "Secrets Manager Valkey Connection"

# KMS Keys (Alias로 찾아서 import)
echo "📦 Importing: KMS Keys (Alias 사용)"
echo "   ⚠️  KMS Key는 Alias로 찾아서 Key ID를 확인해야 합니다"
echo ""

# KMS Key ID 찾기 함수
get_kms_key_id() {
    local ALIAS=$1
    aws kms describe-key --key-id "alias/$ALIAS" --query 'KeyMetadata.KeyId' --output text 2>/dev/null || echo ""
}

# KMS Keys import
for alias in secrets rds elasticache ebs s3; do
    KEY_ID=$(get_kms_key_id "passit-$alias-dev")
    if [ -n "$KEY_ID" ]; then
        import_resource \
            "module.security.aws_kms_key.$alias" \
            "$KEY_ID" \
            "KMS Key ($alias)"
        
        import_resource \
            "module.security.aws_kms_alias.$alias" \
            "alias/passit-$alias-dev" \
            "KMS Alias ($alias)"
    fi
done

# RDS는 복잡하므로 별도 처리 필요
echo "📦 RDS Cluster Import"
echo "   ⚠️  RDS는 cluster와 instance를 모두 import해야 합니다"
echo "   수동으로 import하세요:"
echo "   terraform import module.data.aws_rds_cluster.main <cluster-identifier>"
echo "   terraform import module.data.aws_rds_instance.main[0] <instance-identifier>"
echo ""

echo "=========================================="
echo "✅ Import 완료!"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "1. terraform state list로 확인"
echo "2. terraform plan으로 차이 확인"
echo "3. 필요한 경우 추가 import"
echo ""

