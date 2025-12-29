/**
 * 문의 관리 Hook
 */
import { useState, useCallback, useEffect } from "react";
import csService from "../services/csService";
import { handleError } from "../utils/errorHandler";
import { useLoading } from "../contexts/LoadingContext";

export const useInquiries = (initialParams = {}) => {
  const [inquiries, setInquiries] = useState([]);
  const [currentInquiry, setCurrentInquiry] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalPages: 0,
    totalElements: 0,
  });
  const [filters, setFilters] = useState({
    status: null, // PENDING, ANSWERED, CLOSED
    categoryId: null,
    sortBy: "createdAt",
    sortDirection: "DESC",
    ...initialParams,
  });
  const [error, setError] = useState(null);
  const { loading, startLoading, stopLoading } = useLoading();

  /**
   * 내 문의 목록 조회
   */
  const fetchMyInquiries = useCallback(
    async (params = {}) => {
      try {
        startLoading();
        setError(null);

        const searchParams = {
          ...filters,
          ...params,
          page: params.page ?? pagination.page,
          size: params.size ?? pagination.size,
        };

        const response = await csService.getMyInquiries(searchParams);

        if (response.success) {
          const { content, page, size, totalPages, totalElements } = response.data;

          setInquiries(content || []);
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
    [filters, pagination.page, pagination.size, startLoading, stopLoading]
  );

  /**
   * 문의 상세 조회
   */
  const fetchInquiryDetail = useCallback(
    async (inquiryId) => {
      try {
        startLoading();
        setError(null);

        const response = await csService.getInquiryDetail(inquiryId);

        if (response.success) {
          setCurrentInquiry(response.data);

          // 답변이 있는 경우 답변 조회
          if (response.data.status === "ANSWERED") {
            const answerResponse = await csService.getInquiryAnswer(inquiryId);
            if (answerResponse.success) {
              setAnswer(answerResponse.data);
            }
          }

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
   * 문의 생성
   */
  const createInquiry = useCallback(
    async (inquiryData) => {
      try {
        startLoading();
        setError(null);

        const response = await csService.createInquiry(inquiryData);

        if (response.success) {
          setCurrentInquiry(response.data);
          // 목록 새로고침
          await fetchMyInquiries();
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
    [fetchMyInquiries, startLoading, stopLoading]
  );

  /**
   * 문의 수정 (본인만)
   */
  const updateInquiry = useCallback(
    async (inquiryId, inquiryData) => {
      try {
        startLoading();
        setError(null);

        const response = await csService.updateInquiry(inquiryId, inquiryData);

        if (response.success) {
          setCurrentInquiry(response.data);
          // 목록 새로고침
          await fetchMyInquiries();
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
    [fetchMyInquiries, startLoading, stopLoading]
  );

  /**
   * 문의 삭제 (본인만)
   */
  const deleteInquiry = useCallback(
    async (inquiryId) => {
      try {
        startLoading();
        setError(null);

        const response = await csService.deleteInquiry(inquiryId);

        if (response.success) {
          setCurrentInquiry(null);
          setInquiries((prev) => prev.filter((inquiry) => inquiry.id !== inquiryId));
          return { success: true };
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
  // 관리자 기능
  // ============================================

  /**
   * 전체 문의 목록 조회 (관리자)
   */
  const fetchAllInquiriesAdmin = useCallback(
    async (params = {}) => {
      try {
        startLoading();
        setError(null);

        const searchParams = {
          ...filters,
          ...params,
          page: params.page ?? pagination.page,
          size: params.size ?? pagination.size,
        };

        const response = await csService.getAllInquiriesAdmin(searchParams);

        if (response.success) {
          const { content, page, size, totalPages, totalElements } = response.data;

          setInquiries(content || []);
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
    [filters, pagination.page, pagination.size, startLoading, stopLoading]
  );

  /**
   * 문의 답변 작성 (관리자)
   */
  const answerInquiry = useCallback(
    async (inquiryId, answerData) => {
      try {
        startLoading();
        setError(null);

        const response = await csService.answerInquiry(inquiryId, answerData);

        if (response.success) {
          setAnswer(response.data);
          // 현재 문의 상태 업데이트
          if (currentInquiry?.id === inquiryId) {
            setCurrentInquiry((prev) => ({
              ...prev,
              status: "ANSWERED",
            }));
          }
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
    [currentInquiry, startLoading, stopLoading]
  );

  /**
   * 문의 상태 변경 (관리자)
   */
  const updateInquiryStatus = useCallback(
    async (inquiryId, status) => {
      try {
        startLoading();
        setError(null);

        const response = await csService.updateInquiryStatus(inquiryId, status);

        if (response.success) {
          // 현재 문의 상태 업데이트
          if (currentInquiry?.id === inquiryId) {
            setCurrentInquiry((prev) => ({
              ...prev,
              status,
            }));
          }
          // 목록에서도 업데이트
          setInquiries((prev) =>
            prev.map((inquiry) => (inquiry.id === inquiryId ? { ...inquiry, status } : inquiry))
          );
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
    [currentInquiry, startLoading, stopLoading]
  );

  /**
   * 문의 강제 삭제 (관리자)
   */
  const forceDeleteInquiry = useCallback(
    async (inquiryId) => {
      try {
        startLoading();
        setError(null);

        const response = await csService.forceDeleteInquiry(inquiryId);

        if (response.success) {
          setCurrentInquiry(null);
          setInquiries((prev) => prev.filter((inquiry) => inquiry.id !== inquiryId));
          return { success: true };
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
   * 상태 필터 업데이트
   */
  const updateStatus = useCallback((status) => {
    setFilters((prev) => ({ ...prev, status }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  }, []);

  /**
   * 카테고리 필터 업데이트
   */
  const updateCategory = useCallback((categoryId) => {
    setFilters((prev) => ({ ...prev, categoryId }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  }, []);

  /**
   * 필터 업데이트
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  }, []);

  /**
   * 페이지 변경
   */
  const changePage = useCallback((newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  /**
   * 페이지 크기 변경
   */
  const changePageSize = useCallback((newSize) => {
    setPagination((prev) => ({ ...prev, size: newSize, page: 0 }));
  }, []);

  /**
   * 정렬 변경
   */
  const changeSorting = useCallback((sortBy, sortDirection = "DESC") => {
    setFilters((prev) => ({ ...prev, sortBy, sortDirection }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  }, []);

  /**
   * 필터 초기화
   */
  const resetFilters = useCallback(() => {
    setFilters({
      status: null,
      categoryId: null,
      sortBy: "createdAt",
      sortDirection: "DESC",
    });
    setPagination((prev) => ({ ...prev, page: 0 }));
  }, []);

  /**
   * 현재 문의 초기화
   */
  const resetCurrentInquiry = useCallback(() => {
    setCurrentInquiry(null);
    setAnswer(null);
  }, []);

  /**
   * 새로고침
   */
  const refresh = useCallback(() => {
    fetchMyInquiries();
  }, [fetchMyInquiries]);

  // 필터나 페이지 변경 시 자동 조회
  useEffect(() => {
    fetchMyInquiries();
  }, [filters, pagination.page, pagination.size]);

  return {
    // 상태
    inquiries,
    currentInquiry,
    answer,
    pagination,
    filters,
    loading,
    error,

    // 조회 함수
    fetchMyInquiries,
    fetchInquiryDetail,

    // CRUD 함수
    createInquiry,
    updateInquiry,
    deleteInquiry,

    // 관리자 기능
    fetchAllInquiriesAdmin,
    answerInquiry,
    updateInquiryStatus,
    forceDeleteInquiry,

    // 필터/페이지 관리
    updateStatus,
    updateCategory,
    updateFilters,
    changePage,
    changePageSize,
    changeSorting,
    resetFilters,
    resetCurrentInquiry,
    refresh,
  };
};

export default useInquiries;
