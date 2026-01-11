#!/bin/bash

# Helm Values 자동 업데이트 스크립트
# Terraform output 값들을 각 서비스의 Helm values 파일에 자동으로 반영합니다.
# Terraform 실패 시 AWS CLI로 직접 리소스를 조회합니다.

set -e

ENVIRONMENT=${1:-dev}
AWS_PROFILE=${2:-motionbit}
AWS_REGION=${3:-ap-northeast-2}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"

echo "DEBUG:"
echo "SCRIPT_DIR=$SCRIPT_DIR"
echo "PROJECT_ROOT=$PROJECT_ROOT"
echo "ENVIRONMENT=$ENVIRONMENT"
echo "AWS_PROFILE=$AWS_PROFILE"
echo "AWS_REGION=$AWS_REGION"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "❌ Error: $TERRAFORM_DIR 디렉토리가 존재하지 않습니다."
    exit 1
fi

echo "=========================================="
echo "Helm Values 자동 업데이트"
echo "=========================================="
echo "Environment: ${ENVIRONMENT}"
echo "AWS Profile: ${AWS_PROFILE}"
echo "AWS Region: ${AWS_REGION}"
echo ""
echo "사용법:"
echo "  $0 [environment] [aws-profile] [aws-region]"
echo "  예: $0 prod motionbit ap-northeast-2"
echo "=========================================="
echo ""

# yq 설치 확인
if ! command -v yq &> /dev/null; then
    echo "⚠️  yq가 설치되어 있지 않습니다."
    echo "   설치 방법:"
    echo "   brew install yq  # macOS"
    echo "   또는 https://github.com/mikefarah/yq#install 참고"
    echo ""
    echo "   yq 없이도 작동하지만, YAML 파일 수정이 제한적입니다."
    echo "   계속하시겠습니까? (y/n)"
    read -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    USE_YQ=false
else
    USE_YQ=true
fi

# Terraform output 값 추출 (실패 시 AWS CLI fallback)
echo "=========================================="
echo "📋 리소스 정보 추출 중..."
echo "=========================================="
cd ${TERRAFORM_DIR}

# Output 값 추출
echo "🔍 RDS Endpoint 추출 중..."
RDS_ENDPOINT=$(terraform output -raw rds_cluster_endpoint 2>/dev/null || echo "")

# Terraform 실패 시 AWS CLI로 직접 조회
if [ -z "$RDS_ENDPOINT" ]; then
    echo "  ⚠️  Terraform output 실패. AWS CLI로 직접 조회합니다..."
    RDS_ENDPOINT=$(aws rds describe-db-clusters \
        --region $AWS_REGION \
        --profile $AWS_PROFILE \
        --query "DBClusters[?contains(DBClusterIdentifier, 'passit-${ENVIRONMENT}')].Endpoint | [0]" \
        --output text 2>/dev/null || echo "")

    if [ -n "$RDS_ENDPOINT" ] && [ "$RDS_ENDPOINT" != "None" ]; then
        echo "  ✅ AWS CLI로 RDS Endpoint 조회 성공: $RDS_ENDPOINT"
    else
        echo "  ❌ AWS CLI로도 RDS Endpoint를 찾을 수 없습니다."
    fi
fi

# Valkey Endpoint 추출 (여러 방법 시도)
echo "🔍 Valkey/Redis Endpoint 추출 중..."
VALKEY_ENDPOINT=$(terraform output -raw valkey_primary_endpoint 2>/dev/null || echo "")

if [ -z "$VALKEY_ENDPOINT" ]; then
    # raw로 안되면 일반 output으로 시도
    VALKEY_OUTPUT=$(terraform output valkey_primary_endpoint 2>/dev/null || echo "")
    if [ -n "$VALKEY_OUTPUT" ] && [ "$VALKEY_OUTPUT" != "null" ]; then
        # "valkey_primary_endpoint = " 부분 제거하고 값만 추출
        VALKEY_ENDPOINT=$(echo "$VALKEY_OUTPUT" | sed 's/.*= *"\(.*\)"/\1/' | sed 's/.*= *\(.*\)/\1/' | tr -d ' "')
    fi
fi

