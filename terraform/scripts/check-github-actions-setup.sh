#!/bin/bash

# GitHub Actions AWS 인증 설정 확인 스크립트

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../envs/$ENVIRONMENT"
PROJECT_NAME="passit"

if [ ! -d "$TERRAFORM_DIR" ]; then
    echo "❌ Error: $TERRAFORM_DIR 디렉토리가 존재하지 않습니다."
    exit 1
fi

cd "$TERRAFORM_DIR"

echo "=========================================="
echo "GitHub Actions AWS 인증 설정 확인"
echo "Environment: ${ENVIRONMENT}"
echo "=========================================="
echo ""

# 1. Terraform Output에서 Role ARN 확인
echo "1️⃣  Terraform Output 확인:"
echo ""

ROLE_ARN=$(terraform output -raw github_actions_role_arn 2>/dev/null || echo "")

if [ -n "$ROLE_ARN" ] && [ "$ROLE_ARN" != "null" ]; then
    echo "  ✅ GitHub Actions Role ARN:"
    echo "     $ROLE_ARN"
    echo ""
    echo "  💡 이 값을 GitHub Secrets에 설정하세요:"
    if [ "$ENVIRONMENT" = "dev" ]; then
        echo "     Secret 이름: AWS_ROLE_ARN_DEV"
    else
        echo "     Secret 이름: AWS_ROLE_ARN_PROD"
    fi
    echo "     Secret 값: $ROLE_ARN"
else
    echo "  ❌ github_actions_role_arn output이 없습니다."
    echo "  💡 Terraform apply를 실행하여 IAM Role을 생성하세요:"
    echo "     terraform apply -target=module.security.aws_iam_role.github_actions"
fi
echo ""

# 2. IAM Role 존재 확인
echo "2️⃣  IAM Role 존재 확인:"
echo ""

ROLE_NAME="${PROJECT_NAME}-github-actions-${ENVIRONMENT}"

if aws iam get-role --role-name "$ROLE_NAME" &>/dev/null; then
    echo "  ✅ IAM Role이 존재합니다: $ROLE_NAME"
    
    # Trust Policy 확인
    TRUST_POLICY=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.AssumeRolePolicyDocument' --output json 2>/dev/null || echo "{}")
    
    if echo "$TRUST_POLICY" | grep -q "token.actions.githubusercontent.com"; then
        echo "  ✅ Trust Policy에 GitHub OIDC가 설정되어 있습니다."
    else
        echo "  ⚠️  Trust Policy에 GitHub OIDC가 설정되어 있지 않습니다."
        echo "  💡 Terraform으로 Role을 다시 생성하세요."
    fi
else
    echo "  ❌ IAM Role이 존재하지 않습니다: $ROLE_NAME"
    echo "  💡 Terraform apply를 실행하여 생성하세요:"
    echo "     terraform apply -target=module.security.aws_iam_role.github_actions"
fi
echo ""

# 3. GitHub OIDC Provider 확인
echo "3️⃣  GitHub OIDC Provider 확인:"
echo ""

OIDC_PROVIDERS=$(aws iam list-open-id-connect-providers --query 'OpenIDConnectProviderList[*].Arn' --output text 2>/dev/null || echo "")

if echo "$OIDC_PROVIDERS" | grep -q "token.actions.githubusercontent.com"; then
    OIDC_ARN=$(echo "$OIDC_PROVIDERS" | grep "token.actions.githubusercontent.com" | head -1)
    echo "  ✅ GitHub OIDC Provider가 존재합니다:"
    echo "     $OIDC_ARN"
else
    echo "  ❌ GitHub OIDC Provider가 존재하지 않습니다."
    echo "  💡 terraform/shared에서 생성하세요:"
    echo "     cd terraform/shared"
    echo "     terraform apply -target=aws_iam_openid_connect_provider.github"
fi
echo ""

# 4. Workflow 파일 확인
echo "4️⃣  Workflow 파일 확인:"
echo ""

WORKFLOW_FILE=".github/workflows/deploy-${ENVIRONMENT}.yml"

if [ -f "$SCRIPT_DIR/../../$WORKFLOW_FILE" ]; then
    echo "  ✅ Workflow 파일이 존재합니다: $WORKFLOW_FILE"
    
    # Secret 이름 확인
    if [ "$ENVIRONMENT" = "dev" ]; then
        SECRET_NAME="AWS_ROLE_ARN_DEV"
    else
        SECRET_NAME="AWS_ROLE_ARN_PROD"
    fi
    
    if grep -q "\${{ secrets.$SECRET_NAME }}" "$SCRIPT_DIR/../../$WORKFLOW_FILE"; then
        echo "  ✅ Workflow에서 올바른 Secret을 참조하고 있습니다: $SECRET_NAME"
    else
        echo "  ⚠️  Workflow에서 Secret을 찾을 수 없습니다: $SECRET_NAME"
    fi
    
    # id-token permission 확인
    if grep -q "id-token: write" "$SCRIPT_DIR/../../$WORKFLOW_FILE"; then
        echo "  ✅ Workflow에 id-token: write permission이 있습니다."
    else
        echo "  ⚠️  Workflow에 id-token: write permission이 없습니다."
        echo "  💡 permissions에 id-token: write를 추가하세요."
    fi
else
    echo "  ⚠️  Workflow 파일이 없습니다: $WORKFLOW_FILE"
fi
echo ""

# 5. 요약 및 다음 단계
echo "=========================================="
echo "📋 요약 및 다음 단계:"
echo "=========================================="
echo ""

if [ -n "$ROLE_ARN" ] && [ "$ROLE_ARN" != "null" ]; then
    echo "1. GitHub Secrets 설정:"
    echo "   - Repository → Settings → Secrets and variables → Actions"
    echo "   - New repository secret"
    if [ "$ENVIRONMENT" = "dev" ]; then
        echo "   - Name: AWS_ROLE_ARN_DEV"
    else
        echo "   - Secret: AWS_ROLE_ARN_PROD"
    fi
    echo "   - Secret: $ROLE_ARN"
    echo ""
fi

echo "2. Workflow 파일 확인:"
echo "   - .github/workflows/deploy-${ENVIRONMENT}.yml"
echo "   - permissions에 id-token: write가 있는지 확인"
echo "   - role-to-assume이 올바른 secret을 참조하는지 확인"
echo ""

echo "3. GitHub Actions 재실행:"
echo "   - Repository → Actions"
echo "   - 실패한 workflow 재실행"
echo ""

