#!/bin/bash

# Helm Values 자동 업데이트 스크립트
# Terraform output 값들을 각 서비스의 Helm values 파일에 자동으로 반영합니다.

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "❌ Error: $TERRAFORM_DIR 디렉토리가 존재하지 않습니다."
    exit 1
fi

echo "=========================================="
echo "Helm Values 자동 업데이트"
echo "=========================================="
echo "Environment: ${ENVIRONMENT}"
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

# Terraform output 값 추출
echo "📋 Terraform output 값 추출 중..."
cd ${TERRAFORM_DIR}


# Output 값 추출
RDS_ENDPOINT=$(terraform output -raw rds_cluster_endpoint 2>/dev/null || echo "")

# Valkey Endpoint 추출 (여러 방법 시도)
VALKEY_ENDPOINT=$(terraform output -raw valkey_primary_endpoint 2>/dev/null || echo "")

if [ -z "$VALKEY_ENDPOINT" ]; then
    # raw로 안되면 일반 output으로 시도
    VALKEY_OUTPUT=$(terraform output valkey_primary_endpoint 2>/dev/null || echo "")
    if [ -n "$VALKEY_OUTPUT" ] && [ "$VALKEY_OUTPUT" != "null" ]; then
        # "valkey_primary_endpoint = " 부분 제거하고 값만 추출
        VALKEY_ENDPOINT=$(echo "$VALKEY_OUTPUT" | sed 's/.*= *"\(.*\)"/\1/' | sed 's/.*= *\(.*\)/\1/' | tr -d ' "')
    fi
    
    # 여전히 없으면 건너뛰기 (state show는 오래 걸릴 수 있음)
    if [ -z "$VALKEY_ENDPOINT" ]; then
        echo "  ⚠️  Valkey endpoint를 찾을 수 없습니다. (ElastiCache가 아직 생성 중일 수 있음)"
    fi
fi

# S3 Bucket - 여러 이름 시도
S3_BUCKET_PROFILE=$(terraform output -raw s3_profile_bucket_id 2>/dev/null || terraform output -raw s3_uploads_bucket_id 2>/dev/null || echo "")
S3_BUCKET_TICKET=$(terraform output -raw s3_ticket_bucket_id 2>/dev/null || echo "")

# IRSA Role ARN 추출 (jq 없이도 작동하도록)
echo "  🔍 IRSA Role ARN 추출 중..."

# terraform output에 타임아웃 설정 (10초)
IRSA_OUTPUT_RAW=""
IRSA_OUTPUT_ERROR=1

# timeout 명령어가 있으면 사용
if command -v timeout &> /dev/null || command -v gtimeout &> /dev/null; then
    TIMEOUT_CMD=$(command -v timeout 2>/dev/null || command -v gtimeout 2>/dev/null)
    echo "  ⏱️  타임아웃 10초로 terraform output 실행 중..."
    set +e
    IRSA_OUTPUT_RAW=$($TIMEOUT_CMD 10 terraform output backend_irsa_roles 2>&1)
    IRSA_OUTPUT_ERROR=$?
    set -e
    
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
    IRSA_OUTPUT_ERROR=1
fi

# output이 없거나 에러가 있으면 건너뛰기
if [ $IRSA_OUTPUT_ERROR -ne 0 ] || [ -z "$IRSA_OUTPUT_RAW" ] || echo "$IRSA_OUTPUT_RAW" | grep -q "Error\|No outputs"; then
    echo "  ⚠️  terraform output이 실패했습니다."
    echo "  💡 IRSA Role은 나중에 수동으로 추가하세요."
    echo "     각 서비스의 values-${ENVIRONMENT}.yaml 파일에서:"
    echo "     serviceAccount:"
    echo "       annotations:"
    echo "         eks.amazonaws.com/role-arn: <IRSA_ROLE_ARN>"
    echo ""
    echo "     또는 다음 명령어로 확인:"
    echo "     cd terraform/envs/${ENVIRONMENT} && terraform output backend_irsa_roles"
    echo ""
    IRSA_ACCOUNT=""
    IRSA_TICKET=""
    IRSA_TRADE=""
    IRSA_CS=""
