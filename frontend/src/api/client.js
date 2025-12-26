import axios from "axios";
import { API_SERVICES } from "../config/apiConfig";

/**
 * 서비스별 Axios 인스턴스 생성 함수
 */
const createApiClient = (baseURL) => {
  const instance = axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // 요청 인터셉터
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token"); // ✅ 키 통일
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // 응답 인터셉터
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (!error.response) {
        return Promise.reject({
          message: "네트워크 연결을 확인해주세요",
          status: 0,
        });
      }

      const { status, data } = error.response;

      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject({
          message: "인증이 만료되었습니다. 다시 로그인해주세요.",
          status,
        });
      }

      if (status === 403) {
        return Promise.reject({
          message: "접근 권한이 없습니다",
          status,
        });
      }

      if (status === 404) {
        return Promise.reject({
          message: data?.message || "요청한 리소스를 찾을 수 없습니다",
          status,
        });
      }

      if (status >= 500) {
        return Promise.reject({
          message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요",
          status,
        });
      }

      return Promise.reject({
        message: data?.message || "요청 처리 중 오류가 발생했습니다",
        status,
        data,
      });
    }
  );

  return instance;
};

/**
 * 서비스별 API 클라이언트
 */
export const accountApiClient = createApiClient(API_SERVICES.ACCOUNT);
export const csApiClient = createApiClient(API_SERVICES.CS);
export const chatApiClient = createApiClient(API_SERVICES.CHAT);
// export const service3ApiClient = createApiClient(API_SERVICES.SERVICE3);

/**
 * 기본 클라이언트 (계정 서비스)
 */
const apiClient = accountApiClient;

//  named + default
export { apiClient };
export default apiClient