# Terraform 실패 시 AWS CLI로 직접 조회
if [ -z "$VALKEY_ENDPOINT" ]; then
    echo "  ⚠️  Terraform output 실패. AWS CLI로 직접 조회합니다..."

    # ElastiCache (Redis/Valkey) 조회
    VALKEY_ENDPOINT=$(aws elasticache describe-replication-groups \
        --region $AWS_REGION \
        --profile $AWS_PROFILE \
        --query "ReplicationGroups[?contains(ReplicationGroupId, 'passit-${ENVIRONMENT}')].NodeGroups[0].PrimaryEndpoint.Address | [0]" \
        --output text 2>/dev/null || echo "")

    if [ -n "$VALKEY_ENDPOINT" ] && [ "$VALKEY_ENDPOINT" != "None" ]; then
        echo "  ✅ AWS CLI로 ElastiCache Endpoint 조회 성공: $VALKEY_ENDPOINT"
    else
        # MemoryDB도 시도
        VALKEY_ENDPOINT=$(aws memorydb describe-clusters \
            --region $AWS_REGION \
            --profile $AWS_PROFILE \
            --query "Clusters[?contains(Name, 'passit-${ENVIRONMENT}')].ClusterEndpoint.Address | [0]" \
            --output text 2>/dev/null || echo "")

        if [ -n "$VALKEY_ENDPOINT" ] && [ "$VALKEY_ENDPOINT" != "None" ]; then
            echo "  ✅ AWS CLI로 MemoryDB Endpoint 조회 성공: $VALKEY_ENDPOINT"
        else
            echo "  ⚠️  Valkey/Redis endpoint를 찾을 수 없습니다. (생성되지 않았거나 생성 중일 수 있음)"
            VALKEY_ENDPOINT=""
        fi
    fi
fi

# S3 Bucket - 여러 이름 시도
echo "🔍 S3 Bucket 추출 중..."
S3_BUCKET_PROFILE=$(terraform output -raw s3_profile_bucket_id 2>/dev/null || terraform output -raw s3_uploads_bucket_id 2>/dev/null || echo "")
S3_BUCKET_TICKET=$(terraform output -raw s3_ticket_bucket_id 2>/dev/null || echo "")

# Terraform 실패 시 AWS CLI로 직접 조회
if [ -z "$S3_BUCKET_PROFILE" ]; then
    echo "  ⚠️  Terraform output 실패. AWS CLI로 S3 Bucket 조회합니다..."
    S3_BUCKET_PROFILE=$(aws s3api list-buckets \
        --profile $AWS_PROFILE \
        --query "Buckets[?contains(Name, 'passit-${ENVIRONMENT}-profile') || contains(Name, 'passit-${ENVIRONMENT}-uploads')].Name | [0]" \
        --output text 2>/dev/null || echo "")

    if [ -n "$S3_BUCKET_PROFILE" ] && [ "$S3_BUCKET_PROFILE" != "None" ]; then
        echo "  ✅ AWS CLI로 Profile S3 Bucket 조회 성공: $S3_BUCKET_PROFILE"
    fi
fi

if [ -z "$S3_BUCKET_TICKET" ]; then
    S3_BUCKET_TICKET=$(aws s3api list-buckets \
        --profile $AWS_PROFILE \
        --query "Buckets[?contains(Name, 'passit-${ENVIRONMENT}-ticket')].Name | [0]" \
        --output text 2>/dev/null || echo "")

    if [ -n "$S3_BUCKET_TICKET" ] && [ "$S3_BUCKET_TICKET" != "None" ]; then
        echo "  ✅ AWS CLI로 Ticket S3 Bucket 조회 성공: $S3_BUCKET_TICKET"
    fi
fi

# IRSA Role ARN 추출 (jq 없이도 작동하도록)
echo "  🔍 IRSA Role ARN 추출 중..."

# terraform output에 타임아웃 설정 (10초)
IRSA_OUTPUT_RAW=""
IRSA_OUTPUT_ERROR=1

# timeout 명령어가 있으면 사용
if command -v timeout &> /dev/null || command -v gtimeout &> /dev/null; then
    TIMEOUT_CMD=$(command -v timeout 2>/dev/null || command -v gtimeout 2>/dev/null)
    echo "  ⏱️  타임아웃 10초로 terraform output 실행 중..."
    IRSA_OUTPUT_RAW=$($TIMEOUT_CMD 10 terraform output backend_irsa_roles 2>&1)
    IRSA_OUTPUT_ERROR=$?
    
    # 타임아웃 체크
    if [ $IRSA_OUTPUT_ERROR -eq 124 ] || echo "$IRSA_OUTPUT_RAW" | grep -q "timeout\|terminated"; then
        echo "  ⚠️  terraform output이 타임아웃되었습니다 (10초 초과)."
        IRSA_OUTPUT_ERROR=1
        IRSA_OUTPUT_RAW=""
    fi
