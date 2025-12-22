#!/bin/bash
# Secrets Manager에서 삭제 예정인 시크릿들을 즉시 삭제하는 스크립트

ENVIRONMENT=${1:-prod}  # 기본값: prod

echo "Cleaning up scheduled-for-deletion secrets for environment: $ENVIRONMENT"

# 삭제할 시크릿 목록
SECRETS=(
  "passit/${ENVIRONMENT}/db"
  "passit/${ENVIRONMENT}/smtp"
  "passit/${ENVIRONMENT}/kakao"
  "passit/${ENVIRONMENT}/admin"
  "passit/${ENVIRONMENT}/app/secrets"
  "passit/${ENVIRONMENT}/valkey/connection"
  "passit/elasticache/credentials/${ENVIRONMENT}"
)

for SECRET in "${SECRETS[@]}"; do
  echo "Checking secret: $SECRET"
  
  # 시크릿이 존재하고 삭제 예정 상태인지 확인
  if aws secretsmanager describe-secret --secret-id "$SECRET" --query 'DeletedDate' --output text 2>/dev/null | grep -q "."; then
    echo "  → Deleting scheduled secret: $SECRET"
    aws secretsmanager delete-secret --secret-id "$SECRET" --force-delete-without-recovery 2>/dev/null || echo "  → Failed to delete (may already be deleted)"
  else
    echo "  → Secret not scheduled for deletion or doesn't exist: $SECRET"
  fi
done

echo "Cleanup completed!"

