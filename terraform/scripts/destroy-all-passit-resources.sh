#!/bin/bash
# Passit 관련 모든 AWS 리소스를 찾아서 완전히 삭제하는 강력한 스크립트
# ⚠️  ⚠️  ⚠️  매우 위험합니다! 모든 passit 리소스를 삭제합니다! ⚠️  ⚠️  ⚠️

set -e

PROJECT_NAME="passit"
REGION="ap-northeast-2"
ACCOUNT_ID="727646470302"

# 색상 정의
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║                                                            ║${NC}"
echo -e "${RED}║  ⚠️  ⚠️  ⚠️  PASSIT 관련 모든 리소스 완전 삭제 ⚠️  ⚠️  ⚠️  ║${NC}"
echo -e "${RED}║                                                            ║${NC}"
echo -e "${RED}║  이 스크립트는 다음을 모두 찾아서 삭제합니다:              ║${NC}"
echo -e "${RED}║  - passit 태그가 있는 모든 리소스                         ║${NC}"
echo -e "${RED}║  - passit-로 시작하는 모든 리소스                         ║${NC}"
echo -e "${RED}║  - passit/ 경로의 모든 리소스                             ║${NC}"
echo -e "${RED}║                                                            ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 최종 확인
echo -e "${RED}⚠️  ⚠️  ⚠️  최종 확인이 필요합니다! ⚠️  ⚠️  ⚠️${NC}"
echo ""
read -p "정말로 passit 관련 모든 리소스를 삭제하시겠습니까? (yes/no): " CONFIRM1
if [ "$CONFIRM1" != "yes" ]; then
    echo -e "${GREEN}✅ 취소되었습니다.${NC}"
    exit 0
fi

read -p "다시 한 번 확인: 'DELETE ALL PASSIT'를 입력하세요: " CONFIRM2
if [ "$CONFIRM2" != "DELETE ALL PASSIT" ]; then
    echo -e "${GREEN}✅ 취소되었습니다.${NC}"
    exit 0
fi

read -p "마지막 확인: 'CONFIRM NUCLEAR DELETE'를 입력하세요: " CONFIRM3
if [ "$CONFIRM3" != "CONFIRM NUCLEAR DELETE" ]; then
    echo -e "${GREEN}✅ 취소되었습니다.${NC}"
    exit 0
fi

echo ""
echo -e "${RED}🚨 핵 삭제 시작...${NC}"
echo ""

# 1. EKS Clusters (passit로 시작하는 모든 클러스터)
echo "📦 1. EKS Clusters 삭제 중..."
CLUSTERS=$(aws eks list-clusters --region $REGION --query "clusters[?starts_with(@, 'passit')]" --output text 2>/dev/null || echo "")
for CLUSTER_NAME in $CLUSTERS; do
    echo "   EKS Cluster 발견: $CLUSTER_NAME"
    
    # Node Groups 삭제
    NODE_GROUPS=$(aws eks list-nodegroups --cluster-name $CLUSTER_NAME --region $REGION --query 'nodegroups[]' --output text 2>/dev/null || echo "")
    for NODE_GROUP in $NODE_GROUPS; do
        echo "     Node Group 삭제: $NODE_GROUP"
        aws eks delete-nodegroup --cluster-name $CLUSTER_NAME --nodegroup-name $NODE_GROUP --region $REGION 2>/dev/null || true
    done
    
    if [ -n "$NODE_GROUPS" ]; then
        echo "     Node Groups 삭제 대기 중..."
        sleep 30
    fi
    
    echo "     Cluster 삭제: $CLUSTER_NAME"
    aws eks delete-cluster --name $CLUSTER_NAME --region $REGION 2>/dev/null || true
done
echo ""

# 2. RDS Clusters (passit로 시작하는 모든 클러스터)
echo "📦 2. RDS Clusters 삭제 중..."
RDS_CLUSTERS=$(aws rds describe-db-clusters --region $REGION --query "DBClusters[?starts_with(DBClusterIdentifier, 'passit')].DBClusterIdentifier" --output text 2>/dev/null || echo "")
for CLUSTER_ID in $RDS_CLUSTERS; do
    echo "   RDS Cluster 발견: $CLUSTER_ID"
    aws rds delete-db-cluster --db-cluster-identifier $CLUSTER_ID --skip-final-snapshot --region $REGION 2>/dev/null || true
done
echo ""