else
    # timeout이 없으면 빠르게 실패하도록 시도 (5초 대기 후 건너뛰기)
    echo "  ⚠️  timeout 명령어가 없습니다. 빠른 체크만 수행합니다..."
    echo "  💡 IRSA Role은 나중에 수동으로 추가하세요."
    echo "     cd terraform/envs/${ENVIRONMENT} && terraform output backend_irsa_roles"
    echo ""
    IRSA_ACCOUNT=""
    IRSA_TICKET=""
    IRSA_TRADE=""
    IRSA_CS=""
    IRSA_CHAT=""
    IRSA_OUTPUT_ERROR=1
fi

# output이 없거나 에러가 있으면 AWS CLI로 조회
if [ $IRSA_OUTPUT_ERROR -ne 0 ] || [ -z "$IRSA_OUTPUT_RAW" ] || echo "$IRSA_OUTPUT_RAW" | grep -q "Error\|No outputs"; then
    echo "  ⚠️  terraform output이 실패했습니다. AWS CLI로 IAM Role 조회합니다..."

    # AWS CLI로 IRSA Role 조회
    IRSA_ACCOUNT=$(aws iam list-roles \
        --profile $AWS_PROFILE \
        --query "Roles[?contains(RoleName, 'passit-account-${ENVIRONMENT}')].Arn | [0]" \
        --output text 2>/dev/null || echo "")

    IRSA_TICKET=$(aws iam list-roles \
        --profile $AWS_PROFILE \
        --query "Roles[?contains(RoleName, 'passit-ticket-${ENVIRONMENT}')].Arn | [0]" \
        --output text 2>/dev/null || echo "")

    IRSA_TRADE=$(aws iam list-roles \
        --profile $AWS_PROFILE \
        --query "Roles[?contains(RoleName, 'passit-trade-${ENVIRONMENT}')].Arn | [0]" \
        --output text 2>/dev/null || echo "")

    IRSA_CS=$(aws iam list-roles \
        --profile $AWS_PROFILE \
        --query "Roles[?contains(RoleName, 'passit-cs-${ENVIRONMENT}')].Arn | [0]" \
        --output text 2>/dev/null || echo "")

    IRSA_CHAT=$(aws iam list-roles \
        --profile $AWS_PROFILE \
        --query "Roles[?contains(RoleName, 'passit-chat-${ENVIRONMENT}')].Arn | [0]" \
        --output text 2>/dev/null || echo "")

    # None을 빈 문자열로 변환
    [ "$IRSA_ACCOUNT" = "None" ] && IRSA_ACCOUNT=""
    [ "$IRSA_TICKET" = "None" ] && IRSA_TICKET=""
    [ "$IRSA_TRADE" = "None" ] && IRSA_TRADE=""
    [ "$IRSA_CS" = "None" ] && IRSA_CS=""
    [ "$IRSA_CHAT" = "None" ] && IRSA_CHAT=""

    if [ -n "$IRSA_ACCOUNT" ] || [ -n "$IRSA_TICKET" ] || [ -n "$IRSA_TRADE" ] || [ -n "$IRSA_CS" ] || [ -n "$IRSA_CHAT" ]; then
        echo "  ✅ AWS CLI로 IRSA Role 조회 완료"
    else
        echo "  ⚠️  IRSA Role을 찾을 수 없습니다. 나중에 수동으로 추가하세요."
    fi
elif command -v jq &> /dev/null; then
    # jq가 있으면 사용
    echo "  ✅ jq를 사용하여 IRSA 값 추출"
    IRSA_JSON=$(terraform output -json backend_irsa_roles 2>/dev/null || echo "{}")
    IRSA_ACCOUNT=$(echo "$IRSA_JSON" | jq -r '.value.account // empty' 2>/dev/null || echo "")
    IRSA_TICKET=$(echo "$IRSA_JSON" | jq -r '.value.ticket // empty' 2>/dev/null || echo "")
    IRSA_TRADE=$(echo "$IRSA_JSON" | jq -r '.value.trade // empty' 2>/dev/null || echo "")
    IRSA_CS=$(echo "$IRSA_JSON" | jq -r '.value.cs // empty' 2>/dev/null || echo "")
    IRSA_CHAT=$(echo "$IRSA_JSON" | jq -r '.value.chat // empty' 2>/dev/null || echo "")
