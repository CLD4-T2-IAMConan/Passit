/**
 * 마이크로서비스 API URL 설정
 * 각 서비스별로 다른 포트/URL 사용
 */

export const API_SERVICES = {
  // 계정 서비스 (인증, 회원 관리)
  ACCOUNT: process.env.REACT_APP_ACCOUNT_API_URL || "http://localhost:8081/api",

  // CS 서비스 (고객지원, 카테고리, 신고, 문의 등)
  CS: process.env.REACT_APP_CS_API_URL || "http://localhost:8085/api",

  // 채팅 서비스 (양도 거래 채팅방)
  CHAT: process.env.REACT_APP_CHAT_API_URL || "http://localhost:8084",

  // 다른 서비스들 추가
  // SERVICE2: process.env.REACT_APP_SERVICE2_API_URL || "http://localhost:8082/api",
  // SERVICE3: process.env.REACT_APP_SERVICE3_API_URL || "http://localhost:8083/api",

};

export default API_SERVICES;
