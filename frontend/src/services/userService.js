/**
 * 사용자 프로필 관리 API 서비스
 * Account Service (8081)와 통신
 */
import { accountAPI } from "../api/axiosInstances";
import { ENDPOINTS } from "../api/endpoints";

class UserService {
  /**
   * 내 정보 조회
   * @returns {Promise}
   */
  async getMyInfo() {
    const response = await accountAPI.get(ENDPOINTS.USERS.ME);
    return response.data;
  }

  /**
   * 내 정보 수정
   * @param {Object} userData - { name, nickname, phone, bio }
   * @returns {Promise}
   */
  async updateMyInfo(userData) {
    const response = await accountAPI.patch(ENDPOINTS.USERS.UPDATE_ME, userData);

    // localStorage의 사용자 정보도 업데이트
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem("user", JSON.stringify(updatedUser));

    return response.data;
  }

  /**
   * 계정 탈퇴
   * @returns {Promise}
   */
  async deleteMyAccount() {
    const response = await accountAPI.delete(ENDPOINTS.USERS.DELETE_ME);

    // 탈퇴 성공 시 로컬 데이터 삭제
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    return response.data;
  }

  /**
   * 비밀번호 변경
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {Promise}
   */
  async changePassword(currentPassword, newPassword) {
    const response = await accountAPI.post(ENDPOINTS.USERS.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  /**
   * 비밀번호 설정 (소셜 로그인 사용자 전용)
   * @param {string} newPassword
   * @returns {Promise}
   */
  async setPassword(newPassword) {
    const response = await accountAPI.post(ENDPOINTS.USERS.SET_PASSWORD, {
      newPassword,
    });
    return response.data;
  }

  /**
   * 비밀번호 확인
   * @param {string} password
   * @returns {Promise}
   */
  async verifyPassword(password) {
    const response = await accountAPI.post(ENDPOINTS.USERS.VERIFY_PASSWORD, {
      password,
    });
    return response.data;
  }

  /**
   * 비밀번호 재설정 코드 전송
   * TODO: 백엔드 API 구현 필요
   * @param {string} email
   * @returns {Promise}
   */
  async sendPasswordResetCode(email) {
    // TODO: 백엔드 API가 구현되면 아래 주석 해제
    // const response = await accountAPI.post("/api/auth/reset-password/send-code", { email });
    // return response.data;

    // 임시: 성공 시뮬레이션
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: "인증 코드가 전송되었습니다." });
      }, 1000);
    });
  }

  /**
   * 비밀번호 재설정 코드 검증
   * TODO: 백엔드 API 구현 필요
   * @param {string} email
   * @param {string} code
   * @returns {Promise}
   */
  async verifyPasswordResetCode(email, code) {
    // TODO: 백엔드 API가 구현되면 아래 주석 해제
    // const response = await accountAPI.post("/api/auth/reset-password/verify-code", { email, code });
    // return response.data;

    // 임시: 테스트용 코드 "123456"
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (code === "123456") {
          resolve({ success: true, message: "인증 코드가 확인되었습니다." });
        } else {
          reject(new Error("인증 코드가 일치하지 않습니다."));
        }
      }, 500);
    });
  }

  /**
   * 비밀번호 재설정 (인증 코드 검증 후)
   * TODO: 백엔드 API 구현 필요
   * @param {string} email
   * @param {string} code
   * @param {string} newPassword
   * @returns {Promise}
   */
  async resetPassword(email, code, newPassword) {
    // TODO: 백엔드 API가 구현되면 아래 주석 해제
    // const response = await accountAPI.post("/api/auth/reset-password", { email, code, newPassword });
    // return response.data;

    // 임시: 성공 시뮬레이션
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: "비밀번호가 변경되었습니다." });
      }, 1000);
    });
  }

  // ============================================
  // 관리자용 API
  // ============================================

  /**
   * 사용자 생성 (관리자)
   * @param {Object} userData
   * @returns {Promise}
   */
  async createUser(userData) {
    const response = await accountAPI.post(ENDPOINTS.USERS.CREATE, userData);
    return response.data;
  }

  /**
   * 전체 사용자 목록 조회 (관리자)
   * @returns {Promise}
   */
  async getAllUsers() {
    const response = await accountAPI.get(ENDPOINTS.USERS.LIST);
    return response.data;
  }

  /**
   * 사용자 검색 (관리자, 페이지네이션)
   * @param {Object} params - { keyword, status, page, size, sortBy, sortDirection }
   * @returns {Promise}
   */
  async searchUsers(params = {}) {
    const response = await accountAPI.get(ENDPOINTS.USERS.SEARCH, { params });
    return response.data;
  }

  /**
   * 특정 사용자 조회 (관리자)
   * @param {number} userId
   * @returns {Promise}
   */
  async getUserById(userId) {
    const response = await accountAPI.get(ENDPOINTS.USERS.DETAIL(userId));
    return response.data;
  }

  /**
   * 이메일로 사용자 조회 (관리자)
   * @param {string} email
   * @returns {Promise}
   */
  async getUserByEmail(email) {
    const response = await accountAPI.get(ENDPOINTS.USERS.BY_EMAIL(email));
    return response.data;
  }

  /**
   * 상태별 사용자 조회 (관리자)
   * @param {string} status - ACTIVE, SUSPENDED, DELETED
   * @returns {Promise}
   */
  async getUsersByStatus(status) {
    const response = await accountAPI.get(ENDPOINTS.USERS.BY_STATUS(status));
    return response.data;
  }

  /**
   * 사용자 정보 수정 (관리자)
   * @param {number} userId
   * @param {Object} userData
   * @returns {Promise}
   */
  async updateUser(userId, userData) {
    const response = await accountAPI.put(ENDPOINTS.USERS.UPDATE(userId), userData);
    return response.data;
  }

  /**
   * 사용자 권한 변경 (관리자)
   * @param {number} userId
   * @param {string} role - USER, ADMIN
   * @returns {Promise}
   */
  async updateUserRole(userId, role) {
    const response = await accountAPI.patch(ENDPOINTS.USERS.UPDATE_ROLE(userId), { role });
    return response.data;
  }

  /**
   * 사용자 정지 (관리자)
   * @param {number} userId
   * @returns {Promise}
   */
  async suspendUser(userId) {
    const response = await accountAPI.patch(ENDPOINTS.USERS.SUSPEND(userId));
    return response.data;
  }

  /**
   * 사용자 활성화 (관리자)
   * @param {number} userId
   * @returns {Promise}
   */
  async activateUser(userId) {
    const response = await accountAPI.patch(ENDPOINTS.USERS.ACTIVATE(userId));
    return response.data;
  }

  /**
   * 사용자 삭제 (관리자, 소프트 삭제)
   * @param {number} userId
   * @returns {Promise}
   */
  async deleteUser(userId) {
    const response = await accountAPI.delete(ENDPOINTS.USERS.DELETE(userId));
    return response.data;
  }

  /**
   * 사용자 영구 삭제 (관리자, 하드 삭제)
   * @param {number} userId
   * @returns {Promise}
   */
  async hardDeleteUser(userId) {
    const response = await accountAPI.delete(ENDPOINTS.USERS.HARD_DELETE(userId));
    return response.data;
  }
}

export default new UserService();
