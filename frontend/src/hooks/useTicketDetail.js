/**
 * 티켓 상세 및 CRUD 관리 Hook
 */
import { useState, useCallback } from "react";
import ticketService from "../services/ticketService";
import { handleError } from "../utils/errorHandler";
import { useLoading } from "../contexts/LoadingContext";

export const useTicketDetail = (ticketId = null) => {
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState(null);
  const { loading, startLoading, stopLoading } = useLoading();

  /**
   * 티켓 상세 조회
   */
  const fetchTicketDetail = useCallback(
    async (id = ticketId) => {
      if (!id) {
        setError("티켓 ID가 필요합니다.");
        return { success: false, error: "티켓 ID가 필요합니다." };
      }

      try {
        startLoading();
        setError(null);

        const response = await ticketService.getTicketDetail(id);

        if (response.success) {
          setTicket(response.data);
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
    [ticketId, startLoading, stopLoading]
  );

  /**
   * 티켓 생성
   * @param {Object} ticketData - { title, description, category, region, price, eventDate, venue, seatInfo, images[] }
   */
  const createTicket = useCallback(
    async (ticketData) => {
      try {
        startLoading();
        setError(null);

        // FormData 생성
        const formData = new FormData();

        // 이미지 파일 추가
        if (ticketData.images && ticketData.images.length > 0) {
          ticketData.images.forEach((image) => {
            formData.append("images", image);
          });
        }

        // 나머지 데이터 추가
        Object.keys(ticketData).forEach((key) => {
          if (key !== "images") {
            formData.append(key, ticketData[key]);
          }
        });

        const response = await ticketService.createTicket(formData);

        if (response.success) {
          setTicket(response.data);
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
   * 티켓 수정
   * @param {number} id - 티켓 ID
   * @param {Object} ticketData - 수정할 데이터
   */
  const updateTicket = useCallback(
    async (id = ticketId, ticketData) => {
      if (!id) {
        setError("티켓 ID가 필요합니다.");
        return { success: false, error: "티켓 ID가 필요합니다." };
      }

      try {
        startLoading();
        setError(null);

        // FormData 생성
        const formData = new FormData();

        // 이미지 파일 추가
        if (ticketData.images && ticketData.images.length > 0) {
          ticketData.images.forEach((image) => {
            formData.append("images", image);
          });
        }

        // 나머지 데이터 추가
        Object.keys(ticketData).forEach((key) => {
          if (key !== "images" && ticketData[key] !== undefined && ticketData[key] !== null) {
            formData.append(key, ticketData[key]);
          }
        });

        const response = await ticketService.updateTicket(id, formData);

        if (response.success) {
          setTicket(response.data);
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
    [ticketId, startLoading, stopLoading]
  );

  /**
   * 티켓 삭제
   */
  const deleteTicket = useCallback(
    async (id = ticketId) => {
      if (!id) {
        setError("티켓 ID가 필요합니다.");
        return { success: false, error: "티켓 ID가 필요합니다." };
      }

      try {
        startLoading();
        setError(null);

        const response = await ticketService.deleteTicket(id);

        if (response.success) {
          setTicket(null);
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
    [ticketId, startLoading, stopLoading]
  );

  /**
   * 티켓 상태 변경
   * @param {string} status - AVAILABLE, RESERVED, SOLD, EXPIRED, DELETED
   */
  const updateTicketStatus = useCallback(
    async (status, id = ticketId) => {
      if (!id) {
        setError("티켓 ID가 필요합니다.");
        return { success: false, error: "티켓 ID가 필요합니다." };
      }

      try {
        startLoading();
        setError(null);

        const response = await ticketService.updateTicketStatus(id, status);

        if (response.success) {
          setTicket((prev) => (prev ? { ...prev, status } : null));
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
    [ticketId, startLoading, stopLoading]
  );

  /**
   * 티켓 이미지 업로드
   */
  const uploadImages = useCallback(
    async (images, id = ticketId) => {
      if (!id) {
        setError("티켓 ID가 필요합니다.");
        return { success: false, error: "티켓 ID가 필요합니다." };
      }

      try {
        startLoading();
        setError(null);

        const response = await ticketService.uploadTicketImages(id, images);

        if (response.success) {
          // 티켓 정보 새로고침
          await fetchTicketDetail(id);
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
    [ticketId, fetchTicketDetail, startLoading, stopLoading]
  );

  /**
   * 티켓 이미지 삭제
   */
  const deleteImage = useCallback(
    async (imageId, id = ticketId) => {
      if (!id) {
        setError("티켓 ID가 필요합니다.");
        return { success: false, error: "티켓 ID가 필요합니다." };
      }

      try {
        startLoading();
        setError(null);

        const response = await ticketService.deleteTicketImage(id, imageId);

        if (response.success) {
          // 티켓 정보 새로고침
          await fetchTicketDetail(id);
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
    [ticketId, fetchTicketDetail, startLoading, stopLoading]
  );

  /**
   * 티켓 정보 초기화
   */
  const resetTicket = useCallback(() => {
    setTicket(null);
    setError(null);
  }, []);

  return {
    // 상태
    ticket,
    loading,
    error,

    // CRUD 함수
    fetchTicketDetail,
    createTicket,
    updateTicket,
    deleteTicket,
    updateTicketStatus,

    // 이미지 관리
    uploadImages,
    deleteImage,

    // 유틸리티
    resetTicket,
  };
};

export default useTicketDetail;
