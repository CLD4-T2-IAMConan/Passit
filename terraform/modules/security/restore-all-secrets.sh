#!/bin/bash

# 모든 삭제 예정 상태 시크릿을 한 번에 복구하는 스크립트

REGION="ap-northeast-2"
SECRET_NAMES=(
  "passit/dev/db"
  "passit/dev/smtp"
  "passit/dev/kakao"
  "passit/dev/admin"
  "passit/dev/app/secrets"
  "passit/elasticache/credentials/dev"
)

echo "=== Secrets Manager 시크릿 복구 시작 ==="
echo ""

for SECRET_NAME in "${SECRET_NAMES[@]}"; do
  echo -n "복구 중: $SECRET_NAME ... "
  
  # 시크릿 복구 시도
  aws secretsmanager restore-secret \
    --secret-id "$SECRET_NAME" \
    --region "$REGION" \
    > /dev/null 2>&1
  
  if [ $? -eq 0 ]; then
    echo "✅ 성공"
  else
    # 이미 정상 상태이거나 존재하지 않는 경우
    ERROR=$(aws secretsmanager describe-secret \
      --secret-id "$SECRET_NAME" \
      --region "$REGION" \
      2>&1)
    
    if echo "$ERROR" | grep -q "ResourceNotFoundException"; then
      echo "ℹ️  존재하지 않음 (정상)"
    elif echo "$ERROR" | grep -q "InvalidRequestException.*not scheduled for deletion"; then
      echo "✅ 이미 정상 상태"
    else
      echo "⚠️  오류 (상태 확인 필요)"
    fi
  fi
done

echo ""
echo "=== 복구 완료 ==="
echo ""
echo "다음 단계:"
echo "  cd /Users/krystal/workspace/Passit/terraform/envs/dev"
echo "  terraform refresh"
echo "  terraform plan"
echo "  terraform apply"
