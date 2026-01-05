/**
 * 백엔드 5개 마이크로서비스별 Axios 인스턴스
 */
import axios from "axios";
import { CLOUDFRONT_URL, API_SERVICES } from "../config/apiConfig";

// 중앙화된 API 설정 사용
const BASE_URLS = {
  // Account Service: /api/auth/*, /api/users/* → alb-account-origin
  ACCOUNT: API_SERVICES.ACCOUNT,
  // Ticket Service: /api/tickets/* → alb-ticket-origin
  TICKET: API_SERVICES.TICKET,
  // Trade Service: /api/trades/*, /api/deals/* → alb-trade-origin
  TRADE: API_SERVICES.TRADE,
  // Chat Service: /api/chat/*, /ws/* → alb-chat-origin
  CHAT: API_SERVICES.CHAT,
  // CS Service: /api/cs/*, /api/notices/*, /api/faqs/*, /api/inquiries/* → alb-cs-origin
  CS: API_SERVICES.CS,
};

/**
 * Axios 인스턴스 생성 헬퍼 함수
 */
const createAxiosInstance = (baseURL, serviceName) => {
  const instance = axios.create({
    baseURL,
    withCredentials: false,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // 요청 인터셉터 - JWT 토큰 자동 첨부
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`📤 [${serviceName}]`, config.method?.toUpperCase(), config.url);
      return config;
    },
    (error) => {
      console.error(`❌ [${serviceName} Request Error]`, error);
      return Promise.reject(error);
    }
  );

  // 응답 인터셉터 - 에러 처리 및 토큰 갱신
  instance.interceptors.response.use(
    (response) => {
      console.log(`✅ [${serviceName}]`, response.status, response.config.url);
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // 401 Unauthorized - 토큰 만료
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Refresh Token으로 새 Access Token 발급
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            const response = await axios.post(`${BASE_URLS.ACCOUNT}/api/auth/refresh`, {
              refreshToken,
            });

            const { accessToken } = response.data.data;
            localStorage.setItem("accessToken", accessToken);

            // 원래 요청 재시도
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return instance(originalRequest);
          }
        } catch (refreshError) {
          // Refresh Token도 만료됨 - 로그아웃 처리
          console.error("토큰 갱신 실패, 로그아웃 필요", refreshError);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/auth";
          return Promise.reject(refreshError);
        }
      }

      // 403 Forbidden - 권한 없음
      if (error.response?.status === 403) {
        console.error(`🚫 [${serviceName}] 권한이 없습니다`);
      }

      // 500 Internal Server Error
      if (error.response?.status === 500) {
        console.error(`💥 [${serviceName}] 서버 오류`);
      }

      console.error(`❌ [${serviceName} Response Error]`, error.response?.data || error.message);
      return Promise.reject(error);
    }
  );

  return instance;
};

// 각 서비스별 Axios 인스턴스 생성
export const accountAPI = createAxiosInstance(BASE_URLS.ACCOUNT, "Account");
export const ticketAPI = createAxiosInstance(BASE_URLS.TICKET, "Ticket");
export const tradeAPI = createAxiosInstance(BASE_URLS.TRADE, "Trade");
export const chatAPI = createAxiosInstance(BASE_URLS.CHAT, "Chat");
export const csAPI = createAxiosInstance(BASE_URLS.CS, "CS");

// 기본 export (backward compatibility)
export default accountAPI;
