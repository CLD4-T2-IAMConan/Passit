#!/bin/bash

# Run All Tests Script
# 프로젝트 전체(백엔드 + 프론트엔드) 테스트를 실행합니다

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║     Passit - Run All Tests             ║"
echo "╚════════════════════════════════════════╝"
echo "${NC}"

# 프로젝트 루트 확인
if [ ! -d "qa-strategy" ]; then
  echo "${RED}Error: Please run this script from the project root directory.${NC}"
  exit 1
fi

SCRIPT_DIR="qa-strategy/scripts"
FAILED_SERVICES=()

# Backend Services 테스트
echo ""
echo "${BLUE}===== BACKEND SERVICES =====${NC}"
echo ""

BACKEND_SERVICES=(
  "service-account"
  "service-chat"
  "service-cs"
  "service-ticket"
  "service-trade"
)

for service in "${BACKEND_SERVICES[@]}"; do
  if [ -d "$service" ]; then
    echo "${YELLOW}Testing $service...${NC}"

    cd "$service"
    if bash "../$SCRIPT_DIR/run-backend-tests.sh"; then
      echo "${GREEN}✓ $service tests passed${NC}"
    else
      echo "${RED}✗ $service tests failed${NC}"
      FAILED_SERVICES+=("$service")
    fi
    cd ..
    echo ""
  else
    echo "${YELLOW}⚠ $service directory not found, skipping...${NC}"
    echo ""
  fi
done

# Frontend 테스트
echo ""
echo "${BLUE}===== FRONTEND =====${NC}"
echo ""

if [ -d "frontend" ]; then
  echo "${YELLOW}Testing frontend...${NC}"

  cd frontend
  if bash "../$SCRIPT_DIR/run-frontend-tests.sh"; then
    echo "${GREEN}✓ Frontend tests passed${NC}"
  else
    echo "${RED}✗ Frontend tests failed${NC}"
    FAILED_SERVICES+=("frontend")
  fi
  cd ..
else
  echo "${YELLOW}⚠ Frontend directory not found, skipping...${NC}"
fi

# 결과 요약
echo ""
echo "${BLUE}╔════════════════════════════════════════╗${NC}"
echo "${BLUE}║          Test Results Summary          ║${NC}"
echo "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

if [ ${#FAILED_SERVICES[@]} -eq 0 ]; then
  echo "${GREEN}✓ All Tests Passed!${NC}"
  echo ""
  echo "Services tested:"
  for service in "${BACKEND_SERVICES[@]}"; do
    [ -d "$service" ] && echo "  ${GREEN}✓${NC} $service"
  done
  [ -d "frontend" ] && echo "  ${GREEN}✓${NC} frontend"
  echo ""
  exit 0
else
  echo "${RED}✗ Some Tests Failed${NC}"
  echo ""
  echo "Failed services:"
  for service in "${FAILED_SERVICES[@]}"; do
    echo "  ${RED}✗${NC} $service"
  done
  echo ""
  exit 1
fi