# 3. ElastiCache (passit로 시작하는 모든 클러스터)
echo "📦 3. ElastiCache 삭제 중..."
CACHE_CLUSTERS=$(aws elasticache describe-cache-clusters --region $REGION --query "CacheClusters[?starts_with(CacheClusterId, 'passit')].CacheClusterId" --output text 2>/dev/null || echo "")
for CACHE_ID in $CACHE_CLUSTERS; do
    echo "   ElastiCache 발견: $CACHE_ID"
    aws elasticache delete-cache-cluster --cache-cluster-id $CACHE_ID --region $REGION 2>/dev/null || true
done

REPLICATION_GROUPS=$(aws elasticache describe-replication-groups --region $REGION --query "ReplicationGroups[?starts_with(ReplicationGroupId, 'passit')].ReplicationGroupId" --output text 2>/dev/null || echo "")
for REPLICATION_ID in $REPLICATION_GROUPS; do
    echo "   Replication Group 발견: $REPLICATION_ID"
    aws elasticache delete-replication-group --replication-group-id $REPLICATION_ID --region $REGION 2>/dev/null || true
done
echo ""

# 4. S3 Buckets (passit로 시작하는 모든 버킷)
echo "📦 4. S3 Buckets 삭제 중..."
BUCKETS=$(aws s3api list-buckets --query "Buckets[?starts_with(Name, 'passit')].Name" --output text 2>/dev/null || echo "")
for BUCKET_NAME in $BUCKETS; do
    echo "   S3 Bucket 발견: $BUCKET_NAME"
    echo "     버킷 비우는 중..."
    aws s3 rm s3://$BUCKET_NAME --recursive 2>/dev/null || true
    echo "     버킷 삭제 중..."
    aws s3api delete-bucket --bucket $BUCKET_NAME --region $REGION 2>/dev/null || \
    aws s3api delete-bucket --bucket $BUCKET_NAME 2>/dev/null || true
done
echo ""

# 5. Prometheus Workspaces (passit 태그 또는 이름)
echo "📦 5. Prometheus Workspaces 삭제 중..."
WORKSPACES=$(aws amp list-workspaces --region $REGION --query "workspaces[?contains(alias, 'passit')].workspaceId" --output text 2>/dev/null || echo "")
for WORKSPACE_ID in $WORKSPACES; do
    echo "   Prometheus Workspace 발견: $WORKSPACE_ID"
    aws amp delete-workspace --workspace-id $WORKSPACE_ID --region $REGION 2>/dev/null || true
done
echo ""

# 6. Secrets Manager (passit/ 경로의 모든 시크릿)
echo "📦 6. Secrets Manager 삭제 중..."
SECRETS=$(aws secretsmanager list-secrets --region $REGION --query "SecretList[?starts_with(Name, 'passit/') || starts_with(Name, 'passit-')].Name" --output text 2>/dev/null || echo "")
for SECRET_NAME in $SECRETS; do
    echo "   Secret 발견: $SECRET_NAME"
    aws secretsmanager delete-secret --secret-id "$SECRET_NAME" --force-delete-without-recovery --region $REGION 2>/dev/null || true
done
echo ""

# 7. IAM Roles (passit로 시작하는 모든 역할)
echo "📦 7. IAM Roles 삭제 중..."
ROLES=$(aws iam list-roles --query "Roles[?starts_with(RoleName, 'passit-')].RoleName" --output text 2>/dev/null || echo "")
for ROLE_NAME in $ROLES; do
    echo "   IAM Role 발견: $ROLE_NAME"
    # Attached Policies 제거
    ATTACHED_POLICIES=$(aws iam list-attached-role-policies --role-name $ROLE_NAME --query 'AttachedPolicies[].PolicyArn' --output text 2>/dev/null || echo "")
    for POLICY_ARN in $ATTACHED_POLICIES; do
        aws iam detach-role-policy --role-name $ROLE_NAME --policy-arn $POLICY_ARN 2>/dev/null || true
    done
    # Inline Policies 제거
    INLINE_POLICIES=$(aws iam list-role-policies --role-name $ROLE_NAME --query 'PolicyNames[]' --output text 2>/dev/null || echo "")
    for POLICY_NAME in $INLINE_POLICIES; do
        aws iam delete-role-policy --role-name $ROLE_NAME --policy-name $POLICY_NAME 2>/dev/null || true
    done
    # Role 삭제
    aws iam delete-role --role-name $ROLE_NAME 2>/dev/null || echo "     ⚠️  삭제 실패"
done
echo ""

