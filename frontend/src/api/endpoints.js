/**
 * API 엔드포인트 정의
 * 백엔드 5개 마이크로서비스의 모든 API 경로를 중앙에서 관리
 */

export const ENDPOINTS = {
  // ============================================
  // Account Service (8081)
  // ============================================
  AUTH: {
    SIGNUP: "/api/auth/signup",
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
    KAKAO: "/api/auth/kakao",
    KAKAO_CALLBACK: "/api/auth/kakao/callback",
    SEND_VERIFICATION_CODE: "/api/auth/send-verification-code",
    VERIFY_EMAIL: "/api/auth/verify-email",
  },

  USERS: {
    ME: "/api/users/me",
    UPDATE_ME: "/api/users/me",
    DELETE_ME: "/api/users/me",
    CHANGE_PASSWORD: "/api/users/me/password",
    SET_PASSWORD: "/api/users/me/set-password",
    VERIFY_PASSWORD: "/api/users/me/verify-password",

    // 관리자용
    CREATE: "/api/users",
    LIST: "/api/users",
    SEARCH: "/api/users/search",
    DETAIL: (userId) => `/api/users/${userId}`,
    UPDATE: (userId) => `/api/users/${userId}`,
    DELETE: (userId) => `/api/users/${userId}`,
    HARD_DELETE: (userId) => `/api/users/${userId}/hard`,
    UPDATE_ROLE: (userId) => `/api/users/${userId}/role`,
    SUSPEND: (userId) => `/api/users/${userId}/suspend`,
    ACTIVATE: (userId) => `/api/users/${userId}/activate`,
    BY_EMAIL: (email) => `/api/users/email/${email}`,
    BY_STATUS: (status) => `/api/users/status/${status}`,
  },

  ACTIVITIES: {
    CREATE: "/api/activities",
    MY: "/api/activities/me",
    RECENT: "/api/activities/me/recent",
    STATS: "/api/activities/me/stats",
  },

  // ============================================
  // Ticket Service (8082)
  // ============================================
  TICKETS: {
    // 사용자용
    LIST: "/api/tickets",
    DETAIL: (ticketId) => `/api/tickets/${ticketId}`,
    SEARCH: "/api/tickets",

    // 판매자용
    MY_TICKETS: "/api/sellers/tickets",
    CREATE: "/api/sellers/tickets",
    UPDATE: (ticketId) => `/api/sellers/tickets/${ticketId}`,
    DELETE: (ticketId) => `/api/sellers/tickets/${ticketId}`,
    UPDATE_STATUS: (ticketId, newStatus) => `/api/tickets/${ticketId}/status/${newStatus}`,
  },

  // ============================================
  // Trade Service (8083)
  // ============================================
  DEALS: {
    REQUEST: "/api/deals/request",
    DETAIL: (dealId) => `/api/deals/${dealId}/detail`,
    ACCEPT: (dealId) => `/api/deals/${dealId}/accept`,
    REJECT: (dealId) => `/api/deals/${dealId}/reject`,
    CANCEL: (dealId) => `/api/deals/${dealId}/cancel`,
    CONFIRM: (dealId) => `/api/deals/${dealId}/confirm`,
    UPDATE_STATUS: (dealId, newStatus) => `/api/deals/${dealId}/status/${newStatus}`,
    // 아래 엔드포인트들은 백엔드에 아직 구현되지 않음
    // MY_DEALS: "/api/deals/my",
    // PURCHASE_HISTORY: "/api/deals/purchase",
    // SALES_HISTORY: "/api/deals/sales",
    // BY_TICKET: (ticketId) => `/api/deals/ticket/${ticketId}`,
    // BY_STATUS: (status) => `/api/deals/status/${status}`,
  },

  PAYMENTS: {
    DETAIL: (paymentId) => `/api/payments/${paymentId}/detail`,
    PREPARE: (paymentId) => `/api/payments/${paymentId}/prepare`,
    COMPLETE: (paymentId) => `/api/payments/${paymentId}/complete`,
    NICEPAY_CALLBACK: "/api/payments/nicepay/callback",
  },

  // ============================================
  // Chat Service (8084)
  // ============================================
  CHAT: {
    // 채팅방
    CREATE_ROOM: "/chat/rooms",
    ROOMS: "/chat/rooms",
    DELETE_ROOM: (chatroomId) => `/chat/rooms/${chatroomId}`,

    // 메시지
    MESSAGES: (chatroomId) => `/chat/rooms/${chatroomId}/messages`,
    MARK_AS_READ: (chatroomId) => `/chat/rooms/${chatroomId}/read`,

    // 시스템 액션
    SYSTEM_ACTION: "/chat/rooms/system-action",

    // WebSocket
    WS_ENDPOINT: "/ws-stomp",
  },

  // ============================================
  // CS Service (8085)
  // ============================================

  // 공지사항
  NOTICES: {
    LIST: "/notices",
    DETAIL: (noticeId) => `/notices/${noticeId}`,

    // 관리자
    ADMIN_LIST: "/admin/notices",
    ADMIN_CREATE: "/admin/notices",
    ADMIN_UPDATE: (noticeId) => `/admin/notices/${noticeId}`,
    ADMIN_UPDATE_STATUS: (noticeId) => `/admin/notices/${noticeId}/status`,
    ADMIN_DELETE: (noticeId) => `/admin/notices/${noticeId}`,
  },

  // 1:1 문의
  INQUIRIES: {
    // 사용자
    CREATE: "/api/cs/inquiries",
    LIST: "/api/cs/inquiries",
    DETAIL: (inquiryId) => `/api/cs/inquiries/${inquiryId}`,
    DELETE: (inquiryId) => `/api/cs/inquiries/${inquiryId}`,

    // 관리자
    ADMIN_LIST: "/api/cs/admin/inquiries",
    ADMIN_DETAIL: (inquiryId) => `/api/cs/admin/inquiries/${inquiryId}`,
    ADMIN_REPLY: (inquiryId) => `/api/cs/admin/inquiries/${inquiryId}/reply`,
    ADMIN_UPDATE_STATUS: (inquiryId) => `/api/cs/admin/inquiries/${inquiryId}/status`,
    ADMIN_DELETE: (inquiryId) => `/api/cs/admin/inquiries/${inquiryId}`,
  },

  // FAQ
  FAQ: {
    LIST: "/faqs",
    DETAIL: (faqId) => `/faqs/${faqId}`,

    // 관리자
    ADMIN_LIST: "/admin/faqs",
    ADMIN_CREATE: "/admin/faqs",
    ADMIN_UPDATE: (faqId) => `/admin/faqs/${faqId}`,
    ADMIN_DELETE: (faqId) => `/admin/faqs/${faqId}`,
  },

  // 신고
  REPORTS: {
    CREATE: "/reports",
    MY_LIST: "/reports/me",

    // 관리자
    ADMIN_LIST: "/admin/reports",
    ADMIN_DETAIL: (reportId) => `/admin/reports/${reportId}`,
    ADMIN_UPDATE_STATUS: (reportId) => `/admin/reports/${reportId}/status`,
  },

  // 이용 가이드
  GUIDES: {
    LIST: "/guides",
    DETAIL: (guideId) => `/guides/${guideId}`,

    // 관리자
    ADMIN_LIST: "/admin/guides",
    ADMIN_CREATE: "/admin/guides",
    ADMIN_UPDATE: (guideId) => `/admin/guides/${guideId}`,
    ADMIN_DELETE: (guideId) => `/admin/guides/${guideId}`,
  },

  // 카테고리
  CATEGORIES: {
    LIST: "/categories",

    // 관리자
    ADMIN_LIST: "/admin/categories",
    ADMIN_CREATE: "/admin/categories",
    ADMIN_UPDATE: (categoryId) => `/admin/categories/${categoryId}`,
    ADMIN_DELETE: (categoryId) => `/admin/categories/${categoryId}`,
  },
};

export default ENDPOINTS;
