// src/pages/DealAcceptPage.js

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Stack, Typography, Box, Alert } from "@mui/material"; // Modal 제거
import userService from "../services/userService";
import DealRejectModal from "../components/Ticket/DealRejectModal";
import DealAcceptModal from "../components/Ticket/DealAcceptModal";
import DealCancelModal from "../components/Ticket/DealCancelModal";
import DealConfirmModal from "../components/Ticket/DealConfirmModal";

// CloudFront를 통한 Trade Service 접근 (/api/trades/*, /api/deals/*)
const CLOUDFRONT_URL = process.env.REACT_APP_CLOUDFRONT_URL || "https://d82dq0ggv7fb.cloudfront.net";
const API_BASE_URL = process.env.REACT_APP_TRADE_API_URL || CLOUDFRONT_URL;

const DealAcceptPage = () => {
  // URL에서 deal_id를 가져옵니다.
  const { deal_id } = useParams();
  const navigate = useNavigate();

  // 1. 상태 관리
  const [dealDetail, setDealDetail] = useState(null); // DealDetailResponse 정보를 저장
  const [currentUser, setCurrentUser] = useState(undefined); // undefined: 로딩 중, null: 로딩 실패/미로그인
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 모달 및 액션 상태
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false); // 수락 모달 상태
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false); // 거절 모달 상태
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false); // 취소 모달 상태
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // 🚨 [추가] 구매 확정 모달 상태
  const [isProcessing, setIsProcessing] = useState(false); // API 처리 중 로딩 상태
  const [actionMessage, setActionMessage] = useState(null); // 처리 결과 메시지 (성공/실패)

  // 2. 사용자 정보 로딩 (인증 시스템 연동)
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await userService.getMe();
        setCurrentUser(response.data); // 예: { userId: 4, username: 'seller1' }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        setCurrentUser(null); // 로딩 실패 또는 미로그인
      }
    };
    fetchUserInfo();
  }, []);

  // 3. Deal 상세 정보 로딩 (새로운 API 호출)
  useEffect(() => {
    if (currentUser === undefined) return;

    if (!deal_id) {
      setError("거래 ID가 유효하지 않습니다.");
      setLoading(false);
      return;
    }

    const fetchDealDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`${API_BASE_URL}/api/deals/${deal_id}/detail`);
        const apiResponse = response.data;

        if (!apiResponse.success || !apiResponse.data) {
          throw new Error(apiResponse.error || "거래 상세 정보를 불러오지 못했습니다.");
        }

        setDealDetail(apiResponse.data);
      } catch (err) {
        console.error("❌ Failed to fetch deal detail:", err);
        const errorMessage =
          err.response?.data?.error || err.message || "거래 상세 정보를 불러오는 데 실패했습니다.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDealDetail();
  }, [deal_id, currentUser]);

  const handleGoBack = () => navigate(-1);

  // 4. 상태 기반 변수 정의
  const currentUserId = currentUser?.userId; // 로그인된 사용자 ID
  const deal = dealDetail;
  const isOwner = deal && currentUserId && currentUserId === deal.sellerId; // 판매자(소유자) 여부
  const isBuyer = deal && currentUserId && currentUserId === deal.buyerId; // 구매자(요청자) 여부

  // [핵심] 버튼 활성화 조건: DealStatus가 'PENDING'일 때만 수락/거절 가능
  const isPending = deal && deal.dealStatus === "PENDING";
  const isButtonActive = isOwner && isPending;

  // 구매자는 PENDING 상태일 때만 취소 가능
  const isCancelableByBuyer = isBuyer && isPending;

  // 티켓: SOLD, Deal: PAID, Payments: PAID (paymentsStatus는 dealDetail에 포함되어 있다고 가정)
  const isReadyForCompletion = isBuyer && deal && deal.dealStatus === "PAID";

  // ====================================================================
  // 5. 액션 핸들러 (useCallback 사용하여 의존성 관리 및 안정화)
  // ====================================================================

  // 🚨 5-1. 수락 API 호출 및 처리 핸들러
  const handleConfirmAccept = useCallback(async () => {
    const dealId = deal?.dealId;

    setIsAcceptModalOpen(false);
    if (!dealId) return;

    setIsProcessing(true);
    setActionMessage(null);

    try {
      await axios.put(`${API_BASE_URL}/api/deals/${dealId}/accept`, {
        currentUserId: currentUserId,
      });

      setActionMessage("✅ 양도 요청이 성공적으로 수락되었습니다. 결제 요청이 전송되었습니다.");

      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (err) {
      console.error("❌ 양도 수락 실패:", err);
      const errorMessage = err.response?.data?.error || "수락 처리 중 오류가 발생했습니다.";
      setActionMessage(`❌ 처리 실패: ${errorMessage}`);
      setIsProcessing(false);
    }
  }, [deal, currentUserId]);

  // 🚨 5-2. 거절 API 호출 및 처리 핸들러
  const handleConfirmReject = useCallback(
    async (reason) => {
      const dealId = deal?.dealId;

      setIsRejectModalOpen(false);
      if (!dealId) return;

      setIsProcessing(true);
      setActionMessage(null);

      try {
        await axios.put(`${API_BASE_URL}/api/deals/${dealId}/reject`, {
          cancelReason: reason,
          currentUserId: currentUserId,
        });

        setActionMessage("✅ 양도 요청이 성공적으로 거절되었습니다.");

        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } catch (err) {
        console.error("❌ 양도 거절 실패:", err);
        const errorMessage = err.response?.data?.error || "거절 처리 중 오류가 발생했습니다.";
        setActionMessage(`❌ 처리 실패: ${errorMessage}`);
        setIsProcessing(false);
      }
    },
    [deal, currentUserId]
  );

  // 🚨 5-3. 취소 API 호출 및 처리 핸들러 (구매자 요청)
  const handleConfirmCancel = useCallback(async () => {
    const dealId = deal?.dealId;

    setIsCancelModalOpen(false);
    if (!dealId) {
      setActionMessage("거래 정보를 찾을 수 없습니다.");
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    setActionMessage(null);

    const endpoint = `${API_BASE_URL}/api/deals/${dealId}/cancel`;

    try {
      // PUT /api/deals/{id}/cancel 호출 (BuyerId 전달)
      await axios.put(endpoint, { currentUserId: currentUserId });

      setActionMessage(
        "✅ 거래 요청이 성공적으로 취소되었습니다. 티켓은 AVAILABLE 상태로 돌아갔습니다."
      );

      setTimeout(() => {
        navigate("/mypage/buyer/deals"); // 구매자 거래 목록 페이지로 이동
      }, 3000);
    } catch (err) {
      console.error("❌ 거래 취소 실패:", err);
      const errorMessage =
        err.response?.data?.message || err.response?.data || "취소 처리 중 오류가 발생했습니다.";
      setActionMessage(`❌ 취소 실패: ${errorMessage}`);
      setIsProcessing(false);
    }
  }, [deal, currentUserId, navigate]);

  // 🚨 5-4. 구매 확정 API 호출 및 처리 핸들러 (수정: 모달 닫기 추가)
  const handleConfirmCompletion = useCallback(async () => {
    const dealId = deal?.dealId;

    setIsConfirmModalOpen(false); // 🚨 [수정] 모달을 닫습니다.

    if (!dealId) return;

    setIsProcessing(true);
    setActionMessage(null);

    try {
      // PUT /api/deals/{id}/complete 호출
      await axios.put(`${API_BASE_URL}/api/deals/${dealId}/confirm`, {
        currentUserId: currentUserId,
      });

      setActionMessage("✅ 구매가 최종 확정되었습니다. 거래가 완료 상태로 변경되었습니다.");

      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (err) {
      console.error("❌ 구매 확정 실패:", err);
      const errorMessage = err.response?.data?.error || "구매 확정 처리 중 오류가 발생했습니다.";
      setActionMessage(`❌ 처리 실패: ${errorMessage}`);
      setIsProcessing(false);
    }
  }, [deal, currentUserId]);

  // 6. 렌더링
  if (loading || currentUser === undefined)
    return <Box sx={{ p: 4 }}>거래 정보를 불러오는 중입니다...</Box>;
  if (!currentUser)
    return (
      <Alert severity="error" sx={{ m: 4 }}>
        로그인이 필요하거나 사용자 정보를 불러올 수 없습니다.
      </Alert>
    );
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 4 }}>
        {error}
      </Alert>
    );
  }
  if (!deal)
    return (
      <Alert severity="warning" sx={{ m: 4 }}>
        거래 정보를 찾을 수 없습니다.
      </Alert>
    );

  return (
    <Box className="container mx-auto px-4 py-6 max-w-2xl">
      <nav className="mb-8">
        <button onClick={handleGoBack}>&larr; 목록으로</button>
      </nav>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          textAlign: "center",
        }}
      >
        <Typography variant="h4" component="h1" fontWeight="bold">
          거래 상세: {deal.eventName || "이벤트 이름 없음"}
        </Typography>

        <Stack direction="row" spacing={3} sx={{ my: 2 }}>
          <Typography variant="h6" color={isPending ? "warning.main" : "text.primary"}>
            거래 상태: **{deal.dealStatus}**
          </Typography>
        </Stack>

        {/* 처리 메시지 표시 */}
        {actionMessage && (
          <Alert
            severity={actionMessage.startsWith("✅") ? "success" : "error"}
            sx={{ my: 2, width: "100%" }}
          >
            {actionMessage}
          </Alert>
        )}

        {/* 1. 거래 요약 정보 */}
        <Box
          sx={{
            mt: 3,
            p: 3,
            border: "1px solid #ccc",
            borderRadius: "8px",
            width: "100%",
            textAlign: "left",
          }}
        >
          <Typography variant="h6" gutterBottom>
            거래 요약
          </Typography>
          <Typography>거래 ID: {deal.dealId}</Typography>
          <Typography>
            판매자: {deal.sellerId} {isOwner ? "(나)" : ""}
          </Typography>
          <Typography>
            구매자: {deal.buyerId} {isBuyer ? "(나)" : ""}
          </Typography>
          <Typography>요청 수량: {deal.quantity}개</Typography>
          <Typography>거래 생성일: {new Date(deal.dealAt).toLocaleString()}</Typography>
          <Typography>
            만료일: {deal.expireAt ? new Date(deal.expireAt).toLocaleString() : "N/A"}
          </Typography>
        </Box>

        {/* 2. 티켓 상세 정보 */}
        <Box
          sx={{
            mt: 3,
            p: 3,
            border: "1px solid #ccc",
            borderRadius: "8px",
            width: "100%",
            textAlign: "left",
          }}
        >
          <Typography variant="h6" gutterBottom>
            티켓 상세
          </Typography>
          <Typography>티켓 ID: {deal.ticketId}</Typography>
          <Typography>
            이벤트 날짜: {deal.eventDate ? new Date(deal.eventDate).toLocaleDateString() : "N/A"}
          </Typography>
          <Typography>장소: {deal.eventLocation || "N/A"}</Typography>
          <Typography>좌석 정보: {deal.seatInfo || "N/A"}</Typography>
          <Typography>
            판매 가격: {deal.sellingPrice ? `${deal.sellingPrice.toLocaleString()}원` : "N/A"}
          </Typography>
          <Typography>티켓 상태: {deal.ticketStatus}</Typography>
        </Box>
      </Box>

      {/* 7. 버튼 섹션 */}
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 5 }}>
        {/* 7-1. 판매자 액션: 수락/거절 */}
        {isOwner && (
          <>
            <Button
              variant="contained"
              color="success"
              disabled={!isButtonActive || isProcessing} // PENDING 상태에서만 활성화
              onClick={() => setIsAcceptModalOpen(true)}
            >
              양도 수락
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={!isButtonActive || isProcessing}
              onClick={() => setIsRejectModalOpen(true)}
            >
              양도 거절
            </Button>
            {!isButtonActive && (
              <Typography color="error" sx={{ ml: 2, alignSelf: "center" }}>
                (현재 상태({deal.dealStatus})에서는 처리할 수 없습니다.)
              </Typography>
            )}
          </>
        )}

        {/* 7-2. 구매자 액션: 취소 */}
        {isCancelableByBuyer && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => setIsCancelModalOpen(true)}
            disabled={isProcessing}
          >
            거래 요청 취소
          </Button>
        )}

        {/* 🚨 [구매 확정] 조건 충족 시 구매 확정 버튼 표시 */}
        {isReadyForCompletion && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsConfirmModalOpen(true)} // 🚨 [수정] 모달 열기
            disabled={isProcessing}
          >
            구매 확정 (거래 완료)
          </Button>
        )}
      </Stack>

      {/* 8. 모달 영역 */}

      {/* 8-1. Deal Accept Modal */}
      <DealAcceptModal
        open={isAcceptModalOpen}
        onClose={() => setIsAcceptModalOpen(false)}
        onConfirmAccept={handleConfirmAccept}
      />

      {/* 8-2. Deal Reject Modal */}
      <DealRejectModal
        open={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirmReject={handleConfirmReject}
      />

      {/* 8-3. Deal Cancel Modal (구매자 전용) */}
      <DealCancelModal
        open={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirmCancel={handleConfirmCancel} // 🚨 구매자 취소 로직 연결
      />

      <DealConfirmModal
        open={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirmCompletion={handleConfirmCompletion} // 확정 API 핸들러 전달
      />
    </Box>
  );
};

export default DealAcceptPage;
