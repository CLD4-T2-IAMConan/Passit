/**
 * 애플리케이션 상수 정의
 */

export const APP_CONFIG = {
  // 애플리케이션 정보
  APP_NAME: "Passit",
  APP_VERSION: "1.0.0",
  APP_DESCRIPTION: "안전한 티켓 거래 플랫폼",

  // API 설정
  API_BASE_URL: process.env.REACT_APP_API_URL || "http://localhost:8000/api",
  API_TIMEOUT: 15000, // 15초

  // 인증 설정
  TOKEN_KEY: "token",
  USER_KEY: "user",
  REMEMBER_ME_KEY: "rememberMe",

  // 페이지네이션
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // 이메일 인증
  VERIFICATION_CODE_LENGTH: 6,
  VERIFICATION_CODE_EXPIRY: 180, // 3분 (초)

  // 비밀번호 정책
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 100,

  // 파일 업로드
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
};

export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  RESET_PASSWORD: "/reset-password",
  MY_PAGE: "/mypage",
  SELL: "/sell",
  GUIDE: "/guide",
  SUPPORT: "/support",
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: "네트워크 연결을 확인해주세요",
  SERVER_ERROR: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요",
  UNAUTHORIZED: "인증이 만료되었습니다. 다시 로그인해주세요",
  FORBIDDEN: "접근 권한이 없습니다",
  NOT_FOUND: "요청한 리소스를 찾을 수 없습니다",
  VALIDATION_ERROR: "입력 정보를 확인해주세요",
};

export default APP_CONFIG;
