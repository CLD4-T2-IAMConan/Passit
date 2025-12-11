import axios from "axios";
import { API_SERVICES } from "../config/apiConfig";

/**
 * 서비스별 Axios 인스턴스 생성 함수
 */
const createApiClient = (baseURL) => {
  const client = axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // 요청 인터셉터
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 응답 인터셉터
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // 네트워크 에러
      if (!error.response) {
        return Promise.reject({
          message: "네트워크 연결을 확인해주세요",
          status: 0,
        });
      }

      const { status, data } = error.response;

      // 401 Unauthorized - 토큰 만료 또는 인증 실패
      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/auth";
        return Promise.reject({
          message: "인증이 만료되었습니다. 다시 로그인해주세요.",
          status,
        });
      }

      // 403 Forbidden
      if (status === 403) {
        return Promise.reject({
          message: "접근 권한이 없습니다",
          status,
        });
      }

      // 404 Not Found
      if (status === 404) {
        return Promise.reject({
          message: data?.message || "요청한 리소스를 찾을 수 없습니다",
          status,
        });
      }

      // 500 Server Error
      if (status >= 500) {
        return Promise.reject({
          message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요",
          status,
        });
      }

      // 기타 에러
      return Promise.reject({
        message: data?.message || "요청 처리 중 오류가 발생했습니다",
        status,
        data,
      });
    }
  );

  return client;
};

/**
 * 각 서비스별 API 클라이언트
 */
export const accountApiClient = createApiClient(API_SERVICES.ACCOUNT);
// export const service2ApiClient = createApiClient(API_SERVICES.SERVICE2);
// export const service3ApiClient = createApiClient(API_SERVICES.SERVICE3);

// 기본 클라이언트 (계정 서비스)
const apiClient = accountApiClient;

export default apiClient;
