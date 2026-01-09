#!/bin/bash
# Passit 관련 모든 AWS 리소스를 찾아서 완전히 삭제하는 강력한 스크립트
# ⚠️  ⚠️  ⚠️  매우 위험합니다! 모든 passit 리소스를 삭제합니다! ⚠️  ⚠️  ⚠️

set -e

PROJECT_NAME="passit"
# 모든 환경의 리전 (dev/prod: 서울, dr: 도쿄)
REGIONS=("ap-northeast-2" "ap-northeast-1")
# 계정 ID 자동 감지 (motionbit profile 사용)
ACCOUNT_ID=$(aws sts get-caller-identity --profile motionbit --query Account --output text 2>/dev/null || aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")

# 색상 정의
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
echo -e "${RED}                                                            ${NC}"
echo -e "${RED}  ⚠️  ⚠️  ⚠️  PASSIT 관련 모든 리소스 완전 삭제 ⚠️  ⚠️  ⚠️        ${NC}"
echo -e "${RED}                                                            ${NC}"
echo -e "${RED}  이 스크립트는 다음을 모두 찾아서 삭제합니다:                         ${NC}"
echo -e "${RED}  - passit 태그가 있는 모든 리소스                                ${NC}"
echo -e "${RED}  - passit-로 시작하는 모든 리소스                                ${NC}"
echo -e "${RED}  - passit/ 경로의 모든 리소스                                   ${NC}"
echo -e "${RED}  - 리전: ${REGIONS[*]}                                        ${NC}"
echo -e "${RED}                                                            ${NC}"
echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
echo ""

# 최종 확인
echo -e "${RED}⚠️  ⚠️  ⚠️  최종 확인이 필요합니다! ⚠️  ⚠️  ⚠️${NC}"
echo ""
read -p "정말로 passit 관련 모든 리소스를 삭제하시겠습니까? (yes/no): " CONFIRM1
if [ "$CONFIRM1" != "yes" ]; then
    echo -e "${GREEN}✅ 취소되었습니다.${NC}"
    exit 0
fi

echo ""
echo -e "${RED}🚨 삭제 시작...${NC}"
echo ""

# 리전별로 리소스 삭제 함수
delete_resources_by_region() {
    local REGION=$1
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}리전: ${REGION}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # 1. EKS Clusters (passit로 시작하는 모든 클러스터) - 강제 삭제
    echo "📦 1. EKS Clusters 강제 삭제 중... (${REGION})"
    CLUSTERS=$(aws eks list-clusters --region $REGION --query "clusters[?starts_with(@, 'passit')]" --output text 2>/dev/null || echo "")
    for CLUSTER_NAME in $CLUSTERS; do
        echo "   EKS Cluster 발견: $CLUSTER_NAME"
        
        # Node Groups 삭제
        NODE_GROUPS=$(aws eks list-nodegroups --cluster-name $CLUSTER_NAME --region $REGION --query 'nodegroups[]' --output text 2>/dev/null || echo "")
        for NODE_GROUP in $NODE_GROUPS; do
            echo "     Node Group 삭제: $CLUSTER_NAME/$NODE_GROUP"
            aws eks delete-nodegroup --cluster-name $CLUSTER_NAME --nodegroup-name $NODE_GROUP --region $REGION 2>/dev/null || true
        done
        
        # Node Groups 삭제 대기 (최대 15분)
        if [ -n "$NODE_GROUPS" ]; then
            echo "     Node Groups 삭제 대기 중... (최대 15분)"
            for i in {1..90}; do
                REMAINING_NGS=$(aws eks list-nodegroups --cluster-name $CLUSTER_NAME --region $REGION --query 'nodegroups[]' --output text 2>/dev/null || echo "")
                if [ -z "$REMAINING_NGS" ] || [ "$REMAINING_NGS" = "None" ]; then
                    echo "     ✅ 모든 Node Groups 삭제 완료"
                    break
                fi
                if [ $i -eq 90 ]; then
                    echo "     ⚠️  일부 Node Groups가 아직 삭제 중입니다. EC2 인스턴스를 강제로 종료합니다."
                elif [ $((i % 10)) -eq 0 ]; then
                    echo "     대기 중... ($i/90)"
                fi
                sleep 10
            done
        fi
        
        # Node Group의 EC2 인스턴스 강제 종료 (Node Group 삭제가 완료되지 않은 경우)
        echo "     EKS Node Group EC2 인스턴스 강제 종료 중..."
        EKS_INSTANCES=$(aws ec2 describe-instances \
            --filters "Name=tag:eks:cluster-name,Values=$CLUSTER_NAME" "Name=instance-state-name,Values=running,pending,stopping" \
            --query 'Reservations[].Instances[].InstanceId' \
            --output text \
            --region $REGION 2>/dev/null || echo "")
        for INSTANCE_ID in $EKS_INSTANCES; do
            if [ -n "$INSTANCE_ID" ] && [ "$INSTANCE_ID" != "None" ]; then
                echo "       EC2 Instance 강제 종료: $INSTANCE_ID"
                aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $REGION 2>/dev/null || true
            fi
        done
        
        # Auto Scaling Groups 삭제 (EKS Node Group 관련)
        echo "     Auto Scaling Groups 삭제 중..."
        ASGS=$(aws autoscaling describe-auto-scaling-groups \
            --region $REGION \
            --query "AutoScalingGroups[?contains(AutoScalingGroupName, '$CLUSTER_NAME')].AutoScalingGroupName" \
            --output text 2>/dev/null || echo "")
        for ASG_NAME in $ASGS; do
            if [ -n "$ASG_NAME" ] && [ "$ASG_NAME" != "None" ]; then
                echo "       Auto Scaling Group 삭제: $ASG_NAME"
                # 먼저 desired capacity를 0으로 설정
                aws autoscaling update-auto-scaling-group --auto-scaling-group-name "$ASG_NAME" --min-size 0 --max-size 0 --desired-capacity 0 --region $REGION 2>/dev/null || true
                sleep 2
                # 인스턴스 종료 대기
                aws autoscaling delete-auto-scaling-group --auto-scaling-group-name "$ASG_NAME" --force-delete --region $REGION 2>/dev/null || true
            fi
        done
        
        # Launch Templates 삭제 (EKS Node Group 관련)
        echo "     Launch Templates 삭제 중..."
        LTS=$(aws ec2 describe-launch-templates \
            --region $REGION \
            --query "LaunchTemplates[?contains(LaunchTemplateName, '$CLUSTER_NAME')].LaunchTemplateId" \
            --output text 2>/dev/null || echo "")
        for LT_ID in $LTS; do
            if [ -n "$LT_ID" ] && [ "$LT_ID" != "None" ]; then
                LT_NAME=$(aws ec2 describe-launch-templates --launch-template-ids $LT_ID --region $REGION --query 'LaunchTemplates[0].LaunchTemplateName' --output text 2>/dev/null || echo "")
                if [ -n "$LT_NAME" ] && [ "$LT_NAME" != "None" ]; then
                    echo "       Launch Template 삭제: $LT_NAME"
                    aws ec2 delete-launch-template --launch-template-id $LT_ID --region $REGION 2>/dev/null || true
                fi
            fi
        done
        
        echo "     Cluster 삭제: $CLUSTER_NAME"
        aws eks delete-cluster --name $CLUSTER_NAME --region $REGION 2>/dev/null || true
    done
    echo ""

    # 2. RDS Clusters 및 Instances (Aurora 포함)
    echo "📦 2. RDS Clusters 및 Instances 삭제 중... (${REGION})"
    
    # 먼저 모든 RDS Instances 삭제 (Cluster와 독립적인 것들)
    RDS_INSTANCES=$(aws rds describe-db-instances --region $REGION --query "DBInstances[?starts_with(DBInstanceIdentifier, 'passit') && DBClusterIdentifier==null].DBInstanceIdentifier" --output text 2>/dev/null || echo "")
    for INSTANCE_ID in $RDS_INSTANCES; do
        if [ -n "$INSTANCE_ID" ] && [ "$INSTANCE_ID" != "None" ]; then
            echo "   RDS Instance 삭제: $INSTANCE_ID"
            aws rds delete-db-instance --db-instance-identifier "$INSTANCE_ID" --skip-final-snapshot --region $REGION 2>/dev/null || true
        fi
    done
    
    # Aurora Cluster의 Instances 삭제
    RDS_CLUSTERS=$(aws rds describe-db-clusters --region $REGION --query "DBClusters[?starts_with(DBClusterIdentifier, 'passit')].DBClusterIdentifier" --output text 2>/dev/null || echo "")
    for CLUSTER_ID in $RDS_CLUSTERS; do
        if [ -n "$CLUSTER_ID" ] && [ "$CLUSTER_ID" != "None" ]; then
            echo "   RDS Cluster 발견: $CLUSTER_ID"
            
            # Cluster에 속한 모든 Instances 삭제
            CLUSTER_INSTANCES=$(aws rds describe-db-instances --region $REGION --query "DBInstances[?DBClusterIdentifier=='$CLUSTER_ID'].DBInstanceIdentifier" --output text 2>/dev/null || echo "")
            for INSTANCE_ID in $CLUSTER_INSTANCES; do
                if [ -n "$INSTANCE_ID" ] && [ "$INSTANCE_ID" != "None" ]; then
                    echo "     Cluster Instance 삭제: $INSTANCE_ID"
                    aws rds delete-db-instance --db-instance-identifier "$INSTANCE_ID" --skip-final-snapshot --region $REGION 2>/dev/null || true
                fi
            done
            
            # Instances 삭제 대기 (Aurora는 Instance가 모두 삭제되어야 Cluster 삭제 가능)
            if [ -n "$CLUSTER_INSTANCES" ] && [ "$CLUSTER_INSTANCES" != "None" ]; then
                echo "     Instances 삭제 대기 중... (최대 5분)"
                for i in {1..30}; do
                    REMAINING=$(aws rds describe-db-instances --region $REGION --query "DBInstances[?DBClusterIdentifier=='$CLUSTER_ID'].DBInstanceIdentifier" --output text 2>/dev/null || echo "")
                    if [ -z "$REMAINING" ] || [ "$REMAINING" = "None" ]; then
                        echo "     ✅ 모든 Instances 삭제 완료"
                        break
                    fi
                    echo "     대기 중... ($i/30)"
                    sleep 10
                done
            fi
            
            # Cluster 삭제
            echo "     Cluster 삭제: $CLUSTER_ID"
            aws rds delete-db-cluster --db-cluster-identifier "$CLUSTER_ID" --skip-final-snapshot --region $REGION 2>/dev/null || true
        fi
    done
    
    # RDS Subnet Groups 삭제 (passit로 시작하는 것들)
    echo "📦 2-1. RDS Subnet Groups 삭제 중... (${REGION})"
    SUBNET_GROUPS=$(aws rds describe-db-subnet-groups --region $REGION --query "DBSubnetGroups[?starts_with(DBSubnetGroupName, 'passit')].DBSubnetGroupName" --output text 2>/dev/null || echo "")
    for SUBNET_GROUP in $SUBNET_GROUPS; do
        if [ -n "$SUBNET_GROUP" ] && [ "$SUBNET_GROUP" != "None" ]; then
            echo "   RDS Subnet Group 삭제: $SUBNET_GROUP"
            aws rds delete-db-subnet-group --db-subnet-group-name "$SUBNET_GROUP" --region $REGION 2>/dev/null || true
        fi
    done
    
    # RDS Parameter Groups 삭제 (passit로 시작하는 것들)
    echo "📦 2-2. RDS Parameter Groups 삭제 중... (${REGION})"
    CLUSTER_PARAM_GROUPS=$(aws rds describe-db-cluster-parameter-groups --region $REGION --query "DBClusterParameterGroups[?starts_with(DBClusterParameterGroupName, 'passit') && DBClusterParameterGroupFamily!='default'].DBClusterParameterGroupName" --output text 2>/dev/null || echo "")
    for PARAM_GROUP in $CLUSTER_PARAM_GROUPS; do
        if [ -n "$PARAM_GROUP" ] && [ "$PARAM_GROUP" != "None" ]; then
            echo "   RDS Cluster Parameter Group 삭제: $PARAM_GROUP"
            aws rds delete-db-cluster-parameter-group --db-cluster-parameter-group-name "$PARAM_GROUP" --region $REGION 2>/dev/null || true
        fi
    done
    
    PARAM_GROUPS=$(aws rds describe-db-parameter-groups --region $REGION --query "DBParameterGroups[?starts_with(DBParameterGroupName, 'passit') && DBParameterGroupFamily!='default'].DBParameterGroupName" --output text 2>/dev/null || echo "")
    for PARAM_GROUP in $PARAM_GROUPS; do
        if [ -n "$PARAM_GROUP" ] && [ "$PARAM_GROUP" != "None" ]; then
            echo "   RDS Parameter Group 삭제: $PARAM_GROUP"
            aws rds delete-db-parameter-group --db-parameter-group-name "$PARAM_GROUP" --region $REGION 2>/dev/null || true
        fi
    done
    echo ""

    # 3. ElastiCache (passit로 시작하는 모든 클러스터)
    echo "📦 3. ElastiCache 삭제 중... (${REGION})"
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

    # 4. SNS Topics 및 SQS Queues 삭제 (passit 관련)
    echo "📦 4. SNS Topics 및 SQS Queues 삭제 중... (${REGION})"
    
    # SNS Topic Subscriptions 먼저 삭제
    echo "   SNS Topic Subscriptions 삭제 중..."
    TOPICS=$(aws sns list-topics --region $REGION --query "Topics[?contains(TopicArn, 'passit')].TopicArn" --output text 2>/dev/null || echo "")
    for TOPIC_ARN in $TOPICS; do
        if [ -n "$TOPIC_ARN" ] && [ "$TOPIC_ARN" != "None" ]; then
            echo "     Topic 발견: $TOPIC_ARN"
            # Subscriptions 삭제
            SUBSCRIPTIONS=$(aws sns list-subscriptions-by-topic --topic-arn "$TOPIC_ARN" --region $REGION --query 'Subscriptions[].SubscriptionArn' --output text 2>/dev/null || echo "")
            for SUB_ARN in $SUBSCRIPTIONS; do
                if [ -n "$SUB_ARN" ] && [ "$SUB_ARN" != "None" ] && [ "$SUB_ARN" != "PendingConfirmation" ]; then
                    echo "       Subscription 삭제: $SUB_ARN"
                    aws sns unsubscribe --subscription-arn "$SUB_ARN" --region $REGION 2>/dev/null || true
                fi
            done
        fi
    done
    sleep 2
    
    # SQS Queues 삭제 (DLQ 포함)
    echo "   SQS Queues 삭제 중..."
    QUEUES=$(aws sqs list-queues --region $REGION --query "QueueUrls[?contains(@, 'passit')]" --output text 2>/dev/null || echo "")
    for QUEUE_URL in $QUEUES; do
        if [ -n "$QUEUE_URL" ] && [ "$QUEUE_URL" != "None" ]; then
            echo "     Queue 삭제: $QUEUE_URL"
            # Queue Policy 먼저 삭제 (필요시)
            aws sqs delete-queue --queue-url "$QUEUE_URL" --region $REGION 2>/dev/null || true
        fi
    done
    sleep 2
    
    # SNS Topics 삭제
    echo "   SNS Topics 삭제 중..."
    for TOPIC_ARN in $TOPICS; do
        if [ -n "$TOPIC_ARN" ] && [ "$TOPIC_ARN" != "None" ]; then
            echo "     Topic 삭제: $TOPIC_ARN"
            aws sns delete-topic --topic-arn "$TOPIC_ARN" --region $REGION 2>/dev/null || true
        fi
    done
    echo ""
    
    # 5. DynamoDB Tables (passit로 시작하는 모든 테이블)
    echo "📦 5. DynamoDB Tables 삭제 중... (${REGION})"
    TABLES=$(aws dynamodb list-tables --region $REGION --query "TableNames[?starts_with(@, 'passit')]" --output text 2>/dev/null || echo "")
    for TABLE_NAME in $TABLES; do
        if [ -n "$TABLE_NAME" ] && [ "$TABLE_NAME" != "None" ]; then
            echo "   DynamoDB Table 삭제: $TABLE_NAME"
            aws dynamodb delete-table --table-name "$TABLE_NAME" --region $REGION 2>/dev/null || true
        fi
    done
    echo ""

    # 6. Prometheus Workspaces (passit 태그 또는 이름)
    echo "📦 6. Prometheus Workspaces 삭제 중... (${REGION})"
    WORKSPACES=$(aws amp list-workspaces --region $REGION --query "workspaces[?contains(alias, 'passit')].workspaceId" --output text 2>/dev/null || echo "")
    for WORKSPACE_ID in $WORKSPACES; do
        echo "   Prometheus Workspace 발견: $WORKSPACE_ID"
        aws amp delete-workspace --workspace-id $WORKSPACE_ID --region $REGION 2>/dev/null || true
    done
    echo ""

    # 7. Secrets Manager (passit/ 경로의 모든 시크릿)
    echo "📦 7. Secrets Manager 삭제 중... (${REGION})"
    SECRETS=$(aws secretsmanager list-secrets --region $REGION --query "SecretList[?starts_with(Name, 'passit/') || starts_with(Name, 'passit-')].Name" --output text 2>/dev/null || echo "")
    for SECRET_NAME in $SECRETS; do
        echo "   Secret 발견: $SECRET_NAME"
        aws secretsmanager delete-secret --secret-id "$SECRET_NAME" --force-delete-without-recovery --region $REGION 2>/dev/null || true
    done
    echo ""

    # 8. EBS Volumes (passit 관련 볼륨)
    echo "📦 8. EBS Volumes 삭제 중... (${REGION})"
    # Project 태그로 볼륨 찾기
    VOLUMES_PROJECT=$(aws ec2 describe-volumes \
        --filters "Name=tag:Project,Values=$PROJECT_NAME" "Name=status,Values=available" \
        --query 'Volumes[].VolumeId' \
        --output text \
        --region $REGION 2>/dev/null || echo "")
    # EKS 클러스터 태그로 볼륨 찾기
    VOLUMES_EKS=$(aws ec2 describe-volumes \
        --filters "Name=tag:eks:cluster-name,Values=passit-*" "Name=status,Values=available" \
        --query 'Volumes[].VolumeId' \
        --output text \
        --region $REGION 2>/dev/null || echo "")
    # 모든 볼륨 ID 합치기 (중복 제거)
    ALL_VOLUMES=$(echo "$VOLUMES_PROJECT $VOLUMES_EKS" | tr ' ' '\n' | sort -u | tr '\n' ' ')
    for VOL_ID in $ALL_VOLUMES; do
        if [ -n "$VOL_ID" ] && [ "$VOL_ID" != "None" ]; then
            echo "   EBS Volume 삭제: $VOL_ID"
            aws ec2 delete-volume --volume-id "$VOL_ID" --region $REGION 2>/dev/null || true
        fi
    done
    echo ""

    # 9. VPC 및 네트워크 리소스 (passit 태그) - 강제 삭제
    echo "📦 9. VPC 및 네트워크 리소스 강제 삭제 중... (${REGION})"
    VPCS=$(aws ec2 describe-vpcs --filters "Name=tag:Project,Values=$PROJECT_NAME" --query 'Vpcs[].VpcId' --output text --region $REGION 2>/dev/null || echo "")
    if [ -z "$VPCS" ]; then
        # 태그로 못 찾으면 이름으로
        VPCS=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=passit-*" --query 'Vpcs[].VpcId' --output text --region $REGION 2>/dev/null || echo "")
    fi

    for VPC_ID in $VPCS; do
        if [ -n "$VPC_ID" ] && [ "$VPC_ID" != "None" ]; then
            echo "   VPC 발견: $VPC_ID (강제 삭제 모드)"
            
            # 1. Load Balancers 먼저 삭제 (의존성 최상위)
            echo "     [1/10] Load Balancers 강제 삭제 중..."
            # ALB/NLB
            ALBS=$(aws elbv2 describe-load-balancers --region $REGION --query "LoadBalancers[?VpcId=='$VPC_ID'].LoadBalancerArn" --output text 2>/dev/null || echo "")
            for ALB_ARN in $ALBS; do
                if [ -n "$ALB_ARN" ] && [ "$ALB_ARN" != "None" ]; then
                    echo "       ALB/NLB 삭제: $ALB_ARN"
                    # Target Groups 먼저 삭제
                    TARGET_GROUPS=$(aws elbv2 describe-target-groups --load-balancer-arn $ALB_ARN --region $REGION --query 'TargetGroups[].TargetGroupArn' --output text 2>/dev/null || echo "")
                    for TG_ARN in $TARGET_GROUPS; do
                        if [ -n "$TG_ARN" ] && [ "$TG_ARN" != "None" ]; then
                            echo "         Target Group 삭제: $TG_ARN"
                            aws elbv2 delete-target-group --target-group-arn $TG_ARN --region $REGION 2>/dev/null || true
                        fi
                    done
                    # Listener 삭제
                    LISTENERS=$(aws elbv2 describe-listeners --load-balancer-arn $ALB_ARN --region $REGION --query 'Listeners[].ListenerArn' --output text 2>/dev/null || echo "")
                    for LISTENER_ARN in $LISTENERS; do
                        if [ -n "$LISTENER_ARN" ] && [ "$LISTENER_ARN" != "None" ]; then
                            echo "         Listener 삭제: $LISTENER_ARN"
                            aws elbv2 delete-listener --listener-arn $LISTENER_ARN --region $REGION 2>/dev/null || true
                        fi
                    done
                    # Load Balancer 삭제
                    aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN --region $REGION 2>/dev/null || true
                    sleep 3
                fi
            done
            # Classic Load Balancer
            CLBS=$(aws elb describe-load-balancers --region $REGION --query "LoadBalancerDescriptions[?VPCId=='$VPC_ID'].LoadBalancerName" --output text 2>/dev/null || echo "")
            for CLB_NAME in $CLBS; do
                if [ -n "$CLB_NAME" ] && [ "$CLB_NAME" != "None" ]; then
                    echo "       Classic LB 삭제: $CLB_NAME"
                    aws elb delete-load-balancer --load-balancer-name "$CLB_NAME" --region $REGION 2>/dev/null || true
                fi
            done
            sleep 5
            
            # 2. Network Interfaces (ENI) 강제 삭제
            echo "     [2/10] Network Interfaces 강제 삭제 중..."
            ENIS=$(aws ec2 describe-network-interfaces --filters "Name=vpc-id,Values=$VPC_ID" --query 'NetworkInterfaces[?Status!=`deleted`].NetworkInterfaceId' --output text --region $REGION 2>/dev/null || echo "")
            for ENI_ID in $ENIS; do
                if [ -n "$ENI_ID" ] && [ "$ENI_ID" != "None" ]; then
                    echo "       ENI 삭제 시도: $ENI_ID"
                    # Attachment 해제
                    ATTACHMENT_ID=$(aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID --region $REGION --query 'NetworkInterfaces[0].Attachment.AttachmentId' --output text 2>/dev/null || echo "")
                    if [ -n "$ATTACHMENT_ID" ] && [ "$ATTACHMENT_ID" != "None" ] && [ "$ATTACHMENT_ID" != "null" ]; then
                        echo "         Attachment 해제: $ATTACHMENT_ID"
                        aws ec2 detach-network-interface --attachment-id $ATTACHMENT_ID --force --region $REGION 2>/dev/null || true
                        sleep 1
                    fi
                    # ENI 삭제
                    aws ec2 delete-network-interface --network-interface-id $ENI_ID --region $REGION 2>/dev/null || echo "         ⚠️  ENI 삭제 실패 (의존성 있음)"
                fi
            done
            sleep 3
            
            # 3. NAT Gateways 삭제
            echo "     [3/10] NAT Gateways 삭제 중..."
            NAT_GATEWAYS=$(aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$VPC_ID" --query 'NatGateways[?State==`available` || State==`pending`].NatGatewayId' --output text --region $REGION 2>/dev/null || echo "")
            for NAT_ID in $NAT_GATEWAYS; do
                if [ -n "$NAT_ID" ] && [ "$NAT_ID" != "None" ]; then
                    echo "       NAT Gateway 삭제: $NAT_ID"
                    aws ec2 delete-nat-gateway --nat-gateway-id $NAT_ID --region $REGION 2>/dev/null || true
                fi
            done
            
            # NAT Gateway 삭제 대기 (최대 10분)
            if [ -n "$NAT_GATEWAYS" ]; then
                echo "       NAT Gateway 삭제 대기 중... (최대 10분)"
                for i in {1..120}; do
                    REMAINING=$(aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$VPC_ID" --query 'NatGateways[?State==`available` || State==`pending` || State==`deleting`].NatGatewayId' --output text --region $REGION 2>/dev/null || echo "")
                    if [ -z "$REMAINING" ] || [ "$REMAINING" = "None" ]; then
                        echo "       ✅ 모든 NAT Gateway 삭제 완료"
                        break
                    fi
                    if [ $i -eq 120 ]; then
                        echo "       ⚠️  일부 NAT Gateway가 아직 삭제 중입니다. 계속 진행합니다."
                    elif [ $((i % 12)) -eq 0 ]; then
                        echo "       대기 중... ($i/120)"
                    fi
                    sleep 5
                done
            fi
            
            # 4. Elastic IPs 강제 해제
            echo "     [4/10] Elastic IPs 강제 해제 중..."
            ALL_EIPS=$(aws ec2 describe-addresses --filters "Name=domain,Values=vpc" --region $REGION --query 'Addresses[].AllocationId' --output text 2>/dev/null || echo "")
            for EIP_ID in $ALL_EIPS; do
                if [ -n "$EIP_ID" ] && [ "$EIP_ID" != "None" ]; then
                    # Association 정보 확인
                    ASSOC_ID=$(aws ec2 describe-addresses --allocation-ids $EIP_ID --region $REGION --query 'Addresses[0].AssociationId' --output text 2>/dev/null || echo "")
                    NETWORK_INTERFACE_ID=$(aws ec2 describe-addresses --allocation-ids $EIP_ID --region $REGION --query 'Addresses[0].NetworkInterfaceId' --output text 2>/dev/null || echo "")
                    
                    if [ -n "$ASSOC_ID" ] && [ "$ASSOC_ID" != "None" ] && [ "$ASSOC_ID" != "null" ]; then
                        echo "       Elastic IP Association 해제: $EIP_ID"
                        aws ec2 disassociate-address --association-id $ASSOC_ID --region $REGION 2>/dev/null || true
                        sleep 1
                    fi
                    if [ -n "$NETWORK_INTERFACE_ID" ] && [ "$NETWORK_INTERFACE_ID" != "None" ] && [ "$NETWORK_INTERFACE_ID" != "null" ]; then
                        echo "       Elastic IP NetworkInterface 해제: $EIP_ID"
                        aws ec2 disassociate-address --allocation-id $EIP_ID --region $REGION 2>/dev/null || true
                        sleep 1
                    fi
                    echo "       Elastic IP 해제: $EIP_ID"
                    aws ec2 release-address --allocation-id $EIP_ID --region $REGION 2>/dev/null || true
                fi
            done
            sleep 2
            
            # 5. Internet Gateways 강제 분리 및 삭제
            echo "     [5/10] Internet Gateways 강제 분리 및 삭제 중..."
            IGW_ID=$(aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$VPC_ID" --query 'InternetGateways[0].InternetGatewayId' --output text --region $REGION 2>/dev/null || echo "")
            if [ -n "$IGW_ID" ] && [ "$IGW_ID" != "None" ]; then
                echo "       Internet Gateway 분리: $IGW_ID"
                # 여러 번 시도
                for attempt in {1..5}; do
                    aws ec2 detach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID --region $REGION 2>/dev/null && break || sleep 2
                done
                sleep 3
                echo "       Internet Gateway 삭제: $IGW_ID"
                aws ec2 delete-internet-gateway --internet-gateway-id $IGW_ID --region $REGION 2>/dev/null || true
            fi
            
            # 6. Route Table Associations 강제 해제
            echo "     [6/10] Route Table Associations 강제 해제 중..."
            ROUTE_TABLES=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" --query 'RouteTables[].RouteTableId' --output text --region $REGION 2>/dev/null || echo "")
            for RT_ID in $ROUTE_TABLES; do
                if [ -n "$RT_ID" ] && [ "$RT_ID" != "None" ]; then
                    ASSOCIATIONS=$(aws ec2 describe-route-tables --route-table-ids $RT_ID --region $REGION --query 'RouteTables[0].Associations[?Main==`false`].RouteTableAssociationId' --output text 2>/dev/null || echo "")
                    for ASSOC_ID in $ASSOCIATIONS; do
                        if [ -n "$ASSOC_ID" ] && [ "$ASSOC_ID" != "None" ] && [ "$ASSOC_ID" != "null" ]; then
                            echo "       Route Table Association 해제: $ASSOC_ID"
                            aws ec2 disassociate-route-table --association-id $ASSOC_ID --region $REGION 2>/dev/null || true
                        fi
                    done
                fi
            done
            sleep 2
            
            # 7. Subnets 강제 삭제 (재시도 포함)
            echo "     [7/10] Subnets 강제 삭제 중..."
            SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[].SubnetId' --output text --region $REGION 2>/dev/null || echo "")
            for SUBNET_ID in $SUBNETS; do
                if [ -n "$SUBNET_ID" ] && [ "$SUBNET_ID" != "None" ]; then
                    echo "       Subnet 삭제 시도: $SUBNET_ID"
                    # 여러 번 시도
                    for attempt in {1..3}; do
                        aws ec2 delete-subnet --subnet-id $SUBNET_ID --region $REGION 2>/dev/null && break || sleep 2
                    done
                fi
            done
            sleep 2
            
            # 8. Route Tables 강제 삭제 (메인 제외)
            echo "     [8/10] Route Tables 강제 삭제 중..."
            for RT_ID in $ROUTE_TABLES; do
                if [ -n "$RT_ID" ] && [ "$RT_ID" != "None" ]; then
                    IS_MAIN=$(aws ec2 describe-route-tables --route-table-ids $RT_ID --region $REGION --query 'RouteTables[0].Associations[?Main==`true`]' --output text 2>/dev/null || echo "")
                    if [ -z "$IS_MAIN" ] || [ "$IS_MAIN" = "None" ]; then
                        echo "       Route Table 삭제: $RT_ID"
                        aws ec2 delete-route-table --route-table-id $RT_ID --region $REGION 2>/dev/null || true
                    fi
                fi
            done
            sleep 2
            
            # 9. Security Groups 강제 삭제 (Rules 먼저 제거)
            echo "     [9/10] Security Groups 강제 삭제 중..."
            SGS=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[?GroupName!=`default`].GroupId' --output text --region $REGION 2>/dev/null || echo "")
            for SG_ID in $SGS; do
                if [ -n "$SG_ID" ] && [ "$SG_ID" != "None" ] && [ "$SG_ID" != "null" ]; then
                    echo "       Security Group Rules 제거: $SG_ID"
                    # Inbound Rules 제거
                    aws ec2 revoke-security-group-ingress --group-id $SG_ID --ip-permissions "$(aws ec2 describe-security-groups --group-ids $SG_ID --region $REGION --query 'SecurityGroups[0].IpPermissions' --output json 2>/dev/null || echo '[]')" --region $REGION 2>/dev/null || true
                    # Outbound Rules 제거 (default 제외)
                    aws ec2 revoke-security-group-egress --group-id $SG_ID --ip-permissions "$(aws ec2 describe-security-groups --group-ids $SG_ID --region $REGION --query 'SecurityGroups[0].IpPermissionsEgress' --output json 2>/dev/null || echo '[]')" --region $REGION 2>/dev/null || true
                    sleep 1
                    echo "       Security Group 삭제: $SG_ID"
                    aws ec2 delete-security-group --group-id $SG_ID --region $REGION 2>/dev/null || true
                fi
            done
            sleep 2
            
            # 10. VPC 최종 삭제 (여러 번 시도)
            echo "     [10/10] VPC 최종 삭제 중..."
            for attempt in {1..5}; do
                if aws ec2 delete-vpc --vpc-id $VPC_ID --region $REGION 2>/dev/null; then
                    echo "       ✅ VPC 삭제 완료: $VPC_ID"
                    break
                else
                    if [ $attempt -lt 5 ]; then
                        echo "       ⚠️  VPC 삭제 실패 (시도 $attempt/5), 5초 후 재시도..."
                        sleep 5
                    else
                        echo "       ❌ VPC 삭제 실패: $VPC_ID (의존성 리소스가 남아있을 수 있습니다)"
                    fi
                fi
            done
        fi
    done
    echo ""

    # 10. EC2 Instances 강제 삭제 (passit 태그, EKS 포함)
    echo "📦 10. EC2 Instances 강제 삭제 중... (${REGION})"
    
    # Project 태그로 인스턴스 찾기
    INSTANCES=$(aws ec2 describe-instances \
        --filters "Name=tag:Project,Values=$PROJECT_NAME" "Name=instance-state-name,Values=running,pending,stopping,stopped" \
        --query 'Reservations[].Instances[].InstanceId' \
        --output text \
        --region $REGION 2>/dev/null || echo "")
    
    # EKS 클러스터 태그로 인스턴스 찾기
    EKS_INSTANCES=$(aws ec2 describe-instances \
        --filters "Name=tag:eks:cluster-name,Values=passit-*" "Name=instance-state-name,Values=running,pending,stopping,stopped" \
        --query 'Reservations[].Instances[].InstanceId' \
        --output text \
        --region $REGION 2>/dev/null || echo "")
    
    # kubernetes.io/cluster 태그로 인스턴스 찾기
    K8S_INSTANCES=$(aws ec2 describe-instances \
        --filters "Name=tag-key,Values=kubernetes.io/cluster/passit-*" "Name=instance-state-name,Values=running,pending,stopping,stopped" \
        --query 'Reservations[].Instances[].InstanceId' \
        --output text \
        --region $REGION 2>/dev/null || echo "")
    
    # 모든 인스턴스 ID 합치기 (중복 제거)
    ALL_INSTANCES=$(echo "$INSTANCES $EKS_INSTANCES $K8S_INSTANCES" | tr ' ' '\n' | sort -u | tr '\n' ' ')
    
    for INSTANCE_ID in $ALL_INSTANCES; do
        if [ -n "$INSTANCE_ID" ] && [ "$INSTANCE_ID" != "None" ]; then
            echo "   EC2 Instance 강제 종료: $INSTANCE_ID"
            # 강제 종료 (terminate)
            aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $REGION 2>/dev/null || true
        fi
    done
    
    # 인스턴스 종료 대기 (최대 2분)
    if [ -n "$ALL_INSTANCES" ]; then
        echo "   EC2 Instances 종료 대기 중... (최대 2분)"
        for i in {1..24}; do
            REMAINING=$(aws ec2 describe-instances \
                --instance-ids $(echo $ALL_INSTANCES | tr ' ' ',') \
                --filters "Name=instance-state-name,Values=running,pending,stopping" \
                --query 'Reservations[].Instances[].InstanceId' \
                --output text \
                --region $REGION 2>/dev/null || echo "")
            if [ -z "$REMAINING" ] || [ "$REMAINING" = "None" ]; then
                echo "   ✅ 모든 EC2 Instances 종료 완료"
                break
            fi
            if [ $i -eq 24 ]; then
                echo "   ⚠️  일부 EC2 Instances가 아직 종료 중입니다."
            elif [ $((i % 6)) -eq 0 ]; then
                echo "   대기 중... ($i/24)"
            fi
            sleep 5
        done
    fi
    echo ""

    # 11. Load Balancers (passit 태그)
    echo "📦 11. Load Balancers 삭제 중... (${REGION})"
    ALBS=$(aws elbv2 describe-load-balancers --region $REGION --query "LoadBalancers[?contains(LoadBalancerName, 'passit')].LoadBalancerArn" --output text 2>/dev/null || echo "")
    for ALB_ARN in $ALBS; do
        if [ -n "$ALB_ARN" ] && [ "$ALB_ARN" != "None" ]; then
            echo "   ALB 발견: $ALB_ARN"
            aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN --region $REGION 2>/dev/null || true
        fi
    done
    echo ""

    # 12. KMS Keys (passit 태그)
    echo "📦 12. KMS Keys 삭제 중... (${REGION})"
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
}

# 각 리전별로 리소스 삭제
for REGION in "${REGIONS[@]}"; do
    delete_resources_by_region "$REGION"
done

# 글로벌 리소스 삭제 (리전 무관)

# S3 Buckets (passit로 시작하는 모든 버킷)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}글로벌 리소스 삭제${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📦 S3 Buckets 삭제 중..."
BUCKETS=$(aws s3api list-buckets --query "Buckets[?starts_with(Name, 'passit')].Name" --output text 2>/dev/null || echo "")
for BUCKET_NAME in $BUCKETS; do
    echo "   S3 Bucket 발견: $BUCKET_NAME"
    # 버킷 위치 확인
    BUCKET_REGION=$(aws s3api get-bucket-location --bucket $BUCKET_NAME --query 'LocationConstraint' --output text 2>/dev/null || echo "us-east-1")
    if [ "$BUCKET_REGION" = "None" ] || [ -z "$BUCKET_REGION" ]; then
        BUCKET_REGION="us-east-1"
    fi
    echo "     버킷 비우는 중... (리전: $BUCKET_REGION)"
    aws s3 rm s3://$BUCKET_NAME --recursive 2>/dev/null || true
    echo "     버킷 삭제 중..."
    aws s3api delete-bucket --bucket $BUCKET_NAME --region $BUCKET_REGION 2>/dev/null || \
    aws s3api delete-bucket --bucket $BUCKET_NAME 2>/dev/null || true
done
echo ""

# IAM Roles (passit로 시작하는 모든 역할)
echo "📦 IAM Roles 삭제 중..."
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

# IAM Policies (passit로 시작하는 모든 정책)
echo "📦 IAM Policies 삭제 중..."
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

# CloudFront Distributions (passit 관련)
echo "📦 CloudFront Distributions 삭제 중..."
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

# 최종 정리: 남은 리소스 강제 삭제
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}최종 정리: 남은 리소스 강제 삭제${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

for REGION in "${REGIONS[@]}"; do
    echo -e "${BLUE}리전 ${REGION} 남은 리소스 정리 중...${NC}"
    
    # 남은 NAT Gateways 강제 삭제
    REMAINING_NAT=$(aws ec2 describe-nat-gateways --region $REGION --query 'NatGateways[?State==`available` || State==`pending`].NatGatewayId' --output text 2>/dev/null || echo "")
    if [ -n "$REMAINING_NAT" ]; then
        echo "  남은 NAT Gateway 삭제 중..."
        for NAT_ID in $REMAINING_NAT; do
            aws ec2 delete-nat-gateway --nat-gateway-id $NAT_ID --region $REGION 2>/dev/null || true
        done
    fi
    
    # 남은 Elastic IPs 강제 해제
    REMAINING_EIPS=$(aws ec2 describe-addresses --filters "Name=domain,Values=vpc" --region $REGION --query 'Addresses[].AllocationId' --output text 2>/dev/null || echo "")
    if [ -n "$REMAINING_EIPS" ]; then
        echo "  남은 Elastic IP 해제 중..."
        for EIP_ID in $REMAINING_EIPS; do
            ASSOC_ID=$(aws ec2 describe-addresses --allocation-ids $EIP_ID --region $REGION --query 'Addresses[0].AssociationId' --output text 2>/dev/null || echo "")
            if [ -n "$ASSOC_ID" ] && [ "$ASSOC_ID" != "None" ] && [ "$ASSOC_ID" != "null" ]; then
                aws ec2 disassociate-address --association-id $ASSOC_ID --region $REGION 2>/dev/null || true
            fi
            aws ec2 release-address --allocation-id $EIP_ID --region $REGION 2>/dev/null || true
        done
    fi
    
    # 남은 Network Interfaces 강제 삭제
    REMAINING_ENIS=$(aws ec2 describe-network-interfaces --region $REGION --query 'NetworkInterfaces[?Status!=`deleted` && Status!=`available`].NetworkInterfaceId' --output text 2>/dev/null || echo "")
    if [ -n "$REMAINING_ENIS" ]; then
        echo "  남은 Network Interfaces 삭제 중..."
        for ENI_ID in $REMAINING_ENIS; do
            ATTACHMENT_ID=$(aws ec2 describe-network-interfaces --network-interface-ids $ENI_ID --region $REGION --query 'NetworkInterfaces[0].Attachment.AttachmentId' --output text 2>/dev/null || echo "")
            if [ -n "$ATTACHMENT_ID" ] && [ "$ATTACHMENT_ID" != "None" ] && [ "$ATTACHMENT_ID" != "null" ]; then
                aws ec2 detach-network-interface --attachment-id $ATTACHMENT_ID --force --region $REGION 2>/dev/null || true
            fi
            aws ec2 delete-network-interface --network-interface-id $ENI_ID --region $REGION 2>/dev/null || true
        done
    fi
    
    # 남은 Load Balancers 강제 삭제
    REMAINING_ALBS=$(aws elbv2 describe-load-balancers --region $REGION --query "LoadBalancers[?contains(LoadBalancerName, 'passit')].LoadBalancerArn" --output text 2>/dev/null || echo "")
    if [ -n "$REMAINING_ALBS" ]; then
        echo "  남은 Load Balancers 삭제 중..."
        for ALB_ARN in $REMAINING_ALBS; do
            aws elbv2 delete-load-balancer --load-balancer-arn $ALB_ARN --region $REGION 2>/dev/null || true
        done
    fi
    
    # 남은 EC2 Instances 강제 종료
    REMAINING_INSTANCES=$(aws ec2 describe-instances \
        --filters "Name=tag:Project,Values=$PROJECT_NAME" "Name=instance-state-name,Values=running,pending,stopping,stopped" \
        --query 'Reservations[].Instances[].InstanceId' \
        --output text \
        --region $REGION 2>/dev/null || echo "")
    EKS_REMAINING=$(aws ec2 describe-instances \
        --filters "Name=tag:eks:cluster-name,Values=passit-*" "Name=instance-state-name,Values=running,pending,stopping,stopped" \
        --query 'Reservations[].Instances[].InstanceId' \
        --output text \
        --region $REGION 2>/dev/null || echo "")
    ALL_REMAINING_INSTANCES=$(echo "$REMAINING_INSTANCES $EKS_REMAINING" | tr ' ' '\n' | sort -u | tr '\n' ' ')
    if [ -n "$ALL_REMAINING_INSTANCES" ]; then
        echo "  남은 EC2 Instances 강제 종료 중..."
        for INSTANCE_ID in $ALL_REMAINING_INSTANCES; do
            if [ -n "$INSTANCE_ID" ] && [ "$INSTANCE_ID" != "None" ]; then
                echo "    Instance 강제 종료: $INSTANCE_ID"
                aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $REGION 2>/dev/null || true
            fi
        done
    fi
    
    # 남은 Auto Scaling Groups 강제 삭제
    REMAINING_ASGS=$(aws autoscaling describe-auto-scaling-groups \
        --region $REGION \
        --query "AutoScalingGroups[?contains(AutoScalingGroupName, 'passit') || contains(AutoScalingGroupName, 'eks')].AutoScalingGroupName" \
        --output text 2>/dev/null || echo "")
    if [ -n "$REMAINING_ASGS" ]; then
        echo "  남은 Auto Scaling Groups 강제 삭제 중..."
        for ASG_NAME in $REMAINING_ASGS; do
            if [ -n "$ASG_NAME" ] && [ "$ASG_NAME" != "None" ]; then
                echo "    ASG 강제 삭제: $ASG_NAME"
                aws autoscaling update-auto-scaling-group --auto-scaling-group-name "$ASG_NAME" --min-size 0 --max-size 0 --desired-capacity 0 --region $REGION 2>/dev/null || true
                sleep 2
                aws autoscaling delete-auto-scaling-group --auto-scaling-group-name "$ASG_NAME" --force-delete --region $REGION 2>/dev/null || true
            fi
        done
    fi
    
    # 남은 SNS Topics 및 Subscriptions 강제 삭제
    REMAINING_TOPICS=$(aws sns list-topics --region $REGION --query "Topics[?contains(TopicArn, 'passit')].TopicArn" --output text 2>/dev/null || echo "")
    if [ -n "$REMAINING_TOPICS" ]; then
        echo "  남은 SNS Topics 강제 삭제 중..."
        for TOPIC_ARN in $REMAINING_TOPICS; do
            if [ -n "$TOPIC_ARN" ] && [ "$TOPIC_ARN" != "None" ]; then
                # Subscriptions 먼저 삭제
                SUBSCRIPTIONS=$(aws sns list-subscriptions-by-topic --topic-arn "$TOPIC_ARN" --region $REGION --query 'Subscriptions[].SubscriptionArn' --output text 2>/dev/null || echo "")
                for SUB_ARN in $SUBSCRIPTIONS; do
                    if [ -n "$SUB_ARN" ] && [ "$SUB_ARN" != "None" ] && [ "$SUB_ARN" != "PendingConfirmation" ]; then
                        aws sns unsubscribe --subscription-arn "$SUB_ARN" --region $REGION 2>/dev/null || true
                    fi
                done
                sleep 1
                aws sns delete-topic --topic-arn "$TOPIC_ARN" --region $REGION 2>/dev/null || true
            fi
        done
    fi
    
    # 남은 SQS Queues 강제 삭제
    REMAINING_QUEUES=$(aws sqs list-queues --region $REGION --query "QueueUrls[?contains(@, 'passit')]" --output text 2>/dev/null || echo "")
    if [ -n "$REMAINING_QUEUES" ]; then
        echo "  남은 SQS Queues 강제 삭제 중..."
        for QUEUE_URL in $REMAINING_QUEUES; do
            if [ -n "$QUEUE_URL" ] && [ "$QUEUE_URL" != "None" ]; then
                echo "    Queue 강제 삭제: $QUEUE_URL"
                aws sqs delete-queue --queue-url "$QUEUE_URL" --region $REGION 2>/dev/null || true
            fi
        done
    fi
    
    # 남은 Subnets 강제 삭제
    VPCS=$(aws ec2 describe-vpcs --filters "Name=tag:Project,Values=$PROJECT_NAME" --query 'Vpcs[].VpcId' --output text --region $REGION 2>/dev/null || echo "")
    if [ -z "$VPCS" ]; then
        VPCS=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=passit-*" --query 'Vpcs[].VpcId' --output text --region $REGION 2>/dev/null || echo "")
    fi
    for VPC_ID in $VPCS; do
        if [ -n "$VPC_ID" ] && [ "$VPC_ID" != "None" ]; then
            REMAINING_SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[].SubnetId' --output text --region $REGION 2>/dev/null || echo "")
            if [ -n "$REMAINING_SUBNETS" ]; then
                echo "  VPC $VPC_ID의 남은 Subnets 삭제 중..."
                for SUBNET_ID in $REMAINING_SUBNETS; do
                    aws ec2 delete-subnet --subnet-id $SUBNET_ID --region $REGION 2>/dev/null || true
                done
            fi
        fi
    done
    
    echo ""
done

echo -e "${GREEN}✅ Passit 관련 모든 리소스 삭제 완료!${NC}"
echo ""
echo -e "${YELLOW}📝 참고:${NC}"
echo "  - 일부 리소스는 의존성 때문에 즉시 삭제되지 않을 수 있습니다"
echo "  - AWS Console에서 남은 리소스를 확인하세요"
echo "  - EKS Cluster와 RDS는 삭제에 시간이 걸릴 수 있습니다 (최대 15-30분)"
echo "  - KMS Keys는 7일 후 완전 삭제됩니다"
echo "  - NAT Gateway는 삭제에 최대 10분이 걸릴 수 있습니다"
echo ""
echo -e "${BLUE}남은 리소스 확인:${NC}"
for REGION in "${REGIONS[@]}"; do
    echo "  리전 ${REGION}:"
    echo "    aws resourcegroupstaggingapi get-resources --tag-filters Key=Project,Values=$PROJECT_NAME --region $REGION"
    echo "    aws ec2 describe-vpcs --filters \"Name=tag:Project,Values=$PROJECT_NAME\" --region $REGION"
    echo "    aws ec2 describe-nat-gateways --region $REGION"
    echo "    aws ec2 describe-addresses --filters \"Name=domain,Values=vpc\" --region $REGION"
done
