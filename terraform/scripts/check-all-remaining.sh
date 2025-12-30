#!/bin/bash

# 모든 남아있는 리소스 확인 스크립트 (태그 무관)

ENVIRONMENT=${1:-dev}
PROJECT_NAME="passit"
REGION="ap-northeast-2"
ACCOUNT_ID="727646470302"

echo "=========================================="
echo "🔍 모든 남아있는 리소스 확인 (태그 무관)"
echo "Environment: ${ENVIRONMENT}"
echo "=========================================="
echo ""

# ============================================
# 1. 모든 Prometheus Workspace 확인
# ============================================
echo "📦 1. 모든 Prometheus (AMP) Workspace 확인"
echo "----------------------------------------"
aws amp list-workspaces --region "$REGION" --output json 2>/dev/null | \
  jq -r '.workspaces[] | "  - \(.alias // "N/A") (ID: \(.workspaceId), Status: \(.status.statusCode))"' || \
  echo "  ⚠️  확인 실패 또는 없음"
echo ""

# ============================================
# 2. 모든 Grafana Workspace 확인
# ============================================
echo "📦 2. 모든 Grafana Workspace 확인"
echo "----------------------------------------"
aws grafana list-workspaces --region "$REGION" --output json 2>/dev/null | \
  jq -r '.workspaces[] | "  - \(.name // "N/A") (ID: \(.id), Status: \(.status))"' || \
  echo "  ⚠️  확인 실패 또는 없음"
echo ""

# ============================================
# 3. 모든 VPC 확인
# ============================================
echo "📦 3. 모든 VPC 확인"
echo "----------------------------------------"
aws ec2 describe-vpcs --region "$REGION" --output json 2>/dev/null | \
  jq -r '.Vpcs[] | "  - \(.Tags[]? | select(.Key=="Name") | .Value // "N/A") (ID: \(.VpcId), CIDR: \(.CidrBlock))"' || \
  echo "  ⚠️  확인 실패 또는 없음"
echo ""

# ============================================
# 4. 모든 Subnet 확인
# ============================================
echo "📦 4. 모든 Subnet 확인"
echo "----------------------------------------"
SUBNET_COUNT=$(aws ec2 describe-subnets --region "$REGION" --output json 2>/dev/null | jq '.Subnets | length' || echo "0")
echo "  총 $SUBNET_COUNT 개의 Subnet이 있습니다"
aws ec2 describe-subnets --region "$REGION" --output json 2>/dev/null | \
  jq -r '.Subnets[] | "    - \(.Tags[]? | select(.Key=="Name") | .Value // "N/A") (ID: \(.SubnetId), CIDR: \(.CidrBlock))"' | head -10 || \
  echo "  ⚠️  확인 실패"
if [ "$SUBNET_COUNT" -gt 10 ]; then
  echo "    ... (더 많은 Subnet이 있습니다)"
fi
echo ""

# ============================================
# 5. 모든 Internet Gateway 확인
# ============================================
echo "📦 5. 모든 Internet Gateway 확인"
echo "----------------------------------------"
aws ec2 describe-internet-gateways --region "$REGION" --output json 2>/dev/null | \
  jq -r '.InternetGateways[] | "  - \(.Tags[]? | select(.Key=="Name") | .Value // "N/A") (ID: \(.InternetGatewayId), State: \(.Attachments[0].State // "detached"))"' || \
  echo "  ⚠️  확인 실패 또는 없음"
echo ""

# ============================================
# 6. 모든 NAT Gateway 확인
# ============================================
echo "📦 6. 모든 NAT Gateway 확인"
echo "----------------------------------------"
aws ec2 describe-nat-gateways --region "$REGION" --output json 2>/dev/null | \
  jq -r '.NatGateways[] | "  - \(.Tags[]? | select(.Key=="Name") | .Value // "N/A") (ID: \(.NatGatewayId), State: \(.State))"' || \
  echo "  ⚠️  확인 실패 또는 없음"
echo ""

# ============================================
# 7. 모든 Elastic IP 확인
# ============================================
echo "📦 7. 모든 Elastic IP 확인"
echo "----------------------------------------"
aws ec2 describe-addresses --region "$REGION" --output json 2>/dev/null | \
  jq -r '.Addresses[] | "  - \(.Tags[]? | select(.Key=="Name") | .Value // "N/A") (ID: \(.AllocationId), IP: \(.PublicIp), Associated: \(.NetworkInterfaceId // "none"))"' || \
  echo "  ⚠️  확인 실패 또는 없음"