# 8. IAM Policies (passit로 시작하는 모든 정책)
echo "📦 8. IAM Policies 삭제 중..."
POLICIES=$(aws iam list-policies --scope Local --query "Policies[?starts_with(PolicyName, 'passit-')].Arn" --output text 2>/dev/null || echo "")
for POLICY_ARN in $POLICIES; do
    echo "   IAM Policy 발견: $POLICY_ARN"
    # Policy 버전 삭제
    POLICY_VERSIONS=$(aws iam list-policy-versions --policy-arn $POLICY_ARN --query 'Versions[?IsDefaultVersion==`false`].VersionId' --output text 2>/dev/null || echo "")
    for VERSION_ID in $POLICY_VERSIONS; do
        aws iam delete-policy-version --policy-arn $POLICY_ARN --version-id $VERSION_ID 2>/dev/null || true
    done
    # Policy 삭제
    aws iam delete-policy --policy-arn $POLICY_ARN 2>/dev/null || echo "     ⚠️  삭제 실패"
done
echo ""

# 9. VPC 및 네트워크 리소스 (passit 태그)
echo "📦 9. VPC 및 네트워크 리소스 삭제 중..."
VPCS=$(aws ec2 describe-vpcs --filters "Name=tag:Project,Values=$PROJECT_NAME" --query 'Vpcs[].VpcId' --output text --region $REGION 2>/dev/null || echo "")
if [ -z "$VPCS" ]; then
    # 태그로 못 찾으면 이름으로
    VPCS=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=passit-*" --query 'Vpcs[].VpcId' --output text --region $REGION 2>/dev/null || echo "")
fi

