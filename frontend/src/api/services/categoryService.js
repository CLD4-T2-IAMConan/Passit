import { csAPI } from "../../lib/api/client";
import { ENDPOINTS } from "../endpoints";

/**
 * 카테고리 관리 API 서비스
 */
export const categoryService = {
  /**
   * 카테고리 목록 조회 (계층 구조)
   * @param {boolean} withHierarchy - 계층 구조 포함 여부
   * @returns {Promise<Object>} 카테고리 목록
   */
  getAllCategories: async (withHierarchy = true) => {
    const response = await csAPI.get(ENDPOINTS.CATEGORIES.LIST, {
      params: { withHierarchy },
    });
    return response.data;
  },

  /**
   * 카테고리 단건 조회
   * @param {number} id - 카테고리 ID
   * @returns {Promise<Object>} 카테고리 정보
   */
  getCategoryById: async (id) => {
    const response = await csAPI.get(`/categories/${id}`);
    return response.data;
  },

  /**
   * 카테고리 생성 (관리자)
   * @param {Object} data - 카테고리 정보 { name, parentId? }
   * @returns {Promise<Object>} 생성된 카테고리 정보
   */
  createCategory: async (data) => {
    const response = await csAPI.post(ENDPOINTS.CATEGORIES.ADMIN_CREATE, data);
    return response.data;
  },

  /**
   * 카테고리 수정 (관리자)
   * @param {number} id - 카테고리 ID
   * @param {Object} data - 수정할 카테고리 정보 { name, parentId? }
   * @returns {Promise<Object>} 수정된 카테고리 정보
   */
  updateCategory: async (id, data) => {
    const response = await csAPI.put(ENDPOINTS.CATEGORIES.ADMIN_UPDATE(id), data);
    return response.data;
  },

  /**
   * 카테고리 삭제 (관리자)
   * @param {number} id - 카테고리 ID
   * @returns {Promise<void>}
   */
  deleteCategory: async (id) => {
    const response = await csAPI.delete(ENDPOINTS.CATEGORIES.ADMIN_DELETE(id));
    return response.data;
  },
};
