#!/bin/bash

# AWS 리소스 전체 삭제 스크립트
# 주의: 이 스크립트는 모든 리소스를 삭제합니다. 복구 불가능합니다!

# set -e 제거 (에러가 나도 계속 진행)
# set -e

ENVIRONMENT=${1:-dev}
PROJECT_NAME="passit"
REGION="ap-northeast-2"

echo "=========================================="
echo "⚠️  경고: 모든 AWS 리소스를 삭제합니다!"
echo "Environment: ${ENVIRONMENT}"
echo "=========================================="
echo ""
echo "삭제될 리소스:"
echo "  - EKS Cluster: ${PROJECT_NAME}-${ENVIRONMENT}-eks"
echo "  - RDS Cluster: ${PROJECT_NAME}-${ENVIRONMENT}-aurora-cluster"
echo "  - ElastiCache: ${PROJECT_NAME}-${ENVIRONMENT}-valkey"
echo "  - S3 Buckets: ${PROJECT_NAME}-${ENVIRONMENT}-*"
echo "  - IAM Roles: ${PROJECT_NAME}-*-${ENVIRONMENT}-*"
echo "  - Secrets Manager: passit/${ENVIRONMENT}/*"
echo "  - KMS Keys: alias/${PROJECT_NAME}-*-${ENVIRONMENT}"
echo ""
read -p "정말로 모든 리소스를 삭제하시겠습니까? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "취소되었습니다."
    exit 0
fi

# IAM Role 삭제 함수
delete_iam_role() {
    local ROLE_NAME=$1
    
    if [ -z "$ROLE_NAME" ]; then
        return
    fi
    
    echo "  🔍 Role 삭제 시도: $ROLE_NAME"
    
    # Attached policies 제거
    aws iam list-attached-role-policies --role-name "$ROLE_NAME" --query 'AttachedPolicies[*].PolicyArn' --output text 2>/dev/null | \
    while read policy_arn; do
        if [ -n "$policy_arn" ]; then
            aws iam detach-role-policy --role-name "$ROLE_NAME" --policy-arn "$policy_arn" 2>/dev/null && \
            echo "    ✅ Policy detached: $policy_arn" || true
        fi
    done
    
    # Inline policies 제거
    aws iam list-role-policies --role-name "$ROLE_NAME" --query 'PolicyNames' --output text 2>/dev/null | \
    while read policy_name; do
        if [ -n "$policy_name" ]; then
            aws iam delete-role-policy --role-name "$ROLE_NAME" --policy-name "$policy_name" 2>/dev/null && \
            echo "    ✅ Inline policy deleted: $policy_name" || true
        fi
    done
    
    # Instance profiles 제거
    aws iam list-instance-profiles-for-role --role-name "$ROLE_NAME" --query 'InstanceProfiles[*].InstanceProfileName' --output text 2>/dev/null | \
    while read profile_name; do
        if [ -n "$profile_name" ]; then
            aws iam remove-role-from-instance-profile --instance-profile-name "$profile_name" --role-name "$ROLE_NAME" 2>/dev/null && \
            echo "    ✅ Removed from instance profile: $profile_name" || true
        fi
    done
    
    # Role 삭제
    if aws iam delete-role --role-name "$ROLE_NAME" --region "$REGION" 2>/dev/null; then
        echo "  ✅ IAM Role 삭제: $ROLE_NAME"
    else
        ERROR_MSG=$(aws iam delete-role --role-name "$ROLE_NAME" --region "$REGION" 2>&1)
        if echo "$ERROR_MSG" | grep -q "NoSuchEntity"; then
            echo "  ℹ️  IAM Role 없음: $ROLE_NAME"
        elif echo "$ERROR_MSG" | grep -q "DeleteConflict"; then
            echo "  ⚠️  IAM Role 삭제 실패 (아직 사용 중): $ROLE_NAME"
            echo "      EKS Cluster를 먼저 삭제하세요"
        else
            echo "  ⚠️  IAM Role 삭제 실패: $ROLE_NAME"
            echo "      에러: $(echo "$ERROR_MSG" | grep -i "error" | head -1)"
        fi
    fi
}

