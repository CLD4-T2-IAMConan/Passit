import axiosInstance from "../api/axiosInstance";
import ENDPOINTS from "../api/endpoints";

export const reportService = {
  /**
   * 신고 등록 (유저)
   * @param {Object} payload
   * @param {number} payload.userId
   * @param {string} payload.targetType
   * @param {number} payload.targetId
   * @param {string} payload.reason
   */
  createReport: (payload) => {
    return axiosInstance.post(ENDPOINTS.REPORTS.CREATE, payload);
  },

  /**
   * 내 신고 목록 조회 (유저)
   * @param {number} userId
   */
  getMyReports: (userId) => {
    return axiosInstance.get(ENDPOINTS.REPORTS.MY_LIST(userId));
  },

  /**
   * 내 신고 상세 조회 (유저)
   * @param {number} reportId
   */
  getMyReportDetail: (reportId) => {
    return axiosInstance.get(ENDPOINTS.REPORTS.MY_DETAIL(reportId));
  },

  /**
   * 신고 목록 조회 (관리자)
   * @param {Object} params
   * @param {string} params.status
   * @param {number} params.category_id
   * @param {number} params.reporter_id
   * @param {number} params.target_user_id
   */
  getAdminReports: (params = {}) => {
    return axiosInstance.get(ENDPOINTS.REPORTS.ADMIN_LIST, { params });
  },

  /**
   * 신고 상세 조회 (관리자)
   * @param {number} reportId
   */
  getAdminReportDetail: (reportId) => {
    return axiosInstance.get(ENDPOINTS.REPORTS.ADMIN_DETAIL(reportId));
  },

  /**
   * 신고 상태 변경 (관리자)
   * @param {number} reportId
   * @param {string} status
   */
  updateReportStatus: (reportId, status) => {
    return axiosInstance.patch(ENDPOINTS.REPORTS.UPDATE_STATUS(reportId), { status });
  },
};

export default reportService;
