#!/bin/bash

ALB_DNS="passit-dev-alb-1561102349.ap-northeast-2.elb.amazonaws.com"

echo "=== 백엔드 헬스체크 테스트 ==="
echo ""
echo "ALB DNS: $ALB_DNS"
echo ""

# Account Service
echo "Testing auth:"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://$ALB_DNS/api/auth/health)
BODY=$(curl -s http://$ALB_DNS/api/auth/health)
echo "$BODY"
echo "HTTP Status: $RESPONSE"
echo ""

# Ticket Service
echo "Testing tickets:"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://$ALB_DNS/api/tickets/health)
BODY=$(curl -s http://$ALB_DNS/api/tickets/health)
echo "$BODY"
echo "HTTP Status: $RESPONSE"
echo ""

# Trade Service
echo "Testing trades:"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://$ALB_DNS/api/trades/health)
BODY=$(curl -s http://$ALB_DNS/api/trades/health)
echo "$BODY"
echo "HTTP Status: $RESPONSE"
echo ""

# Chat Service
echo "Testing chat:"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://$ALB_DNS/api/chat/health)
BODY=$(curl -s http://$ALB_DNS/api/chat/health)
echo "$BODY"
echo "HTTP Status: $RESPONSE"
echo ""

# CS Service
echo "Testing cs:"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://$ALB_DNS/api/cs/health)
BODY=$(curl -s http://$ALB_DNS/api/cs/health)
echo "$BODY"
echo "HTTP Status: $RESPONSE"
echo ""

