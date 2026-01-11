/**
 * 인증 관련 API 서비스
 * Account Service (8081)와 통신
 */
import { accountAPI } from "../lib/api/client";
import { ENDPOINTS } from "../api/endpoints";
import { API_SERVICES } from "../config/apiConfig";
import tokenManager from "../lib/auth/tokenManager";

class AuthService {
  /**
   * 회원가입
   * @param {Object} signupData - { email, password, name, nickname, phone }
   * @returns {Promise}
   */
  async signup(signupData) {
    const response = await accountAPI.post(ENDPOINTS.AUTH.SIGNUP, signupData);
    return response.data;
  }

  /**
   * 이메일 인증 코드 전송
   * @param {string} email
   * @returns {Promise}
   */
  async sendVerificationCode(email) {
    const response = await accountAPI.post(ENDPOINTS.AUTH.SEND_VERIFICATION_CODE, { email });
    return response.data;
  }

  /**
   * 이메일 인증 코드 확인
   * @param {string} email
   * @param {string} code
   * @returns {Promise}
   */
  async verifyEmail(email, code) {
    const response = await accountAPI.post(ENDPOINTS.AUTH.VERIFY_EMAIL, { email, code });
    return response.data;
  }

  /**
   * 로그인
   * @param {string} email
   * @param {string} password
   * @returns {Promise} { accessToken, refreshToken, userId, email, name, ... }
   */
  async login(email, password) {
    const response = await accountAPI.post(ENDPOINTS.AUTH.LOGIN, { email, password });

    // 백엔드 응답 구조: ApiResponse<T>
    // { success: true, data: { accessToken, refreshToken, userId, ... }, message: "..." }
    // axios는 response.data에 JSON 응답을 파싱하므로:
    // response.data = { success: true, data: { ... }, message: "..." }

    if (!response || !response.data) {
      throw new Error("로그인 응답 데이터가 없습니다");
    }

    // ApiResponse 구조에서 data 필드 추출
    const apiResponse = response.data;
    let data = null;

    if (apiResponse.data) {
      // 정상 구조: { success: true, data: { accessToken, ... }, message: "..." }
      data = apiResponse.data;
    } else if (apiResponse.success === false) {
      // 에러 응답: { success: false, message: "..." }
      throw new Error(apiResponse.message || "로그인에 실패했습니다");
    } else {
      // 예외 케이스: data 필드가 없는 경우
      console.warn("예상치 못한 응답 구조:", apiResponse);
      // 직접 접근 시도 (하위 호환성)
      if (apiResponse.accessToken) {
        data = apiResponse;
      } else {
        throw new Error("로그인 응답 형식이 올바르지 않습니다");
      }
    }

    // 토큰과 사용자 정보를 tokenManager를 통해 저장
    if (data && data.accessToken) {
      tokenManager.setAccessToken(data.accessToken);
    }
    if (data && data.refreshToken) {
      tokenManager.setRefreshToken(data.refreshToken);
    }
    if (data && data.userId) {
      const userInfo = {
        userId: data.userId,
        email: data.email,
        name: data.name,
        nickname: data.nickname,
        provider: data.provider,
        role: data.role,
      };
      tokenManager.setUser(userInfo);
    }

    return data || {};
  }

  /**
   * 로그아웃
   * @returns {Promise}
   */
  async logout() {
    try {
      await accountAPI.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error("로그아웃 API 호출 실패:", error);
    } finally {
      // API 실패 여부와 관계없이 로컬 데이터 정리
      this.clearAuthData();
    }
  }

  /**
   * Access Token 갱신
   * @param {string} refreshToken
   * @returns {Promise}
   */
  async refreshToken(refreshToken) {
    const response = await accountAPI.post(ENDPOINTS.AUTH.REFRESH, { refreshToken });
    const { accessToken } = response.data.data || response.data;

    if (accessToken) {
      tokenManager.setAccessToken(accessToken);
    }

    return response.data;
  }

  /**
   * 카카오 로그인 URL 가져오기
   * @returns {string}
   */
  getKakaoLoginUrl() {
    // CloudFront를 통한 Account Service 접근
    return `${API_SERVICES.ACCOUNT}${ENDPOINTS.AUTH.KAKAO}`;
  }

  /**
   * 카카오 로그인 콜백 처리 (URL에서 토큰 추출)
   * @param {Object} queryParams - { token, refreshToken, userId, email, name, provider }
   */
  handleKakaoCallback(queryParams) {
    const { token, refreshToken, userId, email, name, provider } = queryParams;

    if (token) {
      tokenManager.setAccessToken(token);
    }
    if (refreshToken) {
      tokenManager.setRefreshToken(refreshToken);
    }
    if (userId) {
      const userInfo = {
        userId,
        email,
        name,
        provider: provider || "KAKAO",
      };
      tokenManager.setUser(userInfo);
    }

    return {
      accessToken: token,
      refreshToken,
      userId,
      email,
      name,
      provider,
    };
  }

  /**
   * 현재 로그인 상태 확인
   * @returns {boolean}
   */
  isAuthenticated() {
    return tokenManager.isAuthenticated();
  }

  /**
   * 현재 사용자 정보 가져오기
   * @returns {Object|null}
   */
  getCurrentUser() {
    return tokenManager.getUser();
  }

  /**
   * Access Token 가져오기
   * @returns {string|null}
   */
  getAccessToken() {
    return tokenManager.getAccessToken();
  }

  /**
   * Refresh Token 가져오기
   * @returns {string|null}
   */
  getRefreshToken() {
    return tokenManager.getRefreshToken();
  }

  /**
   * 인증 데이터 모두 삭제
   */
  clearAuthData() {
    tokenManager.clearAll();
  }
}

export default new AuthService();