echo ""
echo "🗑️  리소스 삭제 시작..."
echo ""

# EKS Node Groups 삭제 (Cluster 삭제 전에 필수)
echo "📦 EKS Node Groups 삭제 중..."
NODEGROUP_NAMES=$(aws eks list-nodegroups --cluster-name "${PROJECT_NAME}-${ENVIRONMENT}-eks" --region "$REGION" --query 'nodegroups[*]' --output text 2>/dev/null || echo "")

if [ -n "$NODEGROUP_NAMES" ]; then
    for nodegroup in $NODEGROUP_NAMES; do
        echo "  삭제 중: $nodegroup"
        if aws eks delete-nodegroup --cluster-name "${PROJECT_NAME}-${ENVIRONMENT}-eks" --nodegroup-name "$nodegroup" --region "$REGION" 2>/dev/null; then
            echo "    ✅ Node Group 삭제 시작: $nodegroup"
        else
            echo "    ⚠️  Node Group 삭제 실패 또는 이미 삭제됨: $nodegroup"
        fi
    done
    
    # Node Groups 삭제 완료 대기
    echo ""
    echo "  ⏳ Node Groups 삭제 완료 대기 중... (5-10분 소요)"
    for nodegroup in $NODEGROUP_NAMES; do
        echo "    대기 중: $nodegroup"
        TIMEOUT=600  # 10분
        ELAPSED=0
        while [ $ELAPSED -lt $TIMEOUT ]; do
            STATUS=$(aws eks describe-nodegroup --cluster-name "${PROJECT_NAME}-${ENVIRONMENT}-eks" --nodegroup-name "$nodegroup" --region "$REGION" --query 'nodegroup.status' --output text 2>/dev/null || echo "DELETED")
            if [ "$STATUS" = "DELETED" ] || [ "$STATUS" = "" ]; then
                echo "    ✅ Node Group 삭제 완료: $nodegroup"
                break
            fi
            echo "      상태: $STATUS (${ELAPSED}초 경과)"
            sleep 10
            ELAPSED=$((ELAPSED + 10))
        done
        
        if [ $ELAPSED -ge $TIMEOUT ]; then
            echo "    ⚠️  타임아웃: $nodegroup (수동으로 확인하세요)"
        fi
    done
    echo ""
else
    echo "  ℹ️  Node Groups 없음"
fi

# EKS Cluster 삭제 (Node Groups 삭제 후)
echo "📦 EKS Cluster 삭제 중..."
aws eks delete-cluster --name "${PROJECT_NAME}-${ENVIRONMENT}-eks" --region "$REGION" 2>/dev/null && echo "  ✅ EKS Cluster 삭제 시작" || {
    ERROR_MSG=$(aws eks delete-cluster --name "${PROJECT_NAME}-${ENVIRONMENT}-eks" --region "$REGION" 2>&1)
    if echo "$ERROR_MSG" | grep -q "ResourceInUseException.*nodegroups"; then
        echo "  ⚠️  EKS Cluster에 Node Groups가 아직 있습니다"
        echo "      Node Groups 삭제를 먼저 완료하세요"
        echo "      또는 수동으로: aws eks list-nodegroups --cluster-name ${PROJECT_NAME}-${ENVIRONMENT}-eks"
    elif echo "$ERROR_MSG" | grep -q "ResourceNotFoundException"; then
        echo "  ℹ️  EKS Cluster 없음 또는 이미 삭제됨"
    else
        echo "  ⚠️  EKS Cluster 삭제 실패"
        echo "      에러: $(echo "$ERROR_MSG" | grep -i "error" | head -1)"
    fi
}

# ElastiCache Replication Group 삭제
echo "📦 ElastiCache 삭제 중..."
aws elasticache delete-replication-group --replication-group-id "${PROJECT_NAME}-${ENVIRONMENT}-valkey" --region "$REGION" 2>/dev/null && echo "  ✅ ElastiCache 삭제 시작" || echo "  ⚠️  ElastiCache 없음 또는 이미 삭제됨"

