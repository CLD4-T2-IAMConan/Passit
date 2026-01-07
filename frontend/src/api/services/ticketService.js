import { ticketAPI } from "../../lib/api/client";
import { ENDPOINTS } from "../endpoints";

/**
 * 티켓 관련 API 서비스
 */
export const ticketService = {
  /**
   * 티켓 목록 조회 + 필터링 (공개 API)
   */
  getTickets: async (params = {}) => {
    const response = await ticketAPI.get(ENDPOINTS.TICKETS.LIST, { params });
    return response.data;
  },

  /**
   * 티켓 상세 조회 (공개 API)
   */
  getTicketDetail: async (ticketId) => {
    const response = await ticketAPI.get(ENDPOINTS.TICKETS.DETAIL(ticketId));
    return response.data;
  },

  /**
   * 내 티켓 조회 (판매자 / JWT 필요)
   */
  getMyTickets: async () => {
    const response = await ticketAPI.get(ENDPOINTS.TICKETS.MY);
    return response.data;
  },

  /**
   * 티켓 등록 (판매자 / JWT 필요)
   */
  createTicket: async (formData) => {
    const response = await ticketAPI.post(ENDPOINTS.TICKETS.CREATE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * 티켓 수정 (판매자 / JWT 필요)
   */
  updateTicket: async (ticketId, formData) => {
    const response = await ticketAPI.put(ENDPOINTS.TICKETS.UPDATE(ticketId), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * 티켓 삭제 (판매자 / JWT 필요)
   */
  deleteTicket: async (ticketId) => {
    const response = await ticketAPI.delete(ENDPOINTS.TICKETS.DELETE(ticketId));
    return response.data;
  },

  /**
   * 찜하기 추가/제거 (토글) - 로그인 필요
   */
  toggleFavorite: async (ticketId) => {
    const response = await ticketAPI.post(`/api/tickets/${ticketId}/favorite`);
    return response.data;
  },

  /**
   * 찜하기 여부 확인 - 로그인 필요
   */
  checkFavorite: async (ticketId) => {
    const response = await ticketAPI.get(`/api/tickets/${ticketId}/favorite`);
    return response.data;
  },
};

export default ticketService;