elif command -v jq &> /dev/null; then
    # jq가 있으면 사용
    echo "  ✅ jq를 사용하여 IRSA 값 추출"
    IRSA_JSON=$(terraform output -json backend_irsa_roles 2>/dev/null || echo "{}")
    IRSA_ACCOUNT=$(echo "$IRSA_JSON" | jq -r '.value.account // empty' 2>/dev/null || echo "")
    IRSA_TICKET=$(echo "$IRSA_JSON" | jq -r '.value.ticket // empty' 2>/dev/null || echo "")
    IRSA_TRADE=$(echo "$IRSA_JSON" | jq -r '.value.trade // empty' 2>/dev/null || echo "")
    IRSA_CS=$(echo "$IRSA_JSON" | jq -r '.value.cs // empty' 2>/dev/null || echo "")
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
echo ""

# 필수 값 확인
if [ -z "$RDS_ENDPOINT" ]; then
    echo "❌ Error: RDS Endpoint가 없습니다."
    echo "   terraform apply를 먼저 실행하세요."
    exit 1
fi

# Valkey는 선택적 (없어도 계속 진행)
if [ -z "$VALKEY_ENDPOINT" ]; then
    echo "⚠️  경고: Valkey Endpoint를 추출하지 못했습니다."
    echo ""
    echo "   가능한 원인:"
    echo "   1. ElastiCache가 아직 생성 중입니다 (생성에 10-15분 소요)"
    echo "   2. Terraform apply가 완전히 완료되지 않았습니다"
    echo "   3. ElastiCache 리소스가 아직 primary_endpoint_address를 반환하지 않습니다"
    echo ""
    echo "   확인 방법:"
    echo "   cd terraform/envs/dev"
    echo "   terraform output valkey_primary_endpoint"
    echo "   terraform state show module.data.aws_elasticache_replication_group.valkey | grep primary_endpoint"
    echo ""
    echo "   또는 AWS Console에서 확인:"
    echo "   - ElastiCache > Replication groups > passit-dev-valkey"
    echo ""
    echo "   계속 진행하시겠습니까? (Valkey 없이도 RDS, S3, IRSA는 업데이트됩니다) (y/n)"
    read -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    echo ""
    echo "   💡 나중에 Valkey endpoint를 수동으로 추가하세요:"
    echo "   각 서비스의 values-${ENVIRONMENT}.yaml 파일에서:"
    echo "   redis:"
    echo "     host: \"<valkey-endpoint>\""
    echo ""
fi

# 서비스별 업데이트 함수
update_service_values() {
    local SERVICE_NAME=$1
    local VALUES_FILE="$PROJECT_ROOT/service-${SERVICE_NAME}/helm/values-${ENVIRONMENT}.yaml"
    local VALUES_FILE_DEFAULT="$PROJECT_ROOT/service-${SERVICE_NAME}/helm/values.yaml"
    local IRSA_ROLE=$2
    local S3_BUCKET=$3
    
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
    update_service_values "account" "$IRSA_ACCOUNT" "$S3_BUCKET_PROFILE"
    echo ""
fi

# Ticket Service
if [ -d "$PROJECT_ROOT/service-ticket/helm" ]; then
    echo "📦 Ticket Service"
    update_service_values "ticket" "$IRSA_TICKET" "$S3_BUCKET_TICKET"
    echo ""
fi

# Trade Service
if [ -d "$PROJECT_ROOT/service-trade/helm" ]; then
    echo "📦 Trade Service"
    update_service_values "trade" "$IRSA_TRADE" ""
    echo ""
fi

# CS Service
if [ -d "$PROJECT_ROOT/service-cs/helm" ]; then
    echo "📦 CS Service"
    update_service_values "cs" "$IRSA_CS" ""
    echo ""
fi

# Chat Service (있는 경우)
if [ -d "$PROJECT_ROOT/service-chat/helm" ]; then
    echo "📦 Chat Service"
    # Chat service는 IRSA가 없을 수 있음
    update_service_values "chat" "" ""
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

