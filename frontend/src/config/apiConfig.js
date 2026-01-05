/**
 * 마이크로서비스 API URL 설정
 * 각 서비스별로 다른 포트/URL 사용
 */

export const API_SERVICES = {
  // 계정 서비스 (인증, 회원 관리)
  ACCOUNT: process.env.REACT_APP_ACCOUNT_API_URL || "http://account-service.passit.com/api",

  // CS 서비스 (고객지원, 카테고리, 신고, 문의 등)
  CS: process.env.REACT_APP_CS_API_URL || "http://cs-service.passit.com/api",

  // 채팅 서비스 (양도 거래 채팅방)
  CHAT: process.env.REACT_APP_CHAT_API_URL || "http://chat-service.passit.com",

  // 티켓 서비스
  TICKET: process.env.REACT_APP_TICKET_API_URL || "http://ticket-service.passit.com/api",

  // 거래 서비스
  TRADE: process.env.REACT_APP_TRADE_API_URL || "http://trade-service.passit.com/api",
};

export default API_SERVICES;