else
    # jq가 없으면 terraform output을 텍스트로 파싱
    echo "  ⚠️  jq가 없어서 텍스트 파싱으로 IRSA 값 추출 시도..."
    
    # 디버깅: 실제 output 형식 확인
    echo "  📋 backend_irsa_roles output (디버깅용):"
    echo "$IRSA_OUTPUT_RAW" | head -10
    
    # account 추출 (다양한 패턴 시도)
    IRSA_ACCOUNT=$(echo "$IRSA_OUTPUT_RAW" | grep -i 'account' | grep -o 'arn:aws:iam::[0-9]*:role/[^",}]*' | head -1 || echo "")
    if [ -z "$IRSA_ACCOUNT" ]; then
        # "account" = "arn:..." 형식
        IRSA_ACCOUNT=$(echo "$IRSA_OUTPUT_RAW" | sed -n 's/.*"account"[[:space:]]*=[[:space:]]*"\(arn:aws:iam::[^"]*\)".*/\1/p' | head -1 || echo "")
    fi
    if [ -z "$IRSA_ACCOUNT" ]; then
        # account = "arn:..." 형식 (따옴표 없음)
        IRSA_ACCOUNT=$(echo "$IRSA_OUTPUT_RAW" | sed -n 's/.*account[[:space:]]*=[[:space:]]*\(arn:aws:iam::[^",}]*\).*/\1/p' | head -1 || echo "")
    fi
    
    # ticket 추출
    IRSA_TICKET=$(echo "$IRSA_OUTPUT_RAW" | grep -i 'ticket' | grep -o 'arn:aws:iam::[0-9]*:role/[^",}]*' | head -1 || echo "")
    if [ -z "$IRSA_TICKET" ]; then
        IRSA_TICKET=$(echo "$IRSA_OUTPUT_RAW" | sed -n 's/.*"ticket"[[:space:]]*=[[:space:]]*"\(arn:aws:iam::[^"]*\)".*/\1/p' | head -1 || echo "")
    fi
    if [ -z "$IRSA_TICKET" ]; then
        IRSA_TICKET=$(echo "$IRSA_OUTPUT_RAW" | sed -n 's/.*ticket[[:space:]]*=[[:space:]]*\(arn:aws:iam::[^",}]*\).*/\1/p' | head -1 || echo "")
    fi
    
    # trade 추출
    IRSA_TRADE=$(echo "$IRSA_OUTPUT_RAW" | grep -i 'trade' | grep -o 'arn:aws:iam::[0-9]*:role/[^",}]*' | head -1 || echo "")
    if [ -z "$IRSA_TRADE" ]; then
        IRSA_TRADE=$(echo "$IRSA_OUTPUT_RAW" | sed -n 's/.*"trade"[[:space:]]*=[[:space:]]*"\(arn:aws:iam::[^"]*\)".*/\1/p' | head -1 || echo "")
    fi
    if [ -z "$IRSA_TRADE" ]; then
        IRSA_TRADE=$(echo "$IRSA_OUTPUT_RAW" | sed -n 's/.*trade[[:space:]]*=[[:space:]]*\(arn:aws:iam::[^",}]*\).*/\1/p' | head -1 || echo "")
    fi
    
    # cs 추출
    IRSA_CS=$(echo "$IRSA_OUTPUT_RAW" | grep -i '"cs"' | grep -o 'arn:aws:iam::[0-9]*:role/[^",}]*' | head -1 || echo "")
    if [ -z "$IRSA_CS" ]; then
        IRSA_CS=$(echo "$IRSA_OUTPUT_RAW" | sed -n 's/.*"cs"[[:space:]]*=[[:space:]]*"\(arn:aws:iam::[^"]*\)".*/\1/p' | head -1 || echo "")
    fi
    if [ -z "$IRSA_CS" ]; then
        IRSA_CS=$(echo "$IRSA_OUTPUT_RAW" | sed -n 's/.*cs[[:space:]]*=[[:space:]]*\(arn:aws:iam::[^",}]*\).*/\1/p' | head -1 || echo "")
    fi

    # chat 추출
    IRSA_CHAT=$(echo "$IRSA_OUTPUT_RAW" | grep -i '"chat"' | grep -o 'arn:aws:iam::[0-9]*:role/[^",}]*' | head -1 || echo "")
    if [ -z "$IRSA_CHAT" ]; then
        IRSA_CHAT=$(echo "$IRSA_OUTPUT_RAW" | sed -n 's/.*"chat"[[:space:]]*=[[:space:]]*"\(arn:aws:iam::[^"]*\)".*/\1/p' | head -1 || echo "")
    fi
    if [ -z "$IRSA_CHAT" ]; then
        IRSA_CHAT=$(echo "$IRSA_OUTPUT_RAW" | sed -n 's/.*chat[[:space:]]*=[[:space:]]*\(arn:aws:iam::[^",}]*\).*/\1/p' | head -1 || echo "")
    fi
