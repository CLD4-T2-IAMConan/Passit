#!/bin/bash

# Frontend Test Automation Script
# 프론트엔드 전체 테스트를 실행하고 리포트를 생성합니다

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "Frontend Test Automation"
echo "========================================"

# 현재 위치 확인
if [ ! -f "package.json" ]; then
  echo "${RED}Error: package.json not found. Please run this script from the frontend directory.${NC}"
  exit 1
fi

# 1. Lint
echo ""
echo "${YELLOW}[1/5] Running ESLint...${NC}"
if npm run lint; then
  echo "${GREEN}✓ ESLint passed${NC}"
else
  echo "${RED}✗ ESLint failed${NC}"
  echo "Run 'npm run lint:fix' to auto-fix some issues"
  exit 1
fi

# 2. Format Check
echo ""
echo "${YELLOW}[2/5] Checking Code Formatting...${NC}"
if npm run format:check; then
  echo "${GREEN}✓ Code formatting is correct${NC}"
else
  echo "${RED}✗ Code formatting issues found${NC}"
  echo "Run 'npm run format' to auto-fix formatting"
  exit 1
fi

# 3. Unit Tests with Coverage
echo ""
echo "${YELLOW}[3/5] Running Unit Tests with Coverage...${NC}"
if npm run test:coverage; then
  echo "${GREEN}✓ Unit tests passed${NC}"
else
  echo "${RED}✗ Unit tests failed${NC}"
  exit 1
fi

# Coverage 리포트 확인
COVERAGE_PATH="coverage/lcov-report/index.html"
if [ -f "$COVERAGE_PATH" ]; then
  echo ""
  echo "========================================"
  echo "Coverage Report Location:"
  echo "file://$(pwd)/$COVERAGE_PATH"
  echo "========================================"

  # macOS에서 자동으로 열기
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$COVERAGE_PATH"
  fi
fi

# 4. Build
echo ""
echo "${YELLOW}[4/5] Building Application...${NC}"
if npm run build; then
  echo "${GREEN}✓ Build successful${NC}"
else
  echo "${RED}✗ Build failed${NC}"
  exit 1
fi

# 5. E2E Tests (선택사항)
if [ "$RUN_E2E" = "true" ]; then
  echo ""
  echo "${YELLOW}[5/5] Running E2E Tests...${NC}"
  if npm run test:e2e; then
    echo "${GREEN}✓ E2E tests passed${NC}"
  else
    echo "${RED}✗ E2E tests failed${NC}"
    exit 1
  fi
else
  echo ""
  echo "${YELLOW}[5/5] Skipping E2E Tests${NC}"
  echo "Set RUN_E2E=true to enable E2E tests"
fi

echo ""
echo "${GREEN}========================================"
echo "All Frontend Tests Passed!"
echo "========================================${NC}"
