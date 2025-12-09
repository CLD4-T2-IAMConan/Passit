import axios from "axios";

// API 기본 URL 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

/**
 * Axios 인스턴스 생성
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * 요청 인터셉터
 * - 모든 요청에 인증 토큰 자동 추가
 */
apiClient.interceptors.request.use(
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

/**
 * 응답 인터셉터
 * - 에러 처리 통합
 * - 401 에러 시 자동 로그아웃
 */
apiClient.interceptors.response.use(
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

export default apiClient;