fi

# 값 확인
echo "추출된 값:"
echo "  RDS Endpoint: ${RDS_ENDPOINT:-❌ 없음}"
echo "  Valkey Endpoint: ${VALKEY_ENDPOINT:-❌ 없음}"
echo "  S3 Profile Bucket: ${S3_BUCKET_PROFILE:-❌ 없음}"
echo "  S3 Ticket Bucket: ${S3_BUCKET_TICKET:-❌ 없음}"
echo "  IRSA Account: ${IRSA_ACCOUNT:-❌ 없음}"
echo "  IRSA Ticket: ${IRSA_TICKET:-❌ 없음}"
echo "  IRSA Trade: ${IRSA_TRADE:-❌ 없음}"
echo "  IRSA CS: ${IRSA_CS:-❌ 없음}"
echo "  IRSA Chat: ${IRSA_CHAT:-❌ 없음}"
echo ""

# 필수 값 확인
if [ -z "$RDS_ENDPOINT" ]; then
    echo "❌ Error: RDS Endpoint가 없습니다."
    echo "   Terraform 또는 AWS CLI로도 RDS를 찾을 수 없습니다."
    echo "   terraform apply를 먼저 실행하거나 RDS가 생성되었는지 확인하세요."
    exit 1
fi

# Valkey는 선택적 (없어도 계속 진행)
if [ -z "$VALKEY_ENDPOINT" ]; then
    echo ""
    echo "⚠️  경고: Valkey/Redis Endpoint를 찾을 수 없습니다."
    echo "   ${ENVIRONMENT} 환경에 ElastiCache/MemoryDB가 생성되지 않았을 수 있습니다."
    echo "   Valkey 없이도 RDS, S3, IRSA는 업데이트됩니다."
    echo ""
fi

