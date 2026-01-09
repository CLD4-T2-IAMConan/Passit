/**
 * 통합 API 클라이언트
 *
 * 모든 마이크로서비스를 위한 통합 axios 인스턴스
 * 토큰 관리, 에러 처리, 자동 재시도 등을 포함
 */
import axios from "axios";
import { API_SERVICES } from "../../config/apiConfig";
import tokenManager from "../auth/tokenManager";
import { handleError, ErrorTypes } from "../error/errorHandler";

/**
 * Axios 인스턴스 생성 함수
 */
const createApiClient = (baseURL, serviceName) => {
  // 로컬 개발 환경에서는 항상 프록시를 사용하기 위해 상대 경로 사용
  // setupProxy.js가 /api/* 경로를 백엔드로 프록시함
  // 프로덕션 환경에서만 전체 URL 사용
  const isLocalDev = process.env.NODE_ENV === "development";

  // 로컬 개발 환경이면 상대 경로 사용 (프록시 활용)
  // 프로덕션 환경이면 전체 URL 사용
  const finalBaseURL = isLocalDev ? "" : baseURL;

  const instance = axios.create({
    baseURL: finalBaseURL,
    timeout: 30000, // 30초 타임아웃
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: false,
    // 프록시를 통한 요청이므로 CORS 문제를 피하기 위해
    // 브라우저가 same-origin으로 인식하도록 설정
    validateStatus: function (status) {
      return status >= 200 && status < 500; // 4xx 에러도 reject하지 않도록 (에러 처리에서 처리)
    },
  });

  // 요청 인터셉터 - JWT 토큰 자동 첨부
  instance.interceptors.request.use(
    (config) => {
      // 공개 엔드포인트 목록 (토큰 없이 접근 가능)
      const publicEndpoints = [
        "/api/auth/login",
        "/api/auth/signup",
        "/api/auth/send-verification-code",
        "/api/auth/verify-email",
        "/api/auth/kakao",
        "/api/auth/kakao/callback",
      ];

      // 공개 엔드포인트가 아니면 토큰 첨부
      const isPublicEndpoint = publicEndpoints.some((endpoint) => config.url?.includes(endpoint));

      if (!isPublicEndpoint) {
        const token = tokenManager.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } else {
        // 공개 엔드포인트는 토큰 제거 (혹시 있을 수 있는 기존 토큰)
        delete config.headers.Authorization;
      }

      // 개발 환경에서만 로그 출력
      if (process.env.NODE_ENV === "development") {
        console.log(
          `📤 [${serviceName}]`,
          config.method?.toUpperCase(),
          config.url,
          isPublicEndpoint ? "(public)" : "(authenticated)"
        );
      }

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
      // 개발 환경에서만 로그 출력
      if (process.env.NODE_ENV === "development") {
        console.log(`✅ [${serviceName}]`, response.status, response.config.url);
      }
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // 401 Unauthorized - 토큰 만료
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Refresh Token으로 새 Access Token 발급
          const refreshToken = tokenManager.getRefreshToken();
          if (refreshToken) {
            // 로컬 개발 환경에서는 프록시를 사용하기 위해 상대 경로 사용
            const isLocalDev = process.env.NODE_ENV === "development";
            const refreshURL = isLocalDev
              ? "/api/auth/refresh"
              : `${API_SERVICES.ACCOUNT}/api/auth/refresh`;

            const response = await axios.post(refreshURL, { refreshToken });

            const { accessToken } = response.data.data || response.data;
            if (accessToken) {
              tokenManager.setAccessToken(accessToken);

              // 원래 요청 재시도
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return instance(originalRequest);
            }
          }
        } catch (refreshError) {
          // Refresh Token도 만료됨 - 로그아웃 처리
          console.error("토큰 갱신 실패, 로그아웃 필요", refreshError);
          tokenManager.clearAll();

          // 현재 페이지가 인증 페이지가 아닌 경우에만 리다이렉트
          if (!window.location.pathname.includes("/auth")) {
            window.location.href = "/auth";
          }

          return Promise.reject(refreshError);
        }
      }

      // 에러 처리
      const handledError = handleError(error);

      // 개발 환경에서만 상세 로그 출력
      if (process.env.NODE_ENV === "development") {
        console.error(`❌ [${serviceName} Response Error]`, handledError);
        // 403 에러의 경우 상세 정보 출력
        if (error.response?.status === 403) {
          console.error(`❌ [${serviceName} 403 Details]`, {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            headers: error.response.headers,
            config: {
              url: error.config?.url,
              method: error.config?.method,
              baseURL: error.config?.baseURL,
            },
          });
        }
      }

      return Promise.reject(handledError);
    }
  );

  return instance;
};

/**
 * 서비스별 API 클라이언트 생성
 */
export const accountAPI = createApiClient(API_SERVICES.ACCOUNT, "Account");
export const ticketAPI = createApiClient(API_SERVICES.TICKET, "Ticket");
export const tradeAPI = createApiClient(API_SERVICES.TRADE, "Trade");
export const chatAPI = createApiClient(API_SERVICES.CHAT, "Chat");
export const csAPI = createApiClient(API_SERVICES.CS, "CS");

/**
 * 기본 export (Account API)
 */
export default accountAPI;