for VPC_ID in $VPCS; do
    if [ -n "$VPC_ID" ] && [ "$VPC_ID" != "None" ]; then
        echo "   VPC 발견: $VPC_ID"
        
        # NAT Gateways
        NAT_GATEWAYS=$(aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$VPC_ID" --query 'NatGateways[?State==`available`].NatGatewayId' --output text --region $REGION 2>/dev/null || echo "")
        for NAT_ID in $NAT_GATEWAYS; do
            echo "     NAT Gateway 삭제: $NAT_ID"
            aws ec2 delete-nat-gateway --nat-gateway-id $NAT_ID --region $REGION 2>/dev/null || true
        done
        
        # Elastic IPs
        EIPS=$(aws ec2 describe-addresses --filters "Name=domain,Values=vpc" --query 'Addresses[?AssociationId==null].AllocationId' --output text --region $REGION 2>/dev/null || echo "")
        for EIP_ID in $EIPS; do
            echo "     Elastic IP 삭제: $EIP_ID"
            aws ec2 release-address --allocation-id $EIP_ID --region $REGION 2>/dev/null || true
        done
        
        # Internet Gateways
        IGW_ID=$(aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$VPC_ID" --query 'InternetGateways[0].InternetGatewayId' --output text --region $REGION 2>/dev/null || echo "")
        if [ -n "$IGW_ID" ] && [ "$IGW_ID" != "None" ]; then
            echo "     Internet Gateway 분리 및 삭제: $IGW_ID"
            aws ec2 detach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID --region $REGION 2>/dev/null || true
            aws ec2 delete-internet-gateway --internet-gateway-id $IGW_ID --region $REGION 2>/dev/null || true
        fi
        
        # Subnets
        SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[].SubnetId' --output text --region $REGION 2>/dev/null || echo "")
        for SUBNET_ID in $SUBNETS; do
            echo "     Subnet 삭제: $SUBNET_ID"
            aws ec2 delete-subnet --subnet-id $SUBNET_ID --region $REGION 2>/dev/null || true
        done
        
        # Route Tables (메인 제외)
        ROUTE_TABLES=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" --query 'RouteTables[?Associations[0].Main==`false`].RouteTableId' --output text --region $REGION 2>/dev/null || echo "")
        for RT_ID in $ROUTE_TABLES; do
            echo "     Route Table 삭제: $RT_ID"
            aws ec2 delete-route-table --route-table-id $RT_ID --region $REGION 2>/dev/null || true
        done
        
        # Security Groups (passit 태그)
        SGS=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Project,Values=$PROJECT_NAME" --query 'SecurityGroups[].GroupId' --output text --region $REGION 2>/dev/null || echo "")
        for SG_ID in $SGS; do
            if [ -n "$SG_ID" ] && [ "$SG_ID" != "None" ] && [ "$SG_ID" != "null" ]; then
                echo "     Security Group 삭제: $SG_ID"
                aws ec2 delete-security-group --group-id $SG_ID --region $REGION 2>/dev/null || true
            fi
        done
        
        # VPC 삭제
        echo "     VPC 삭제: $VPC_ID"
        aws ec2 delete-vpc --vpc-id $VPC_ID --region $REGION 2>/dev/null || echo "       ⚠️  삭제 실패"
    fi
done
echo ""

# 10. EC2 Instances (passit 태그)
echo "📦 10. EC2 Instances 삭제 중..."
INSTANCES=$(aws ec2 describe-instances --filters "Name=tag:Project,Values=$PROJECT_NAME" "Name=instance-state-name,Values=running,stopped" --query 'Reservations[].Instances[].InstanceId' --output text --region $REGION 2>/dev/null || echo "")
for INSTANCE_ID in $INSTANCES; do
    if [ -n "$INSTANCE_ID" ] && [ "$INSTANCE_ID" != "None" ]; then
        echo "   EC2 Instance 발견: $INSTANCE_ID"
        aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $REGION 2>/dev/null || true
    fi
done
echo ""

# 11. Load Balancers (passit 태그)
echo "📦 11. Load Balancers 삭제 중..."
ALBS=$(aws elbv2 describe-load-balancers --region $REGION --query "LoadBalancers[?contains(LoadBalancerName, 'passit')].LoadBalancerArn" --output text 2>/dev/null || echo "")
for ALB_ARN in $ALBS; do
    if [ -n "$ALB_ARN" ] && [ "$ALB_ARN" != "None" ]; then
        echo "   ALB 발견: $ALB_ARN"
        aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN --region $REGION 2>/dev/null || true
    fi
done
echo ""

# 12. CloudFront Distributions (passit 관련)
echo "📦 12. CloudFront Distributions 삭제 중..."
DISTRIBUTIONS=$(aws cloudfront list-distributions --query "DistributionList.Items[?contains(Comment, 'passit') || contains(Aliases.Items[0], 'passit')].Id" --output text 2>/dev/null || echo "")
for DIST_ID in $DISTRIBUTIONS; do
    if [ -n "$DIST_ID" ] && [ "$DIST_ID" != "None" ]; then
        echo "   CloudFront Distribution 발견: $DIST_ID"
        # Disable first
        ETAG=$(aws cloudfront get-distribution-config --id $DIST_ID --query 'ETag' --output text 2>/dev/null || echo "")
        if [ -n "$ETAG" ]; then
            aws cloudfront update-distribution --id $DIST_ID --distribution-config file://<(aws cloudfront get-distribution-config --id $DIST_ID --query 'DistributionConfig' --output json | jq '.Enabled = false') --if-match $ETAG 2>/dev/null || true
            sleep 5
            aws cloudfront delete-distribution --id $DIST_ID --if-match $ETAG 2>/dev/null || true
        fi
    fi
done
echo ""

# 13. KMS Keys (passit 태그)
echo "📦 13. KMS Keys 삭제 중..."
KEYS=$(aws kms list-keys --region $REGION --query 'Keys[].KeyId' --output text 2>/dev/null || echo "")
for KEY_ID in $KEYS; do
    KEY_ALIAS=$(aws kms list-aliases --key-id $KEY_ID --region $REGION --query "Aliases[?contains(AliasName, 'passit')].AliasName" --output text 2>/dev/null || echo "")
    if [ -n "$KEY_ALIAS" ]; then
        echo "   KMS Key 발견: $KEY_ID"
        aws kms delete-alias --alias-name $KEY_ALIAS --region $REGION 2>/dev/null || true
        aws kms schedule-key-deletion --key-id $KEY_ID --pending-window-in-days 7 --region $REGION 2>/dev/null || true
    fi
done
echo ""

echo -e "${GREEN}✅ Passit 관련 모든 리소스 삭제 완료!${NC}"
echo ""
echo -e "${YELLOW}📝 참고:${NC}"
echo "  - 일부 리소스는 의존성 때문에 즉시 삭제되지 않을 수 있습니다"
echo "  - AWS Console에서 남은 리소스를 확인하세요"
echo "  - EKS Cluster와 RDS는 삭제에 시간이 걸릴 수 있습니다"
echo "  - KMS Keys는 7일 후 완전 삭제됩니다"
echo ""
echo -e "${BLUE}남은 리소스 확인:${NC}"
echo "  aws resourcegroupstaggingapi get-resources --tag-filters Key=Project,Values=$PROJECT_NAME --region $REGION"