# 서비스별 업데이트 함수
update_service_values() {
    local SERVICE_NAME=$1
    local VALUES_FILE="$PROJECT_ROOT/service-${SERVICE_NAME}/helm/values-${ENVIRONMENT}.yaml"
    local VALUES_FILE_DEFAULT="$PROJECT_ROOT/service-${SERVICE_NAME}/helm/values.yaml"
    local IRSA_ROLE=$2
    local S3_BUCKET=$3
    local INGRESS_HOST=$4  # 예: account-service.passit.com
    
    # values-{env}.yaml이 없으면 values.yaml을 복사
    if [ ! -f "$VALUES_FILE" ]; then
        if [ -f "$VALUES_FILE_DEFAULT" ]; then
            echo "  📄 $VALUES_FILE 파일이 없어서 values.yaml을 복사합니다."
            cp "$VALUES_FILE_DEFAULT" "$VALUES_FILE"
        else
            echo "  ⚠️  $VALUES_FILE_DEFAULT 파일이 없습니다. 건너뜁니다."
            return
        fi
    fi
    
    echo "  📝 $SERVICE_NAME 서비스 업데이트 중..."
    
    if [ "$USE_YQ" = true ]; then
        # yq를 사용한 업데이트
        yq eval ".database.host = \"$RDS_ENDPOINT\"" -i "$VALUES_FILE"
        
        # Valkey가 있으면 업데이트
        if [ -n "$VALKEY_ENDPOINT" ]; then
            yq eval ".redis.host = \"$VALKEY_ENDPOINT\"" -i "$VALUES_FILE"
        fi
        
        if [ -n "$IRSA_ROLE" ]; then
            yq eval ".serviceAccount.annotations.\"eks.amazonaws.com/role-arn\" = \"$IRSA_ROLE\"" -i "$VALUES_FILE"
        fi
        
        if [ -n "$S3_BUCKET" ]; then
            yq eval ".s3.bucket = \"$S3_BUCKET\"" -i "$VALUES_FILE" 2>/dev/null || true
        fi
        
        # Ingress 설정 업데이트
        if [ -n "$INGRESS_HOST" ]; then
            # ingress.enabled = true
            yq eval ".ingress.enabled = true" -i "$VALUES_FILE" 2>/dev/null || true
            # ingress.className = alb
            yq eval ".ingress.className = \"alb\"" -i "$VALUES_FILE" 2>/dev/null || true
            # ingress.annotations 설정
            yq eval ".ingress.annotations.\"kubernetes.io/ingress.class\" = \"alb\"" -i "$VALUES_FILE" 2>/dev/null || true
            yq eval ".ingress.annotations.\"alb.ingress.kubernetes.io/group.name\" = \"passit-${ENVIRONMENT}-alb\"" -i "$VALUES_FILE" 2>/dev/null || true
            yq eval ".ingress.annotations.\"alb.ingress.kubernetes.io/load-balancer-name\" = \"passit-${ENVIRONMENT}-alb\"" -i "$VALUES_FILE" 2>/dev/null || true
            yq eval ".ingress.annotations.\"alb.ingress.kubernetes.io/scheme\" = \"internet-facing\"" -i "$VALUES_FILE" 2>/dev/null || true
            yq eval ".ingress.annotations.\"alb.ingress.kubernetes.io/target-type\" = \"ip\"" -i "$VALUES_FILE" 2>/dev/null || true
            # listen-ports는 JSON 배열이므로 특별 처리
            yq eval ".ingress.annotations.\"alb.ingress.kubernetes.io/listen-ports\" = \"[{\\\"HTTP\\\":80}]\"" -i "$VALUES_FILE" 2>/dev/null || true
            yq eval ".ingress.annotations.\"alb.ingress.kubernetes.io/backend-protocol\" = \"HTTP\"" -i "$VALUES_FILE" 2>/dev/null || true
            # ingress.hosts[0].host 업데이트
            yq eval ".ingress.hosts[0].host = \"$INGRESS_HOST\"" -i "$VALUES_FILE" 2>/dev/null || true
        fi
        
        echo "  ✅ $SERVICE_NAME 서비스 업데이트 완료"
    else
        # sed를 사용한 업데이트 (yq가 없는 경우)
        echo "  ⚠️  yq가 없어서 sed로 업데이트합니다. (제한적)"
        
        # database.host 업데이트
        if grep -q "^database:" "$VALUES_FILE" || grep -q "^  host:" "$VALUES_FILE"; then
            sed -i.bak "s|host:.*postgres.*|host: $RDS_ENDPOINT|g" "$VALUES_FILE"
            sed -i.bak "s|host:.*xxxxx.*|host: $RDS_ENDPOINT|g" "$VALUES_FILE"
        else
            # database 섹션이 없으면 추가
            if ! grep -q "^database:" "$VALUES_FILE"; then
                echo "" >> "$VALUES_FILE"
                echo "database:" >> "$VALUES_FILE"
                echo "  host: $RDS_ENDPOINT" >> "$VALUES_FILE"
                echo "  port: 5432" >> "$VALUES_FILE"
            fi
        fi
        
        # redis.host 업데이트 (Valkey가 있는 경우만)
        if [ -n "$VALKEY_ENDPOINT" ]; then
            sed -i.bak "s|host:.*cache.amazonaws.com.*|host: \"$VALKEY_ENDPOINT\"|g" "$VALUES_FILE"
            sed -i.bak "s|host:.*xxxxx.*|host: \"$VALKEY_ENDPOINT\"|g" "$VALUES_FILE"
        fi
        
        # Ingress 설정 업데이트 (sed 사용)
        if [ -n "$INGRESS_HOST" ]; then
            # ingress.enabled = true
            if grep -q "^ingress:" "$VALUES_FILE"; then
                sed -i.bak "s|enabled:.*false|enabled: true|g" "$VALUES_FILE"
            else
                # ingress 섹션이 없으면 추가
                echo "" >> "$VALUES_FILE"
                echo "ingress:" >> "$VALUES_FILE"
                echo "  enabled: true" >> "$VALUES_FILE"
            fi
            
            # ingress.className = alb
            if grep -q "className:" "$VALUES_FILE"; then
                sed -i.bak "s|className:.*|className: alb|g" "$VALUES_FILE"
            else
                sed -i.bak "/^ingress:/a\  className: alb" "$VALUES_FILE"
            fi
            
            # ingress.annotations 설정
            if ! grep -q "annotations:" "$VALUES_FILE" || ! grep -A 10 "ingress:" "$VALUES_FILE" | grep -q "annotations:"; then
                sed -i.bak "/^  className: alb/a\  annotations:" "$VALUES_FILE"
            fi
            
            # 각 annotation 추가/업데이트
            sed -i.bak "s|kubernetes.io/ingress.class:.*|kubernetes.io/ingress.class: alb|g" "$VALUES_FILE"
            sed -i.bak "s|alb.ingress.kubernetes.io/group.name:.*|alb.ingress.kubernetes.io/group.name: passit-${ENVIRONMENT}-alb|g" "$VALUES_FILE"
            sed -i.bak "s|alb.ingress.kubernetes.io/load-balancer-name:.*|alb.ingress.kubernetes.io/load-balancer-name: passit-${ENVIRONMENT}-alb|g" "$VALUES_FILE"
            sed -i.bak "s|alb.ingress.kubernetes.io/scheme:.*|alb.ingress.kubernetes.io/scheme: internet-facing|g" "$VALUES_FILE"
            sed -i.bak "s|alb.ingress.kubernetes.io/target-type:.*|alb.ingress.kubernetes.io/target-type: ip|g" "$VALUES_FILE"
            sed -i.bak "s|alb.ingress.kubernetes.io/listen-ports:.*|alb.ingress.kubernetes.io/listen-ports: '[{\"HTTP\":80}]'|g" "$VALUES_FILE"
            sed -i.bak "s|alb.ingress.kubernetes.io/backend-protocol:.*|alb.ingress.kubernetes.io/backend-protocol: HTTP|g" "$VALUES_FILE"
            
            # ingress.hosts[0].host 업데이트
            sed -i.bak "s|host:.*\.local|host: $INGRESS_HOST|g" "$VALUES_FILE"
            sed -i.bak "s|host:.*passit\.com|host: $INGRESS_HOST|g" "$VALUES_FILE"
        fi
        
        # 백업 파일 삭제
        rm -f "${VALUES_FILE}.bak"
        
        echo "  ✅ $SERVICE_NAME 서비스 업데이트 완료 (sed 사용)"
    fi
}

