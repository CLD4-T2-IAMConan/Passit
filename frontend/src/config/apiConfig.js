/**
 * 마이크로서비스 API URL 설정
 * CloudFront를 통한 백엔드 API 호출
 * CloudFront Distribution: https://d82dq0ggv7fb.cloudfront.net
 * 각 서비스는 CloudFront의 Path Pattern을 통해 라우팅됨
 */

const CLOUDFRONT_URL =
  process.env.REACT_APP_CLOUDFRONT_URL || "https://d82dq0ggv7fb.cloudfront.net";

export const API_SERVICES = {
  // 계정 서비스 (인증, 회원 관리)
  // CloudFront Behavior: /api/auth/*, /api/users/* → alb-account-origin
  ACCOUNT: process.env.REACT_APP_ACCOUNT_API_URL || `${CLOUDFRONT_URL}/api`,

  // CS 서비스 (고객지원, 카테고리, 신고, 문의 등)
  // CloudFront Behavior: /api/cs/*, /api/notices/*, /api/faqs/*, /api/inquiries/* → alb-cs-origin
  CS: process.env.REACT_APP_CS_API_URL || `${CLOUDFRONT_URL}/api`,

  // 채팅 서비스 (양도 거래 채팅방)
  // CloudFront Behavior: /api/chat/*, /ws/* → alb-chat-origin
  CHAT: process.env.REACT_APP_CHAT_API_URL || CLOUDFRONT_URL,

  // 티켓 서비스
  // CloudFront Behavior: /api/tickets/* → alb-ticket-origin
  TICKET: process.env.REACT_APP_TICKET_API_URL || `${CLOUDFRONT_URL}/api`,

  // 거래 서비스
  // CloudFront Behavior: /api/trades/*, /api/deals/* → alb-trade-origin
  TRADE: process.env.REACT_APP_TRADE_API_URL || `${CLOUDFRONT_URL}/api`,
};

export default API_SERVICES;
