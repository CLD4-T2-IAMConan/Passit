/**
 * API 엔드포인트 정의
 * 모든 API 경로를 중앙에서 관리
 */

export const ENDPOINTS = {
  // 인증 관련
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/signup",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    KAKAO: "/auth/kakao",
    KAKAO_CALLBACK: "/auth/kakao/callback",
  },

  // 사용자 관련
  USERS: {
    ME: "/users/me",
    UPDATE: "/users/me",
    DELETE: "/users/me",
    CHANGE_PASSWORD: "/users/me/password",
  },

  // 관리자 - 회원 관리
  ADMIN: {
    USERS: {
      LIST: "/users",
      SEARCH: "/users/search",
      CREATE: "/users",
      DETAIL: (userId) => `/users/${userId}`,
      UPDATE: (userId) => `/users/${userId}`,
      DELETE: (userId) => `/users/${userId}`,
      HARD_DELETE: (userId) => `/users/${userId}/hard`,
      UPDATE_ROLE: (userId) => `/users/${userId}/role`,
      SUSPEND: (userId) => `/users/${userId}/suspend`,
      ACTIVATE: (userId) => `/users/${userId}/activate`,
      BY_EMAIL: (email) => `/users/email/${email}`,
      BY_STATUS: (status) => `/users/status/${status}`,
    },
  },

  // 이메일 인증 관련
  EMAIL: {
    SEND_VERIFICATION: "/email/verification/send",
    VERIFY_CODE: "/email/verification/verify",
    SEND_PASSWORD_RESET: "/email/password-reset/send",
    VERIFY_PASSWORD_RESET: "/email/password-reset/verify",
    RESET_PASSWORD: "/users/reset-password",
  },

  // 티켓 관련
  TICKETS: {
    LIST: "/tickets",
    DETAIL: (id) => `/tickets/${id}`,
    CREATE: "/tickets",
    UPDATE: (id) => `/tickets/${id}`,
    DELETE: (id) => `/tickets/${id}`,
    MY_TICKETS: "/tickets/my",
  },

  // 거래 관련
  TRADES: {
    LIST: "/trades",
    DETAIL: (id) => `/trades/${id}`,
    CREATE: "/trades",
    UPDATE: (id) => `/trades/${id}`,
    CANCEL: (id) => `/trades/${id}/cancel`,
  },

  // 채팅 관련
  CHAT: {
    ROOMS: "/chat/rooms",
    MESSAGES: (roomId) => `/chat/rooms/${roomId}/messages`,
    SEND: (roomId) => `/chat/rooms/${roomId}/messages`,
  },

  // 고객 지원 관련
  SUPPORT: {
    TICKETS: "/support/tickets",
    CREATE: "/support/tickets",
    DETAIL: (id) => `/support/tickets/${id}`,
  },

  // 공지 (Notice)
  NOTICE: {
    USER_LIST: "/api/notices",
    DETAIL: (noticeId) => `/api/notices/${noticeId}`,
    ADMIN_CREATE: "/api/admin/notices",
  },
};

export default ENDPOINTS;