echo ""

# ============================================
# 8. 모든 Route Table 확인
# ============================================
echo "📦 8. 모든 Route Table 확인"
echo "----------------------------------------"
RT_COUNT=$(aws ec2 describe-route-tables --region "$REGION" --output json 2>/dev/null | jq '.RouteTables | length' || echo "0")
echo "  총 $RT_COUNT 개의 Route Table이 있습니다"
aws ec2 describe-route-tables --region "$REGION" --output json 2>/dev/null | \
  jq -r '.RouteTables[] | "    - \(.Tags[]? | select(.Key=="Name") | .Value // "N/A") (ID: \(.RouteTableId), VPC: \(.VpcId))"' | head -10 || \
  echo "  ⚠️  확인 실패"
if [ "$RT_COUNT" -gt 10 ]; then
  echo "    ... (더 많은 Route Table이 있습니다)"
fi
echo ""

# ============================================
# 9. 모든 Security Group 확인
# ============================================
echo "📦 9. 모든 Security Group 확인"
echo "----------------------------------------"
SG_COUNT=$(aws ec2 describe-security-groups --region "$REGION" --output json 2>/dev/null | jq '.SecurityGroups | length' || echo "0")
echo "  총 $SG_COUNT 개의 Security Group이 있습니다"
aws ec2 describe-security-groups --region "$REGION" --output json 2>/dev/null | \
  jq -r '.SecurityGroups[] | "    - \(.Tags[]? | select(.Key=="Name") | .Value // .GroupName) (ID: \(.GroupId), VPC: \(.VpcId))"' | head -10 || \
  echo "  ⚠️  확인 실패"
if [ "$SG_COUNT" -gt 10 ]; then
  echo "    ... (더 많은 Security Group이 있습니다)"
fi
echo ""

# ============================================
# 10. Terraform State 확인
# ============================================
echo "📦 10. Terraform State 확인"
echo "----------------------------------------"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"

if [ -d "$TERRAFORM_DIR" ]; then
    cd "$TERRAFORM_DIR"
    if terraform state list > /dev/null 2>&1; then
        STATE_COUNT=$(terraform state list 2>/dev/null | wc -l | tr -d ' ')
        echo "  Terraform State에 $STATE_COUNT 개의 리소스가 있습니다"
        echo ""
        echo "  Prometheus/AMP 관련:"
        terraform state list 2>/dev/null | grep -iE "(prometheus|amp|grafana)" | head -10
        echo ""
        echo "  Network 관련:"
        terraform state list 2>/dev/null | grep -iE "(vpc|subnet|nat|igw|route|security)" | head -10
    else
        echo "  ⚠️  Terraform state를 찾을 수 없습니다"
    fi
else
    echo "  ⚠️  Terraform 디렉토리를 찾을 수 없습니다: $TERRAFORM_DIR"
fi
echo ""

echo "=========================================="
echo "✅ 확인 완료!"
echo "=========================================="
echo ""
echo "💡 특정 리소스 삭제 명령어:"
echo ""
echo "  # Prometheus Workspace 삭제"
echo "  aws amp delete-workspace --workspace-id <workspace-id> --region $REGION"
echo ""
echo "  # Grafana Workspace 삭제"
echo "  aws grafana delete-workspace --workspace-id <workspace-id> --region $REGION"
echo ""
echo "  # NAT Gateway 삭제"
echo "  aws ec2 delete-nat-gateway --nat-gateway-id <nat-gateway-id> --region $REGION"
echo ""
echo "  # Elastic IP 해제"
echo "  aws ec2 release-address --allocation-id <allocation-id> --region $REGION"
echo ""
echo "  # Internet Gateway 삭제 (먼저 detach 필요)"
echo "  aws ec2 detach-internet-gateway --internet-gateway-id <igw-id> --vpc-id <vpc-id> --region $REGION"
echo "  aws ec2 delete-internet-gateway --internet-gateway-id <igw-id> --region $REGION"
echo ""
echo "  # VPC 삭제 (모든 리소스 삭제 후)"
echo "  aws ec2 delete-vpc --vpc-id <vpc-id> --region $REGION"
echo ""

