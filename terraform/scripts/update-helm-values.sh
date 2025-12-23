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
cd "$TERRAFORM_DIR"

# Terraform 초기화 확인
if [ ! -f "terraform.tfstate" ] && [ ! -f ".terraform/terraform.tfstate" ]; then
    echo "⚠️  Terraform state가 없습니다. terraform apply를 먼저 실행하세요."
    exit 1
fi

# Output 값 추출
RDS_ENDPOINT=$(terraform output -raw rds_cluster_endpoint 2>/dev/null || echo "")
VALKEY_ENDPOINT=$(terraform output -raw valkey_primary_endpoint 2>/dev/null || echo "")
S3_BUCKET_PROFILE=$(terraform output -raw s3_uploads_bucket_id 2>/dev/null || echo "")
S3_BUCKET_TICKET=$(terraform output -raw s3_ticket_bucket_id 2>/dev/null || echo "")

# IRSA Role ARN 추출 (jq 없이도 작동하도록)
if command -v jq &> /dev/null; then
    # jq가 있으면 사용
    IRSA_ACCOUNT=$(terraform output -json 2>/dev/null | jq -r '.backend_irsa_roles.value.account // empty' 2>/dev/null || echo "")
    IRSA_TICKET=$(terraform output -json 2>/dev/null | jq -r '.backend_irsa_roles.value.ticket // empty' 2>/dev/null || echo "")
    IRSA_TRADE=$(terraform output -json 2>/dev/null | jq -r '.backend_irsa_roles.value.trade // empty' 2>/dev/null || echo "")
    IRSA_CS=$(terraform output -json 2>/dev/null | jq -r '.backend_irsa_roles.value.cs // empty' 2>/dev/null || echo "")
else
    # jq가 없으면 terraform output을 텍스트로 파싱
    echo "  ⚠️  jq가 없어서 IRSA 값 추출을 시도합니다..."
    
    # backend_irsa_roles output을 텍스트로 가져와서 파싱
    IRSA_OUTPUT=$(terraform output backend_irsa_roles 2>/dev/null || echo "")
    
    if [ -n "$IRSA_OUTPUT" ]; then
        # account 추출 (ARN 패턴 찾기)
        IRSA_ACCOUNT=$(echo "$IRSA_OUTPUT" | grep -i 'account' | grep -o 'arn:aws:iam::[0-9]*:role/[^"]*' | head -1 || echo "")
        IRSA_TICKET=$(echo "$IRSA_OUTPUT" | grep -i 'ticket' | grep -o 'arn:aws:iam::[0-9]*:role/[^"]*' | head -1 || echo "")
        IRSA_TRADE=$(echo "$IRSA_OUTPUT" | grep -i 'trade' | grep -o 'arn:aws:iam::[0-9]*:role/[^"]*' | head -1 || echo "")
        IRSA_CS=$(echo "$IRSA_OUTPUT" | grep -i '"cs"' | grep -o 'arn:aws:iam::[0-9]*:role/[^"]*' | head -1 || echo "")
        
        # sed로도 시도 (다양한 형식 지원)
        if [ -z "$IRSA_ACCOUNT" ]; then
            IRSA_ACCOUNT=$(echo "$IRSA_OUTPUT" | sed -n 's/.*account[^"]*"\(arn:aws:iam::[^"]*\)".*/\1/p' | head -1 || echo "")
        fi
        if [ -z "$IRSA_TICKET" ]; then
            IRSA_TICKET=$(echo "$IRSA_OUTPUT" | sed -n 's/.*ticket[^"]*"\(arn:aws:iam::[^"]*\)".*/\1/p' | head -1 || echo "")
        fi
        if [ -z "$IRSA_TRADE" ]; then
            IRSA_TRADE=$(echo "$IRSA_OUTPUT" | sed -n 's/.*trade[^"]*"\(arn:aws:iam::[^"]*\)".*/\1/p' | head -1 || echo "")
        fi
        if [ -z "$IRSA_CS" ]; then
            IRSA_CS=$(echo "$IRSA_OUTPUT" | sed -n 's/.*"cs"[^"]*"\(arn:aws:iam::[^"]*\)".*/\1/p' | head -1 || echo "")
        fi
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
if [ -z "$RDS_ENDPOINT" ] || [ -z "$VALKEY_ENDPOINT" ]; then
    echo "❌ Error: 필수 Terraform output 값이 없습니다."
    echo "   terraform apply를 먼저 실행하세요."
    exit 1
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
        yq eval ".redis.host = \"$VALKEY_ENDPOINT\"" -i "$VALUES_FILE"
        
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
        
        # redis.host 업데이트
        sed -i.bak "s|host:.*cache.amazonaws.com.*|host: \"$VALKEY_ENDPOINT\"|g" "$VALUES_FILE"
        sed -i.bak "s|host:.*xxxxx.*|host: \"$VALKEY_ENDPOINT\"|g" "$VALUES_FILE"
        
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

