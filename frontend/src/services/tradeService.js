/**
 * 거래 및 결제 관리 API 서비스
 * Trade Service (8083)와 통신
 */
import { tradeAPI } from "../api/axiosInstances";
import { ENDPOINTS } from "../api/endpoints";

class TradeService {
  // ============================================
  // 거래(Deal) 관리
  // ============================================

  /**
   * 거래 요청 생성
   * @param {Object} dealData - { ticketId, buyerMessage }
   * @returns {Promise}
   */
  async createDealRequest(dealData) {
    const response = await tradeAPI.post(ENDPOINTS.DEALS.REQUEST, dealData);
    return response.data;
  }

  /**
   * 거래 수락 (판매자)
   * @param {number} dealId
   * @returns {Promise}
   */
  async acceptDeal(dealId) {
    const response = await tradeAPI.post(ENDPOINTS.DEALS.ACCEPT(dealId));
    return response.data;
  }

  /**
   * 거래 거절 (판매자)
   * @param {number} dealId
   * @param {string} reason - 거절 사유
   * @returns {Promise}
   */
  async rejectDeal(dealId, reason) {
    const response = await tradeAPI.post(ENDPOINTS.DEALS.REJECT(dealId), { reason });
    return response.data;
  }

  /**
   * 거래 취소 (구매자)
   * @param {number} dealId
   * @param {string} reason - 취소 사유
   * @returns {Promise}
   */
  async cancelDeal(dealId, reason) {
    const response = await tradeAPI.post(ENDPOINTS.DEALS.CANCEL(dealId), { reason });
    return response.data;
  }

  /**
   * 거래 확정 (구매자)
   * @param {number} dealId
   * @returns {Promise}
   */
  async confirmDeal(dealId) {
    const response = await tradeAPI.post(ENDPOINTS.DEALS.CONFIRM(dealId));
    return response.data;
  }

  /**
   * 거래 상세 조회
   * @param {number} dealId
   * @returns {Promise}
   */
  async getDealDetail(dealId) {
    const response = await tradeAPI.get(ENDPOINTS.DEALS.DETAIL(dealId));
    return response.data;
  }

  /**
   * 내 거래 목록 조회 (구매자 + 판매자)
   * @param {Object} params - { status, role, page, size }
   * @returns {Promise}
   */
  async getMyDeals(params = {}) {
    const response = await tradeAPI.get(ENDPOINTS.DEALS.MY_DEALS, { params });
    return response.data;
  }

  /**
   * 구매 내역 조회
   * @param {Object} params - { status, page, size }
   * @returns {Promise}
   */
  async getPurchaseHistory(params = {}) {
    const response = await tradeAPI.get(ENDPOINTS.DEALS.PURCHASE_HISTORY, { params });
    return response.data;
  }

  /**
   * 판매 내역 조회
   * @param {Object} params - { status, page, size }
   * @returns {Promise}
   */
  async getSalesHistory(params = {}) {
    const response = await tradeAPI.get(ENDPOINTS.DEALS.SALES_HISTORY, { params });
    return response.data;
  }

  /**
   * 티켓별 거래 목록 조회
   * @param {number} ticketId
   * @param {Object} params - { status, page, size }
   * @returns {Promise}
   */
  async getDealsByTicket(ticketId, params = {}) {
    const response = await tradeAPI.get(ENDPOINTS.DEALS.BY_TICKET(ticketId), { params });
    return response.data;
  }

  /**
   * 상태별 거래 조회
   * @param {string} status - REQUESTED, ACCEPTED, REJECTED, PAID, CANCELLED, CONFIRMED, COMPLETED
   * @param {Object} params - { page, size }
   * @returns {Promise}
   */
  async getDealsByStatus(status, params = {}) {
    const response = await tradeAPI.get(ENDPOINTS.DEALS.BY_STATUS(status), { params });
    return response.data;
  }

  // ============================================
  // 결제(Payment) 관리
  // ============================================

  /**
   * 결제 준비 (NICEPAY)
   * @param {Object} paymentData - { dealId, amount, paymentMethod }
   * @returns {Promise} 결제 준비 정보 (redirectUrl 등)
   */
  async preparePayment(paymentData) {
    const response = await tradeAPI.post(ENDPOINTS.PAYMENTS.PREPARE, paymentData);
    return response.data;
  }

  /**
   * 결제 완료 처리
   * @param {Object} paymentResult - { dealId, paymentId, tid, resultCode, resultMsg }
   * @returns {Promise}
   */
  async completePayment(paymentResult) {
    const response = await tradeAPI.post(ENDPOINTS.PAYMENTS.COMPLETE, paymentResult);
    return response.data;
  }

