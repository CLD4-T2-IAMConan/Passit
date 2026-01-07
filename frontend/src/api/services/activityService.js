import { accountAPI } from "../../lib/api/client";
import { ENDPOINTS } from "../endpoints";

/**
 * 활동 내역 관련 API 서비스
 */
export const activityService = {
  /**
   * 활동 내역 생성
   * @param {Object} data - { activityType, relatedUserId?, rating?, comment? }
   * @returns {Promise<Object>} 생성된 활동 내역
   */
  createActivity: async (data) => {
    const response = await accountAPI.post(ENDPOINTS.ACTIVITIES.CREATE, data);
    return response.data;
  },

  /**
   * 내 활동 내역 조회 (페이지네이션)
   * @param {Object} params - { page, size, type? }
   * @returns {Promise<Object>} 페이지네이션된 활동 내역
   */
  getMyActivities: async (params = {}) => {
    const response = await accountAPI.get(ENDPOINTS.ACTIVITIES.MY, {
      params: {
        page: params.page || 0,
        size: params.size || 20,
        type: params.type || undefined,
      },
    });
    return response.data;
  },

  /**
   * 최근 활동 내역 조회 (최대 10개)
   * @returns {Promise<Array>} 최근 활동 내역 목록
   */
  getRecentActivities: async () => {
    const response = await accountAPI.get(ENDPOINTS.ACTIVITIES.RECENT);
    return response.data;
  },

  /**
   * 활동 내역 통계 조회
   * @returns {Promise<Object>} 활동 내역 통계
   */
  getActivityStats: async () => {
    const response = await accountAPI.get(ENDPOINTS.ACTIVITIES.STATS);
    return response.data;
  },
};

export default activityService;