# RDS Cluster 삭제 (스냅샷 없이)
echo "📦 RDS Cluster 삭제 중..."
aws rds delete-db-cluster \
  --db-cluster-identifier "${PROJECT_NAME}-${ENVIRONMENT}-aurora-cluster" \
  --skip-final-snapshot \
  --region "$REGION" 2>/dev/null && echo "  ✅ RDS Cluster 삭제 시작" || echo "  ⚠️  RDS Cluster 없음 또는 이미 삭제됨"

# S3 Buckets 삭제
echo "📦 S3 Buckets 삭제 중..."
for bucket in uploads logs backup profile-images ticket-images frontend; do
    BUCKET_NAME="${PROJECT_NAME}-${ENVIRONMENT}-${bucket}-bucket"
    if [ "$bucket" = "profile-images" ]; then
        BUCKET_NAME="${PROJECT_NAME}-${ENVIRONMENT}-profile-images-bucket"
    elif [ "$bucket" = "ticket-images" ]; then
        BUCKET_NAME="${PROJECT_NAME}-${ENVIRONMENT}-ticket-images-bucket"
    elif [ "$bucket" = "frontend" ]; then
        BUCKET_NAME="${PROJECT_NAME}-${ENVIRONMENT}-frontend-bucket"
    fi
    
    # 버킷 비우기
    aws s3 rm "s3://${BUCKET_NAME}" --recursive 2>/dev/null || true
    # 버킷 삭제
    aws s3api delete-bucket --bucket "$BUCKET_NAME" --region "$REGION" 2>/dev/null && echo "  ✅ S3 Bucket 삭제: $BUCKET_NAME" || echo "  ⚠️  S3 Bucket 없음: $BUCKET_NAME"
done

# Secrets Manager Secrets 삭제
echo "📦 Secrets Manager Secrets 삭제 중..."
for secret in "passit/${ENVIRONMENT}/db" "passit/${ENVIRONMENT}/smtp" "passit/${ENVIRONMENT}/kakao" "passit/${ENVIRONMENT}/admin" "passit/${ENVIRONMENT}/app/secrets" "passit/elasticache/credentials/${ENVIRONMENT}" "passit/${ENVIRONMENT}/valkey/connection"; do
    aws secretsmanager delete-secret --secret-id "$secret" --force-delete-without-recovery --region "$REGION" 2>/dev/null && echo "  ✅ Secret 삭제: $secret" || echo "  ⚠️  Secret 없음: $secret"
done

# IAM Roles 삭제 (Policy 먼저 detach)
echo "📦 IAM Roles 삭제 중..."

# 일반 IAM Roles 삭제
for role in eks-cluster eks-node-group github-actions argocd prometheus fluentbit app-pod; do
    ROLE_NAME="${PROJECT_NAME}-${role}-${ENVIRONMENT}"
    delete_iam_role "$ROLE_NAME"
done

# EKS가 생성한 service-linked roles 삭제
echo "📦 EKS Service-Linked Roles 삭제 중..."
aws iam list-roles --query "Roles[?contains(RoleName, '${PROJECT_NAME}-${ENVIRONMENT}-eks-cluster')].RoleName" --output text 2>/dev/null | \
while read role_name; do
    [ -n "$role_name" ] && delete_iam_role "$role_name"
done

# 모든 passit-dev-* roles 삭제 (남은 것들)
echo "📦 남은 passit-dev-* Roles 삭제 중..."
aws iam list-roles --query "Roles[?contains(RoleName, '${PROJECT_NAME}-${ENVIRONMENT}')].RoleName" --output text 2>/dev/null | \
while read role_name; do
    [ -n "$role_name" ] && delete_iam_role "$role_name"
done