# 각 서비스 업데이트
echo "🔄 서비스 Helm Values 업데이트 중..."
echo ""

# Account Service
if [ -d "$PROJECT_ROOT/service-account/helm" ]; then
    echo "📦 Account Service"
    update_service_values "account" "$IRSA_ACCOUNT" "$S3_BUCKET_PROFILE" "account-service.passit.com"
    echo ""
fi

# Ticket Service
if [ -d "$PROJECT_ROOT/service-ticket/helm" ]; then
    echo "📦 Ticket Service"
    update_service_values "ticket" "$IRSA_TICKET" "$S3_BUCKET_TICKET" "ticket-service.passit.com"
    echo ""
fi

# Trade Service
if [ -d "$PROJECT_ROOT/service-trade/helm" ]; then
    echo "📦 Trade Service"
    update_service_values "trade" "$IRSA_TRADE" "" "trade-service.passit.com"
    echo ""
fi

# CS Service
if [ -d "$PROJECT_ROOT/service-cs/helm" ]; then
    echo "📦 CS Service"
    update_service_values "cs" "$IRSA_CS" "" "cs-service.passit.com"
    echo ""
fi

# Chat Service (있는 경우)
if [ -d "$PROJECT_ROOT/service-chat/helm" ]; then
    echo "📦 Chat Service"
    update_service_values "chat" "$IRSA_CHAT" "" "chat-service.passit.com"
    echo ""
fi

echo "=========================================="
echo "✅ Helm Values 업데이트 완료!"
echo "=========================================="
echo ""
echo "업데이트된 파일:"
find "$PROJECT_ROOT" -name "values-${ENVIRONMENT}.yaml" -type f 2>/dev/null | while read file; do
    echo "  - $file"
done
echo ""
echo "다음 단계:"
echo "1. 업데이트된 values 파일 확인"
echo "2. Git commit & push"
echo "3. ArgoCD로 배포"
echo ""

