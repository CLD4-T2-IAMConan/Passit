/**
 * 거래 및 결제 관리 Hook
 */
import { useState, useCallback, useEffect } from "react";
import tradeService from "../services/tradeService";
import { handleError } from "../utils/errorHandler";
import { useLoading } from "../contexts/LoadingContext";

export const useTrade = () => {
  const [deals, setDeals] = useState([]);
  const [currentDeal, setCurrentDeal] = useState(null);
  const [payments, setPayments] = useState([]);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalPages: 0,
    totalElements: 0,
  });
  const [error, setError] = useState(null);
  const { loading, startLoading, stopLoading } = useLoading();

  // ============================================
  // 거래(Deal) 관리
  // ============================================

  /**
   * 거래 요청 생성
   */
  const createDealRequest = useCallback(
    async (dealData) => {
      try {
        startLoading();
        setError(null);

        const response = await tradeService.createDealRequest(dealData);

        if (response.success) {
          setCurrentDeal(response.data);
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  /**
   * 거래 수락 (판매자)
   */
  const acceptDeal = useCallback(
    async (dealId) => {
      try {
        startLoading();
        setError(null);

        const response = await tradeService.acceptDeal(dealId);

        if (response.success) {
          setCurrentDeal(response.data);
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  /**
   * 거래 거절 (판매자)
   */
  const rejectDeal = useCallback(
    async (dealId, reason) => {
      try {
        startLoading();
        setError(null);

        const response = await tradeService.rejectDeal(dealId, reason);

        if (response.success) {
          setCurrentDeal(response.data);
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  /**
   * 거래 취소 (구매자)
   */
  const cancelDeal = useCallback(
    async (dealId, reason) => {
      try {
        startLoading();
        setError(null);

        const response = await tradeService.cancelDeal(dealId, reason);

        if (response.success) {
          setCurrentDeal(response.data);
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  /**
   * 거래 확정 (구매자)
   */
  const confirmDeal = useCallback(
    async (dealId) => {
      try {
        startLoading();
        setError(null);

        const response = await tradeService.confirmDeal(dealId);

        if (response.success) {
          setCurrentDeal(response.data);
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  /**
   * 거래 상세 조회
   */
  const fetchDealDetail = useCallback(
    async (dealId) => {
      try {
        startLoading();
        setError(null);

        const response = await tradeService.getDealDetail(dealId);

        if (response.success) {
          setCurrentDeal(response.data);
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  /**
   * 내 거래 목록 조회
   */
  const fetchMyDeals = useCallback(
    async (params = {}) => {
      try {
        startLoading();
        setError(null);

        const response = await tradeService.getMyDeals({
          ...params,
          page: params.page ?? pagination.page,
          size: params.size ?? pagination.size,
        });

        if (response.success) {
          const { content, page, size, totalPages, totalElements } = response.data;

          setDeals(content || []);
          setPagination({
            page,
            size,
            totalPages,
            totalElements,
          });
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [pagination.page, pagination.size, startLoading, stopLoading]
  );

  /**
   * 구매 내역 조회
   */
  const fetchPurchaseHistory = useCallback(
    async (params = {}) => {
      try {
        startLoading();
        setError(null);

        const response = await tradeService.getPurchaseHistory({
          ...params,
          page: params.page ?? pagination.page,
          size: params.size ?? pagination.size,
        });

        if (response.success) {
          const { content, page, size, totalPages, totalElements } = response.data;

          setDeals(content || []);
          setPagination({
            page,
            size,
            totalPages,
            totalElements,
          });
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [pagination.page, pagination.size, startLoading, stopLoading]
  );

  /**
   * 판매 내역 조회
   */
  const fetchSalesHistory = useCallback(
    async (params = {}) => {
      try {
        startLoading();
        setError(null);

        const response = await tradeService.getSalesHistory({
          ...params,
          page: params.page ?? pagination.page,
          size: params.size ?? pagination.size,
        });

        if (response.success) {
          const { content, page, size, totalPages, totalElements } = response.data;

          setDeals(content || []);
          setPagination({
            page,
            size,
            totalPages,
            totalElements,
          });
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [pagination.page, pagination.size, startLoading, stopLoading]
  );

  /**
   * 티켓별 거래 목록 조회
   */
  const fetchDealsByTicket = useCallback(
    async (ticketId, params = {}) => {
      try {
        startLoading();
        setError(null);

        const response = await tradeService.getDealsByTicket(ticketId, params);

        if (response.success) {
          setDeals(response.data || []);
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  // ============================================
  // 결제(Payment) 관리
  // ============================================

  /**
   * 결제 준비
   */
  const preparePayment = useCallback(
    async (paymentData) => {
      try {
        startLoading();
        setError(null);

        const response = await tradeService.preparePayment(paymentData);

        if (response.success) {
          setCurrentPayment(response.data);
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  /**
   * 결제 완료 처리
   */
  const completePayment = useCallback(
    async (paymentResult) => {
      try {
        startLoading();
        setError(null);

        const response = await tradeService.completePayment(paymentResult);

        if (response.success) {
          setCurrentPayment(response.data);
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  /**
   * 결제 취소/환불
   */
  const cancelPayment = useCallback(
    async (paymentId, cancelData) => {
      try {
        startLoading();
        setError(null);

        const response = await tradeService.cancelPayment(paymentId, cancelData);

        if (response.success) {
          setCurrentPayment(response.data);
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  /**
   * 결제 상세 조회
   */
  const fetchPaymentDetail = useCallback(
    async (paymentId) => {
      try {
        startLoading();
        setError(null);

        const response = await tradeService.getPaymentDetail(paymentId);

        if (response.success) {
          setCurrentPayment(response.data);
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  /**
   * 거래별 결제 정보 조회
   */
  const fetchPaymentByDeal = useCallback(
    async (dealId) => {
      try {
        startLoading();
        setError(null);

        const response = await tradeService.getPaymentByDeal(dealId);

        if (response.success) {
          setCurrentPayment(response.data);
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  /**
   * 내 결제 내역 조회
   */
  const fetchMyPayments = useCallback(
    async (params = {}) => {
      try {
        startLoading();
        setError(null);

        const response = await tradeService.getMyPayments({
          ...params,
          page: params.page ?? pagination.page,
          size: params.size ?? pagination.size,
        });

        if (response.success) {
          const { content, page, size, totalPages, totalElements } = response.data;

          setPayments(content || []);
          setPagination({
            page,
            size,
            totalPages,
            totalElements,
          });
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        setError(message);
        return { success: false, error: message };
      } finally {
        stopLoading();
      }
    },
    [pagination.page, pagination.size, startLoading, stopLoading]
  );

  /**
   * 결제 상태 조회
   */
  const fetchPaymentStatus = useCallback(
    async (paymentId) => {
      try {
        const response = await tradeService.getPaymentStatus(paymentId);

        if (response.success) {
          return { success: true, data: response.data };
        }
      } catch (err) {
        const message = handleError(err);
        return { success: false, error: message };
      }
    },
    []
  );

  /**
   * 페이지 변경
   */
  const changePage = useCallback((newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  /**
   * 초기화
   */
  const reset = useCallback(() => {
    setDeals([]);
    setCurrentDeal(null);
    setPayments([]);
    setCurrentPayment(null);
    setError(null);
  }, []);

  return {
    // 상태
    deals,
    currentDeal,
    payments,
    currentPayment,
    pagination,
    loading,
    error,

    // 거래 관리
    createDealRequest,
    acceptDeal,
    rejectDeal,
    cancelDeal,
    confirmDeal,
    fetchDealDetail,
    fetchMyDeals,
    fetchPurchaseHistory,
    fetchSalesHistory,
    fetchDealsByTicket,

    // 결제 관리
    preparePayment,
    completePayment,
    cancelPayment,
    fetchPaymentDetail,
    fetchPaymentByDeal,
    fetchMyPayments,
    fetchPaymentStatus,

    // 유틸리티
    changePage,
    reset,
  };
};

export default useTrade;
