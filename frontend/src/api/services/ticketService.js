import apiClient from "../client";
import { ENDPOINTS } from "../endpoints";

/**
 * 티켓 관련 API 서비스
 */
export const ticketService = {
  /**
   * 티켓 목록 조회 + 필터링
   * @param {Object} params - 검색 조건 (쿼리스트링)
   * @returns {Promise<Array>} 티켓 목록
   */
  getTickets: async (params = {}) => {
    const response = await apiClient.get(
      ENDPOINTS.TICKETS.LIST,
      { params }
    );
    return response.data;
  },

  /**
   * 티켓 상세 조회
   * @param {number} ticketId
   * @returns {Promise<Object>} 티켓 상세 정보
   */
  getTicketDetail: async (ticketId) => {
    const response = await apiClient.get(
      ENDPOINTS.TICKETS.DETAIL(ticketId)
    );
    return response.data;
  },

  /**
   * 내 티켓 조회 (판매자)
   * @returns {Promise<Array>} 내 티켓 목록
   */
  getMyTickets: async () => {
    const response = await apiClient.get(
      ENDPOINTS.TICKETS.MY
    );
    return response.data;
  },

  /**
   * 티켓 등록
   * @param {FormData} formData
   * @returns {Promise<Object>} 생성된 티켓
   */
  createTicket: async (formData) => {
    const response = await apiClient.post(
      ENDPOINTS.TICKETS.CREATE,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  },

  /**
   * 티켓 수정
   * @param {number} ticketId
   * @param {FormData} formData
   * @returns {Promise<Object>} 수정된 티켓
   */
  updateTicket: async (ticketId, formData) => {
    const response = await apiClient.put(
      ENDPOINTS.TICKETS.UPDATE(ticketId),
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  },

  /**
   * 티켓 삭제
   * @param {number} ticketId
   * @returns {Promise<void>}
   */
  deleteTicket: async (ticketId) => {
    const response = await apiClient.delete(
      ENDPOINTS.TICKETS.DELETE(ticketId)
    );
    return response.data;
  },
};

export default ticketService;
