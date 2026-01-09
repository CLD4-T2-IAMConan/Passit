/**
 * 티켓 관리 API 서비스
 * Ticket Service (8082)와 통신
 */
import { ticketAPI } from "../lib/api/client";
import { ENDPOINTS } from "../api/endpoints";

class TicketService {
  /**
   * 티켓 목록 조회 (페이지네이션, 검색, 필터링)
   * @param {Object} params - { keyword, category, region, minPrice, maxPrice, status, sortBy, sortDirection, page, size }
   * @returns {Promise}
   */
  async getTickets(params = {}) {
    const response = await ticketAPI.get(ENDPOINTS.TICKETS.LIST, { params });
    return response.data;
  }

  /**
   * 티켓 상세 조회
   * @param {number} ticketId
   * @returns {Promise}
   */
  async getTicketDetail(ticketId) {
    const response = await ticketAPI.get(ENDPOINTS.TICKETS.DETAIL(ticketId));
    return response.data;
  }

  /**
   * 티켓 생성 (이미지 업로드 포함)
   * @param {FormData} formData - { title, description, category, region, price, eventDate, venue, seatInfo, images[] }
   * @returns {Promise}
   */
  async createTicket(formData) {
    const response = await ticketAPI.post(ENDPOINTS.TICKETS.CREATE, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  /**
   * 티켓 수정
   * @param {number} ticketId
   * @param {FormData} formData
   * @returns {Promise}
   */
  async updateTicket(ticketId, formData) {
    const response = await ticketAPI.put(ENDPOINTS.TICKETS.UPDATE(ticketId), formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  /**
   * 티켓 삭제
   * @param {number} ticketId
   * @returns {Promise}
   */
  async deleteTicket(ticketId) {
    const response = await ticketAPI.delete(ENDPOINTS.TICKETS.DELETE(ticketId));
    return response.data;
  }

  /**
   * 내 티켓 목록 조회 (판매자)
   * @param {Object} params - { status, page, size }
   * @returns {Promise}
   */
  async getMyTickets(params = {}) {
    const response = await ticketAPI.get(ENDPOINTS.TICKETS.MY_TICKETS, { params });
    return response.data;
  }

  /**
   * 티켓 상태 변경
   * @param {number} ticketId
   * @param {string} status - AVAILABLE, RESERVED, SOLD, EXPIRED, DELETED
   * @returns {Promise}
   */
  async updateTicketStatus(ticketId, status) {
    const response = await ticketAPI.patch(ENDPOINTS.TICKETS.UPDATE_STATUS(ticketId), { status });
    return response.data;
  }

  /**
   * 카테고리별 티켓 조회
   * @param {string} category
   * @param {Object} params - { page, size }
   * @returns {Promise}
   */
  async getTicketsByCategory(category, params = {}) {
    const response = await ticketAPI.get(ENDPOINTS.TICKETS.BY_CATEGORY(category), { params });
    return response.data;
  }

  /**
   * 지역별 티켓 조회
   * @param {string} region
   * @param {Object} params - { page, size }
   * @returns {Promise}
   */
  async getTicketsByRegion(region, params = {}) {
    const response = await ticketAPI.get(ENDPOINTS.TICKETS.BY_REGION(region), { params });
    return response.data;
  }

  /**
   * 가격 범위별 티켓 조회
   * @param {number} minPrice
   * @param {number} maxPrice
   * @param {Object} params - { page, size }
   * @returns {Promise}
   */
  async getTicketsByPriceRange(minPrice, maxPrice, params = {}) {
    const response = await ticketAPI.get(ENDPOINTS.TICKETS.BY_PRICE_RANGE(minPrice, maxPrice), {
      params,
    });
    return response.data;
  }

  /**
   * 날짜 범위별 티켓 조회
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD
   * @param {Object} params - { page, size }
   * @returns {Promise}
   */
  async getTicketsByDateRange(startDate, endDate, params = {}) {
    const response = await ticketAPI.get(ENDPOINTS.TICKETS.BY_DATE_RANGE(startDate, endDate), {
      params,
    });
    return response.data;
  }

  /**
   * 판매자별 티켓 조회
   * @param {number} sellerId
   * @param {Object} params - { page, size }
   * @returns {Promise}
   */
  async getTicketsBySeller(sellerId, params = {}) {
    const response = await ticketAPI.get(ENDPOINTS.TICKETS.BY_SELLER(sellerId), { params });
    return response.data;
  }

  /**
   * 상태별 티켓 조회
   * @param {string} status - AVAILABLE, RESERVED, SOLD, EXPIRED, DELETED
   * @param {Object} params - { page, size }
   * @returns {Promise}
   */
  async getTicketsByStatus(status, params = {}) {
    const response = await ticketAPI.get(ENDPOINTS.TICKETS.BY_STATUS(status), { params });
    return response.data;
  }

  /**
   * 인기 티켓 조회
   * @param {number} limit
   * @returns {Promise}
   */
  async getPopularTickets(limit = 10) {
    const response = await ticketAPI.get(ENDPOINTS.TICKETS.POPULAR, {
      params: { limit },
    });
    return response.data;
  }

  /**
   * 최신 티켓 조회
   * @param {number} limit
   * @returns {Promise}
   */
  async getRecentTickets(limit = 10) {
    const response = await ticketAPI.get(ENDPOINTS.TICKETS.RECENT, {
      params: { limit },
    });
    return response.data;
  }

  /**
   * 티켓 검색
   * @param {string} keyword
   * @param {Object} params - { category, region, minPrice, maxPrice, page, size }
   * @returns {Promise}
   */
  async searchTickets(keyword, params = {}) {
    const response = await ticketAPI.get(ENDPOINTS.TICKETS.SEARCH, {
      params: { keyword, ...params },
    });
    return response.data;
  }

  /**
   * 티켓 이미지 업로드
   * @param {number} ticketId
   * @param {File[]} images
   * @returns {Promise}
   */
  async uploadTicketImages(ticketId, images) {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append("images", image);
    });

    const response = await ticketAPI.post(ENDPOINTS.TICKETS.UPLOAD_IMAGES(ticketId), formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  /**
   * 티켓 이미지 삭제
   * @param {number} ticketId
   * @param {number} imageId
   * @returns {Promise}
   */
  async deleteTicketImage(ticketId, imageId) {
    const response = await ticketAPI.delete(ENDPOINTS.TICKETS.DELETE_IMAGE(ticketId, imageId));
    return response.data;
  }

  // ============================================
  // 관리자용 API
  // ============================================

  /**
   * 전체 티켓 조회 (관리자)
   * @param {Object} params
   * @returns {Promise}
   */
  async getAllTicketsAdmin(params = {}) {
    const response = await ticketAPI.get(ENDPOINTS.TICKETS.ADMIN.LIST, { params });
    return response.data;
  }

  /**
   * 티켓 강제 삭제 (관리자)
   * @param {number} ticketId
   * @returns {Promise}
   */
  async forceDeleteTicket(ticketId) {
    const response = await ticketAPI.delete(ENDPOINTS.TICKETS.ADMIN.FORCE_DELETE(ticketId));
    return response.data;
  }

  /**
   * 티켓 상태 강제 변경 (관리자)
   * @param {number} ticketId
   * @param {string} status
   * @returns {Promise}
   */
  async forceUpdateTicketStatus(ticketId, status) {
    const response = await ticketAPI.patch(ENDPOINTS.TICKETS.ADMIN.UPDATE_STATUS(ticketId), {
      status,
    });
    return response.data;
  }
}

export default new TicketService();
