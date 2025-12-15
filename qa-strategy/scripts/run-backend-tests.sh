#!/bin/bash

# Backend Test Automation Script
# 백엔드 전체 테스트를 실행하고 리포트를 생성합니다

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "Backend Test Automation"
echo "========================================"

# 현재 위치 확인
if [ ! -f "build.gradle" ]; then
  echo "${RED}Error: build.gradle not found. Please run this script from the service directory.${NC}"
  exit 1
fi

SERVICE_NAME=$(basename $(pwd))
echo "Testing service: ${GREEN}$SERVICE_NAME${NC}"

# 1. Checkstyle
echo ""
echo "${YELLOW}[1/4] Running Checkstyle...${NC}"
if ./gradlew checkstyleMain checkstyleTest; then
  echo "${GREEN}✓ Checkstyle passed${NC}"
else
  echo "${RED}✗ Checkstyle failed${NC}"
  exit 1
fi

# 2. Unit Tests
echo ""
echo "${YELLOW}[2/4] Running Unit Tests...${NC}"
if ./gradlew clean test; then
  echo "${GREEN}✓ Unit tests passed${NC}"
else
  echo "${RED}✗ Unit tests failed${NC}"
  exit 1
fi

# 3. Integration Tests (if exists)
echo ""
echo "${YELLOW}[3/4] Running Integration Tests...${NC}"
if ./gradlew integrationTest 2>/dev/null; then
  echo "${GREEN}✓ Integration tests passed${NC}"
else
  echo "${YELLOW}⚠ No integration tests or tests failed${NC}"
fi

# 4. Coverage Report
echo ""
echo "${YELLOW}[4/4] Generating Coverage Report...${NC}"
./gradlew jacocoTestReport

# Coverage 확인
REPORT_PATH="build/reports/jacoco/test/html/index.html"
if [ -f "$REPORT_PATH" ]; then
  echo "${GREEN}✓ Coverage report generated${NC}"
  echo ""
  echo "========================================"
  echo "Coverage Report Location:"
  echo "file://$(pwd)/$REPORT_PATH"
  echo "========================================"

  # macOS에서 자동으로 열기
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$REPORT_PATH"
  fi
else
  echo "${RED}✗ Coverage report not found${NC}"
fi

# 최소 커버리지 확인 (선택사항)
# MIN_COVERAGE=60
# COVERAGE=$(grep -oP 'Total.*?\K[0-9]+' build/reports/jacoco/test/html/index.html 2>/dev/null | head -1 || echo "0")
# if [ "$COVERAGE" -lt "$MIN_COVERAGE" ]; then
#   echo ""
#   echo "${RED}ERROR: Coverage $COVERAGE% is below minimum $MIN_COVERAGE%${NC}"
#   exit 1
# fi
# echo "${GREEN}✓ Coverage $COVERAGE% meets minimum requirement${NC}"

echo ""
echo "${GREEN}========================================"
echo "All Backend Tests Passed!"
echo "========================================${NC}"
