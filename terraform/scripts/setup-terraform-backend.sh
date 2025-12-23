#!/bin/bash

# Terraform Backend 설정 스크립트
# S3 Bucket과 DynamoDB Table을 생성하여 Terraform State를 안전하게 관리합니다.

set -e

ENVIRONMENT=${1:-dev}
REGION=${2:-ap-northeast-2}

# 환경별 리소스 이름
S3_BUCKET_NAME="passit-terraform-state-${ENVIRONMENT}"
DYNAMODB_TABLE_NAME="passit-terraform-locks-${ENVIRONMENT}"

echo "=========================================="
echo "Terraform Backend 설정"
echo "=========================================="
echo "Environment: ${ENVIRONMENT}"
echo "Region: ${REGION}"
echo "S3 Bucket: ${S3_BUCKET_NAME}"
echo "DynamoDB Table: ${DYNAMODB_TABLE_NAME}"
echo "=========================================="

# AWS 계정 확인
echo ""
echo "📋 AWS 계정 확인 중..."
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: ${AWS_ACCOUNT_ID}"

# S3 Bucket 생성
echo ""
echo "📦 S3 Bucket 생성 중..."
if aws s3api head-bucket --bucket "${S3_BUCKET_NAME}" 2>/dev/null; then
    echo "✅ S3 Bucket '${S3_BUCKET_NAME}' 이미 존재합니다."
else
    echo "S3 Bucket '${S3_BUCKET_NAME}' 생성 중..."
    
    # 버킷 생성 (리전별로 다름)
    if [ "${REGION}" = "us-east-1" ]; then
        aws s3api create-bucket \
            --bucket "${S3_BUCKET_NAME}" \
            --region "${REGION}"
    else
        aws s3api create-bucket \
            --bucket "${S3_BUCKET_NAME}" \
            --region "${REGION}" \
            --create-bucket-configuration LocationConstraint="${REGION}"
    fi
    
    # Versioning 활성화
    aws s3api put-bucket-versioning \
        --bucket "${S3_BUCKET_NAME}" \
        --versioning-configuration Status=Enabled
    
    # 암호화 활성화
    aws s3api put-bucket-encryption \
        --bucket "${S3_BUCKET_NAME}" \
        --server-side-encryption-configuration '{
            "Rules": [{
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }]
        }'
    
    # Public Access 차단
    aws s3api put-public-access-block \
        --bucket "${S3_BUCKET_NAME}" \
        --public-access-block-configuration \
            "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
    
    echo "✅ S3 Bucket '${S3_BUCKET_NAME}' 생성 완료"
fi

# DynamoDB Table 생성
echo ""
echo "🔒 DynamoDB Lock Table 생성 중..."
if aws dynamodb describe-table --table-name "${DYNAMODB_TABLE_NAME}" --region "${REGION}" 2>/dev/null; then
    echo "✅ DynamoDB Table '${DYNAMODB_TABLE_NAME}' 이미 존재합니다."
else
    echo "DynamoDB Table '${DYNAMODB_TABLE_NAME}' 생성 중..."
    
    aws dynamodb create-table \
        --table-name "${DYNAMODB_TABLE_NAME}" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "${REGION}" \
        --tags Key=Name,Value="${DYNAMODB_TABLE_NAME}" Key=Environment,Value="${ENVIRONMENT}" Key=Purpose,Value="TerraformStateLock"
    
    echo "⏳ DynamoDB Table이 활성화될 때까지 대기 중..."
    aws dynamodb wait table-exists \
        --table-name "${DYNAMODB_TABLE_NAME}" \
        --region "${REGION}"
    
    echo "✅ DynamoDB Table '${DYNAMODB_TABLE_NAME}' 생성 완료"
fi

echo ""
echo "=========================================="
echo "✅ Terraform Backend 설정 완료!"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "1. terraform/envs/${ENVIRONMENT}/backend.tf 파일의 주석을 해제하세요"
echo "2. terraform init -migrate-state 실행하여 기존 state를 마이그레이션하세요"
echo ""
echo "Backend 설정 예시:"
echo "  terraform {"
echo "    backend \"s3\" {"
echo "      bucket         = \"${S3_BUCKET_NAME}\""
echo "      key            = \"${ENVIRONMENT}/terraform.tfstate\""
echo "      region         = \"${REGION}\""
echo "      dynamodb_table = \"${DYNAMODB_TABLE_NAME}\""
echo "      encrypt        = true"
echo "    }"
echo "  }"
echo ""