# IAM Policies 삭제
echo "📦 IAM Policies 삭제 중..."
for policy in github-actions argocd prometheus fluentbit app-pod cluster-autoscaler; do
    POLICY_NAME="${PROJECT_NAME}-${ENVIRONMENT}-${policy}"
    if [ "$policy" = "cluster-autoscaler" ]; then
        POLICY_NAME="${PROJECT_NAME}-${ENVIRONMENT}-cluster-autoscaler"
    fi
    
    # Policy versions 삭제 (기본 버전 제외)
    POLICY_ARN="arn:aws:iam::727646470302:policy/${POLICY_NAME}"
    aws iam list-policy-versions --policy-arn "$POLICY_ARN" --query 'Versions[?IsDefaultVersion==`false`].VersionId' --output text 2>/dev/null | \
    while read version_id; do
        [ -n "$version_id" ] && aws iam delete-policy-version --policy-arn "$POLICY_ARN" --version-id "$version_id" 2>/dev/null || true
    done
    
    # Policy 삭제
    aws iam delete-policy --policy-arn "$POLICY_ARN" --region "$REGION" 2>/dev/null && echo "  ✅ IAM Policy 삭제: $POLICY_NAME" || echo "  ⚠️  IAM Policy 없음: $POLICY_NAME"
done

# KMS Keys 삭제 (Alias 먼저 삭제, Key는 스케줄 삭제)
echo "📦 KMS Keys 삭제 중..."
for alias_name in secrets rds elasticache ebs s3; do
    ALIAS="alias/${PROJECT_NAME}-${alias_name}-${ENVIRONMENT}"
    
    # Key ID 가져오기
    KEY_ID=$(aws kms describe-key --key-id "$ALIAS" --query 'KeyMetadata.KeyId' --output text 2>/dev/null || echo "")
    
    if [ -n "$KEY_ID" ]; then
        # Alias 삭제
        aws kms delete-alias --alias-name "$ALIAS" --region "$REGION" 2>/dev/null && echo "  ✅ KMS Alias 삭제: $ALIAS" || echo "  ⚠️  KMS Alias 없음: $ALIAS"
        
        # Key 스케줄 삭제 (7일 후 삭제)
        aws kms schedule-key-deletion --key-id "$KEY_ID" --pending-window-in-days 7 --region "$REGION" 2>/dev/null && echo "  ✅ KMS Key 삭제 예약: $KEY_ID (7일 후)" || echo "  ⚠️  KMS Key 삭제 예약 실패: $KEY_ID"
    fi
done

# ElastiCache Subnet Group, Parameter Group 삭제
echo "📦 ElastiCache Subnet/Parameter Groups 삭제 중..."
aws elasticache delete-cache-subnet-group --cache-subnet-group-name "${PROJECT_NAME}-${ENVIRONMENT}-valkey-subnet-group" --region "$REGION" 2>/dev/null && echo "  ✅ Subnet Group 삭제" || echo "  ⚠️  Subnet Group 없음"
aws elasticache delete-cache-parameter-group --cache-parameter-group-name "${PROJECT_NAME}-${ENVIRONMENT}-valkey-pg" --region "$REGION" 2>/dev/null && echo "  ✅ Parameter Group 삭제" || echo "  ⚠️  Parameter Group 없음"

# RDS Parameter Group 삭제
echo "📦 RDS Parameter Groups 삭제 중..."
aws rds delete-db-cluster-parameter-group --db-cluster-parameter-group-name "${PROJECT_NAME}-${ENVIRONMENT}-aurora-pg" --region "$REGION" 2>/dev/null && echo "  ✅ RDS Parameter Group 삭제" || echo "  ⚠️  RDS Parameter Group 없음"

echo ""
echo "=========================================="
echo "✅ 리소스 삭제 완료!"
echo "=========================================="
echo ""
echo "⚠️  주의사항:"
echo "  - EKS Cluster는 완전히 삭제되는데 시간이 걸립니다 (10-15분)"
echo "  - RDS Cluster는 완전히 삭제되는데 시간이 걸립니다 (5-10분)"
echo "  - ElastiCache는 완전히 삭제되는데 시간이 걸립니다 (5-10분)"
echo "  - KMS Keys는 7일 후에 완전히 삭제됩니다"
echo ""
echo "삭제 상태 확인:"
echo "  aws eks describe-cluster --name ${PROJECT_NAME}-${ENVIRONMENT}-eks --region $REGION"
echo "  aws rds describe-db-clusters --db-cluster-identifier ${PROJECT_NAME}-${ENVIRONMENT}-aurora-cluster --region $REGION"
echo ""

