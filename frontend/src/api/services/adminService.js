import { accountAPI } from "../../lib/api/client";
import { ENDPOINTS } from "../endpoints";

/**
 * 관리자 - 회원 관리 API 서비스
 */
export const adminService = {
  /**
   * 전체 회원 조회
   * @returns {Promise<Object>} 회원 목록
   */
  getAllUsers: async () => {
    const response = await accountAPI.get(ENDPOINTS.USERS.LIST);
    return response.data;
  },

  /**
   * 회원 검색 및 페이지네이션
   * @param {Object} params - 검색 조건 { keyword, status, page, size, sortBy, sortDirection }
   * @returns {Promise<Object>} 페이지네이션된 회원 목록
   */
  searchUsers: async (params = {}) => {
    const response = await accountAPI.get(ENDPOINTS.USERS.SEARCH, {
      params: {
        keyword: params.keyword || undefined,
        status: params.status || undefined,
        page: params.page || 0,
        size: params.size || 20,
        sortBy: params.sortBy || "createdAt",
        sortDirection: params.sortDirection || "DESC",
      },
    });
    return response.data;
  },

  /**
   * 회원 상세 조회
   * @param {number} userId - 회원 ID
   * @returns {Promise<Object>} 회원 상세 정보
   */
  getUserById: async (userId) => {
    const response = await accountAPI.get(ENDPOINTS.USERS.DETAIL(userId));
    return response.data;
  },

  /**
   * 이메일로 회원 조회
   * @param {string} email - 이메일
   * @returns {Promise<Object>} 회원 정보
   */
  getUserByEmail: async (email) => {
    const response = await accountAPI.get(ENDPOINTS.USERS.BY_EMAIL(email));
    return response.data;
  },

  /**
   * 상태별 회원 조회
   * @param {string} status - 회원 상태 (ACTIVE, SUSPENDED, DELETED)
   * @returns {Promise<Object>} 회원 목록
   */
  getUsersByStatus: async (status) => {
    const response = await accountAPI.get(ENDPOINTS.USERS.BY_STATUS(status));
    return response.data;
  },

  /**
   * 회원 생성 (관리자용)
   * @param {Object} userData - 회원 정보
   * @returns {Promise<Object>} 생성된 회원 정보
   */
  createUser: async (userData) => {
    const response = await accountAPI.post(ENDPOINTS.USERS.CREATE, userData);
    return response.data;
  },

  /**
   * 회원 정보 수정
   * @param {number} userId - 회원 ID
   * @param {Object} updates - 수정할 정보
   * @returns {Promise<Object>} 수정된 회원 정보
   */
  updateUser: async (userId, updates) => {
    const response = await accountAPI.put(ENDPOINTS.USERS.UPDATE(userId), updates);
    return response.data;
  },

  /**
   * 회원 권한 변경
   * @param {number} userId - 회원 ID
   * @param {string} role - 권한 (USER, ADMIN)
   * @returns {Promise<Object>} 수정된 회원 정보
   */
  updateUserRole: async (userId, role) => {
    const response = await accountAPI.patch(ENDPOINTS.USERS.UPDATE_ROLE(userId), { role });
    return response.data;
  },

  /**
   * 회원 정지
   * @param {number} userId - 회원 ID
   * @returns {Promise<Object>} 수정된 회원 정보
   */
  suspendUser: async (userId) => {
    const response = await accountAPI.patch(ENDPOINTS.USERS.SUSPEND(userId));
    return response.data;
  },

  /**
   * 회원 활성화
   * @param {number} userId - 회원 ID
   * @returns {Promise<Object>} 수정된 회원 정보
   */
  activateUser: async (userId) => {
    const response = await accountAPI.patch(ENDPOINTS.USERS.ACTIVATE(userId));
    return response.data;
  },

  /**
   * 회원 소프트 삭제 (탈퇴)
   * @param {number} userId - 회원 ID
   * @returns {Promise<void>}
   */
  deleteUser: async (userId) => {
    const response = await accountAPI.delete(ENDPOINTS.USERS.DELETE(userId));
    return response.data;
  },

  /**
   * 회원 하드 삭제 (영구 삭제)
   * @param {number} userId - 회원 ID
   * @returns {Promise<void>}
   */
  hardDeleteUser: async (userId) => {
    const response = await accountAPI.delete(ENDPOINTS.USERS.HARD_DELETE(userId));
    return response.data;
  },
};

export default adminService;
