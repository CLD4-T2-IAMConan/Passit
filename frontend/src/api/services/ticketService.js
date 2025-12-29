import axios from "axios";
import { ENDPOINTS } from "../endpoints";

/**
 *  ticket 서비스 전용 API Client (8082)
 */
const ticketApiClient = axios.create({
  baseURL: "http://localhost:8082", // /api는 endpoints.js에 포함되어 있음
});

/**
 *  요청마다 JWT 자동 첨부
 */
ticketApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 티켓 관련 API 서비스
 */
export const ticketService = {
  /**
   * 티켓 목록 조회 + 필터링 (공개 API)
   */
  getTickets: async (params = {}) => {
    const response = await ticketApiClient.get(ENDPOINTS.TICKETS.LIST, { params });
    return response.data;
  },

  /**
   * 티켓 상세 조회 (공개 API)
   */
  getTicketDetail: async (ticketId) => {
    const response = await ticketApiClient.get(ENDPOINTS.TICKETS.DETAIL(ticketId));
    return response.data;
  },

  /**
   * 내 티켓 조회 (판매자 / JWT 필요)
   */
  getMyTickets: async () => {
    const response = await ticketApiClient.get(ENDPOINTS.TICKETS.MY);
    return response.data;
  },

  /**
   * 티켓 등록 (판매자 / JWT 필요)
   */
  createTicket: async (formData) => {
    const response = await ticketApiClient.post(ENDPOINTS.TICKETS.CREATE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * 티켓 수정 (판매자 / JWT 필요)
   */
  updateTicket: async (ticketId, formData) => {
    const response = await ticketApiClient.put(ENDPOINTS.TICKETS.UPDATE(ticketId), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * 티켓 삭제 (판매자 / JWT 필요)
   */
  deleteTicket: async (ticketId) => {
    const response = await ticketApiClient.delete(ENDPOINTS.TICKETS.DELETE(ticketId));
    return response.data;
  },
};

export default ticketService;
