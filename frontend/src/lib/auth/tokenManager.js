/**
 * 토큰 관리자
 * 
 * 모든 토큰 접근을 이 모듈을 통해 통일하여 관리
 * localStorage 키: accessToken, refreshToken
 */

const TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
};

/**
 * Access Token 관리
 */
export const tokenManager = {
  /**
   * Access Token 저장
   */
  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, token);
    } else {
      localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    }
  },

  /**
   * Access Token 조회
   */
  getAccessToken: () => {
    return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
  },

  /**
   * Refresh Token 저장
   */
  setRefreshToken: (token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, token);
    } else {
      localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
    }
  },

  /**
   * Refresh Token 조회
   */
  getRefreshToken: () => {
    return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
  },

  /**
   * 사용자 정보 저장
   */
  setUser: (user) => {
    if (user) {
      localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(TOKEN_KEYS.USER);
    }
  },

  /**
   * 사용자 정보 조회
   */
  getUser: () => {
    const userStr = localStorage.getItem(TOKEN_KEYS.USER);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Failed to parse user data:', e);
        return null;
      }
    }
    return null;
  },

  /**
   * 모든 인증 데이터 삭제
   */
  clearAll: () => {
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.USER);
  },

  /**
   * 인증 상태 확인
   */
  isAuthenticated: () => {
    return !!this.getAccessToken();
  },
};

export default tokenManager;