  /**
   * NICEPAY 결제 콜백 처리
   * @param {Object} callbackData - NICEPAY에서 전달받은 데이터
   * @returns {Promise}
   */
  async handleNicepayCallback(callbackData) {
    const response = await tradeAPI.post(ENDPOINTS.PAYMENTS.NICEPAY_CALLBACK, callbackData);
    return response.data;
  }

  /**
   * 결제 취소/환불
   * @param {number} paymentId
   * @param {Object} cancelData - { reason, amount }
   * @returns {Promise}
   */
  async cancelPayment(paymentId, cancelData) {
    const response = await tradeAPI.post(ENDPOINTS.PAYMENTS.CANCEL(paymentId), cancelData);
    return response.data;
  }

  /**
   * 결제 상세 조회
   * @param {number} paymentId
   * @returns {Promise}
   */
  async getPaymentDetail(paymentId) {
    const response = await tradeAPI.get(ENDPOINTS.PAYMENTS.DETAIL(paymentId));
    return response.data;
  }

  /**
   * 거래별 결제 정보 조회
   * @param {number} dealId
   * @returns {Promise}
   */
  async getPaymentByDeal(dealId) {
    const response = await tradeAPI.get(ENDPOINTS.PAYMENTS.BY_DEAL(dealId));
    return response.data;
  }

  /**
   * 내 결제 내역 조회
   * @param {Object} params - { status, startDate, endDate, page, size }
   * @returns {Promise}
   */
  async getMyPayments(params = {}) {
    const response = await tradeAPI.get(ENDPOINTS.PAYMENTS.MY_PAYMENTS, { params });
    return response.data;
  }

  /**
   * 결제 상태 조회
   * @param {number} paymentId
   * @returns {Promise}
   */
  async getPaymentStatus(paymentId) {
    const response = await tradeAPI.get(ENDPOINTS.PAYMENTS.STATUS(paymentId));
    return response.data;
  }

  // ============================================
  // 관리자용 API
  // ============================================

  /**
   * 전체 거래 목록 조회 (관리자)
   * @param {Object} params
   * @returns {Promise}
   */
  async getAllDealsAdmin(params = {}) {
    const response = await tradeAPI.get(ENDPOINTS.DEALS.ADMIN.LIST, { params });
    return response.data;
  }

  /**
   * 거래 강제 취소 (관리자)
   * @param {number} dealId
   * @param {string} reason
   * @returns {Promise}
   */
  async forceCancelDeal(dealId, reason) {
    const response = await tradeAPI.post(ENDPOINTS.DEALS.ADMIN.FORCE_CANCEL(dealId), { reason });
    return response.data;
  }

  /**
   * 거래 상태 강제 변경 (관리자)
   * @param {number} dealId
   * @param {string} status
   * @returns {Promise}
   */
  async forceUpdateDealStatus(dealId, status) {
    const response = await tradeAPI.patch(ENDPOINTS.DEALS.ADMIN.UPDATE_STATUS(dealId), { status });
    return response.data;
  }

  /**
   * 전체 결제 목록 조회 (관리자)
   * @param {Object} params
   * @returns {Promise}
   */
  async getAllPaymentsAdmin(params = {}) {
    const response = await tradeAPI.get(ENDPOINTS.PAYMENTS.ADMIN.LIST, { params });
    return response.data;
  }

  /**
   * 결제 강제 취소 (관리자)
   * @param {number} paymentId
   * @param {string} reason
   * @returns {Promise}
   */
  async forceCancelPayment(paymentId, reason) {
    const response = await tradeAPI.post(ENDPOINTS.PAYMENTS.ADMIN.FORCE_CANCEL(paymentId), {
      reason,
    });
    return response.data;
  }

  /**
   * 거래 통계 조회 (관리자)
   * @param {Object} params - { startDate, endDate }
   * @returns {Promise}
   */
  async getDealStatistics(params = {}) {
    const response = await tradeAPI.get(ENDPOINTS.DEALS.ADMIN.STATISTICS, { params });
    return response.data;
  }

  /**
   * 결제 통계 조회 (관리자)
   * @param {Object} params - { startDate, endDate }
   * @returns {Promise}
   */
  async getPaymentStatistics(params = {}) {
    const response = await tradeAPI.get(ENDPOINTS.PAYMENTS.ADMIN.STATISTICS, { params });
    return response.data;
  }
}

export default new TradeService();
