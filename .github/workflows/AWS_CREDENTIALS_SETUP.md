# GitHub Actions AWS Credentials 설정 가이드

## 문제

```
Error: Credentials could not be loaded, please check your action inputs: Could not load credentials from any providers
```

이 에러는 GitHub Actions에서 AWS 인증이 실패할 때 발생합니다.

## 해결 방법

### 1. GitHub Secrets 설정 확인

GitHub Repository → Settings → Secrets and variables → Actions에서 다음 Secrets가 설정되어 있는지 확인하세요:

#### Dev 환경

- **Secret 이름**: `AWS_ROLE_ARN_DEV`
- **값**: Terraform output에서 확인

#### Prod 환경

- **Secret 이름**: `AWS_ROLE_ARN_PROD`
- **값**: Terraform output에서 확인

### 2. Terraform Output에서 Role ARN 확인

터미널에서 다음 명령어를 실행하여 Role ARN을 확인하세요:

```bash
# Dev 환경
cd terraform/envs/dev
terraform output github_actions_role_arn

# Prod 환경
cd terraform/envs/prod
terraform output github_actions_role_arn
```

출력 예시:

```
github_actions_role_arn = "arn:aws:iam::727646470302:role/passit-github-actions-dev"
```

### 3. GitHub Secrets에 Role ARN 추가

1. GitHub Repository → Settings → Secrets and variables → Actions
2. "New repository secret" 클릭
3. Name: `AWS_ROLE_ARN_DEV` (또는 `AWS_ROLE_ARN_PROD`)
4. Secret: 위에서 확인한 Role ARN 값 입력
5. "Add secret" 클릭

### 4. GitHub OIDC Provider 확인

Terraform에서 GitHub OIDC Provider가 생성되어 있어야 합니다:

```bash
# OIDC Provider 확인
aws iam list-open-id-connect-providers

# 출력 예시:
# {
#     "OpenIDConnectProviderList": [
#         {
#             "Arn": "arn:aws:iam::727646470302:oidc-provider/token.actions.githubusercontent.com"
#         }
#     ]
# }
```

OIDC Provider가 없다면 `terraform/shared`에서 생성해야 합니다.

### 5. IAM Role Trust Policy 확인

GitHub Actions IAM Role의 trust policy가 GitHub OIDC를 허용하는지 확인:

```bash
# Dev 환경
aws iam get-role --role-name passit-github-actions-dev --query 'Role.AssumeRolePolicyDocument'

# 출력에서 다음이 포함되어야 함:
# - Principal: "Federated": "arn:aws:iam::727646470302:oidc-provider/token.actions.githubusercontent.com"
# - Condition: "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
# - Condition: "token.actions.githubusercontent.com:sub": "repo:CLD4-T2-IAMConan/Passit:*"
```

### 6. Workflow 파일 확인

`.github/workflows/deploy-dev.yml` 또는 `.github/workflows/deploy-prod.yml`에서 다음이 올바른지 확인:

```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN_DEV }} # 또는 AWS_ROLE_ARN_PROD
    aws-region: ${{ env.AWS_REGION }}
```

그리고 `permissions`에 `id-token: write`가 있어야 합니다:

```yaml
permissions:
  contents: write
  id-token: write # OIDC 인증에 필요
```

## 빠른 확인 체크리스트

- [ ] GitHub Secrets에 `AWS_ROLE_ARN_DEV` (또는 `AWS_ROLE_ARN_PROD`) 설정됨
- [ ] Secret 값이 Terraform output의 `github_actions_role_arn`과 일치함
- [ ] GitHub OIDC Provider가 AWS에 생성됨
- [ ] IAM Role의 trust policy가 GitHub OIDC를 허용함
- [ ] Workflow 파일에 `id-token: write` permission이 있음
- [ ] Workflow 파일의 `role-to-assume`이 올바른 secret을 참조함

## 문제 해결 스크립트

다음 스크립트로 자동으로 확인할 수 있습니다:

```bash
# Dev 환경 Role ARN 확인
cd terraform/envs/dev
terraform output github_actions_role_arn

# IAM Role 확인
aws iam get-role --role-name passit-github-actions-dev

# OIDC Provider 확인
aws iam list-open-id-connect-providers
```

## 추가 참고

- GitHub Actions OIDC 인증: https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services
- AWS Actions Configure Credentials: https://github.com/aws-actions/configure-aws-credentials
