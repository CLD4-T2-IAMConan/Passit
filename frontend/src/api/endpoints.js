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
    CATEGORIES: {
      LIST: "/admin/categories",
      DETAIL: (id) => `/admin/categories/${id}`,
      CREATE: "/admin/categories",
      UPDATE: (id) => `/admin/categories/${id}`,
      DELETE: (id) => `/admin/categories/${id}`,
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
    MY: "/sellers/tickets",
    CREATE: "/sellers/tickets",
    UPDATE: (id) => `/sellers/tickets/${id}`,
    DELETE: (id) => `/sellers/tickets/${id}`,
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
  USER_LIST: "/cs/notices",
  DETAIL: (noticeId) => `/cs/notices/${noticeId}`,

  // 관리자 (너희 백엔드가 /admin/notices 인지 /cs/admin/notices 인지에 따라 조정)
  ADMIN_CREATE: "/admin/notices",
},

  // 신고 (Reports)
  REPORTS: {
    // 사용자
    CREATE: "/cs/reports",
    MY_LIST: (userId) => "/cs/reports/" + userId,
    MY_DETAIL: (reportId) => "/reports/" + reportId,

    // 관리자
    ADMIN_LIST: "/admin/reports",
    ADMIN_DETAIL: (reportId) => "/admin/reports/" + reportId,
    UPDATE_STATUS: (reportId) => "/admin/reports/" + reportId + "/status",
  },
  // 문의 (Inquiries)
  INQUIRIES: {
    // 유저
    CREATE: "/cs/inquiries",
    LIST: "/cs/inquiries",
    DETAIL: (inquiryId) => `/cs/inquiries/${inquiryId}`,

    // 관리자
    ADMIN_LIST: "/admin/cs/inquiries",
    ADMIN_DETAIL: (inquiryId) => `/admin/cs/inquiries/${inquiryId}`,
    ADMIN_ANSWER: (inquiryId) => `/admin/cs/inquiries/${inquiryId}/answer`,
  },

  // FAQ
    FAQ: {
      USER_LIST: "/api/faqs",
      DETAIL: (faqId) => `/api/faqs/${faqId}`,

      ADMIN_LIST: "/api/admin/faqs",
      ADMIN_CREATE: "/api/admin/faqs",
      ADMIN_DETAIL: (faqId) => `/api/admin/faqs/${faqId}`,
      ADMIN_UPDATE: (faqId) => `/api/admin/faqs/${faqId}`,
      ADMIN_DELETE: (faqId) => `/api/admin/faqs/${faqId}`,
    },

  // 활동 내역 관련
  ACTIVITIES: {
    CREATE: "/activities",
    MY: "/activities/me",
    RECENT: "/activities/me/recent",
    STATS: "/activities/me/stats",
  },
};

export default ENDPOINTS;