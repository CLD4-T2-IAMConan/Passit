/**
 * 마이크로서비스 API URL 설정
 * 각 서비스별로 다른 포트/URL 사용
 */

export const API_SERVICES = {
  // 계정 서비스 (인증, 회원 관리)
  ACCOUNT: process.env.REACT_APP_ACCOUNT_API_URL || "http://localhost:8081/api",

  // 다른 서비스들 추가
  // SERVICE2: process.env.REACT_APP_SERVICE2_API_URL || "http://localhost:8082/api",
  // SERVICE3: process.env.REACT_APP_SERVICE3_API_URL || "http://localhost:8083/api",
  // SERVICE4: process.env.REACT_APP_SERVICE4_API_URL || "http://localhost:8084/api",
  // SERVICE5: process.env.REACT_APP_SERVICE5_API_URL || "http://localhost:8085/api",
};

export default API_SERVICES;
