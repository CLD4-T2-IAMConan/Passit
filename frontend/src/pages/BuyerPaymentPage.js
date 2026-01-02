// src/pages/BuyerPaymentPage.js

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Modal, // MUI Modal 컴포넌트
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
// 🚨 [추가] userService import
import { userService } from "../api/services/userService";

// ⚠️ 임시 설정
const API_BASE_URL = "http://localhost:8083";

// 🌟 MUI 커스텀 모달 스타일
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  textAlign: "center",
};

const BuyerPaymentPage = () => {
  // URL에서 payment_id를 가져옴 (라우팅: /payments/:payment_id/detail)
  const { payment_id } = useParams();
  const navigate = useNavigate();

  // 1. 상태 관리
  const [payments, setPayments] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // 🚨 [추가] 인증된 사용자 정보를 위한 상태
  const [currentUser, setCurrentUser] = useState(undefined); // undefined: 로딩 중

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

  // 3. 상태 기반 변수 정의
  // 🚨 [수정] 로그인된 사용자 ID를 currentUser에서 가져옴
  const currentUserId = currentUser?.userId;

  // ----------------------------------------------------
  // 4. 데이터 로딩 및 접근 권한 확인 (GET /api/payments/{id}/details)
  // ----------------------------------------------------
  const fetchPaymentData = useCallback(async () => {
    // 🚨 [수정] currentUser 로딩이 완료될 때까지 대기
    if (currentUser === undefined || currentUser === null) return;

    if (!payment_id) {
      setError("결제 ID가 유효하지 않습니다.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null); // 오류 초기화

      // 🚨 [수정] API 호출 시, 인증된 사용자 ID를 백엔드로 전송
      const response = await axios.get(`${API_BASE_URL}/api/payments/${payment_id}/detail`, {
        params: {
          currentUserId: currentUserId, // 백엔드에서 인증 확인용으로 사용 가능
        },
      });

      const data = response.data;

      // 🌟 권한 검사 (프론트에서 이중 체크): 현재 사용자 ID와 Payments의 buyerId 비교
      if (data.payments.buyerId !== currentUserId) {
        // 서버에서 이미 403을 반환했겠지만, 프론트에서 명시적인 메시지를 제공
        setError("해당 결제 정보를 조회할 권한이 없습니다.");
        setLoading(false);
        return;
      }

      setPayments(data.payments);
      setTicket(data.ticket);
      setDeal(data.deal);
    } catch (err) {
      console.error("Failed to fetch payment data:", err);
      // 🚨 [수정] 에러 메시지 처리 강화
      const errorMessage =
        err.response?.data?.error || err.response?.data || "정보를 불러오는 데 실패했습니다.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [payment_id, currentUserId, currentUser]); // 🚨 [수정] 의존성 배열에 currentUserId 추가

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  // ----------------------------------------------------
  // 5. 버튼 핸들러 (결제 로직)
  // ----------------------------------------------------
  const handlePayClick = () => {
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = useCallback(async () => {
    setIsPaymentModalOpen(false); // 모달 닫기

    if (!payment_id) {
      alert("결제 ID를 찾을 수 없습니다.");
      return;
    }

    try {
      // 1. 백엔드에서 결제 준비 데이터 가져오기 (GET /api/payments/{id}/prepare)
      // 🚨 [수정] 결제 준비 API 호출 시에도 currentUserId 전송을 고려할 수 있습니다.
      const prepareResponse = await axios.get(
        `${API_BASE_URL}/api/payments/${payment_id}/prepare`,
        {
          params: {
            currentUserId: currentUserId,
          },
        }
      );
      const data = prepareResponse.data;

      // 2. NICEPAY SDK가 로드되었는지 확인
      if (!window.AUTHNICE) {
        throw new Error("NICEPAY SDK가 로드되지 않았습니다. index.html을 확인하세요.");
      }

      // 3. NICEPAY 결제창 호출
      window.AUTHNICE.requestPay({
        clientId: data.clientId,
        method: "card",
        orderId: data.orderId,
        amount: data.amount,
        goodsName: data.goodsName,
        returnUrl: data.returnUrl,

        fnError: function (result) {
          alert(`결제 실패: ${result.msg}`);
          console.error("NICEPAY Error:", result);
          fetchPaymentData();
        },
      });
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message;
      alert(`결제 준비 실패: ${errorMessage}`);
      console.error("결제 준비 실패:", err);
    }
  }, [payment_id, fetchPaymentData, currentUserId]); // 🚨 [수정] 의존성 배열에 currentUserId 추가

  // ----------------------------------------------------
  // 6. 렌더링 및 UI
  // ----------------------------------------------------

  if (currentUser === undefined || loading)
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  if (currentUser === null)
    return (
      <Alert severity="error" sx={{ m: 4 }}>
        사용자 정보를 불러오지 못했거나 로그인되어 있지 않습니다.
      </Alert>
    );

  if (error)
    return (
      <Alert severity="error" sx={{ m: 4 }}>
        {error}
      </Alert>
    );
  if (!payments || !ticket || !deal)
    return (
      <Alert severity="warning" sx={{ m: 4 }}>
        필요한 거래 정보를 찾을 수 없습니다.
      </Alert>
    );

  const isPaymentPending = payments.paymentStatus === "PENDING";
  const totalPrice = ticket.sellingPrice * deal.quantity;

  return (
    <Box className="container mx-auto px-4 py-6 max-w-2xl">
      <Typography variant="h4" component="h1" gutterBottom align="center" fontWeight="bold">
        구매 정보 확인 및 결제 (구매자 전용)
      </Typography>

      <Alert severity="info" sx={{ my: 3 }}>
        티켓 구매를 위해 결제를 진행해주세요.
      </Alert>

      {/* 티켓 및 결제 정보 요약 UI */}
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            결제 대상: {ticket.eventName || "티켓 이름"}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body1" color="text.secondary">
                단위 가격:
              </Typography>
              <Typography variant="subtitle1">
                {ticket.sellingPrice?.toLocaleString() || "0"}원
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1" color="text.secondary">
                수량:
              </Typography>
              <Typography variant="subtitle1">{deal.quantity}개</Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, p: 2, borderTop: "1px dashed #ccc", textAlign: "right" }}>
            <Typography variant="h5" color="error">
              총 결제 금액: {totalPrice.toLocaleString()}원
            </Typography>
            <Typography variant="caption" color="text.secondary">
              현재 상태: {payments.paymentStatus}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* 버튼 섹션 (결제 버튼만 남음) */}
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 5 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handlePayClick}
          disabled={!isPaymentPending}
        >
          결제하기
        </Button>
      </Stack>

      {/* 🌟🌟 결제 정보 확인 모달 (유지) 🌟🌟 */}
      <Modal
        open={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        aria-labelledby="payment-modal-title"
        aria-describedby="payment-modal-description"
      >
        <Box sx={modalStyle}>
          <DialogTitle sx={{ fontWeight: "bold" }}>결제 정보 확인</DialogTitle>

          <DialogContent dividers sx={{ p: 2 }}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 3 }}>
              {/* 🖼️ 좌측: 티켓 이미지 */}
              <Box
                sx={{
                  width: { xs: "100%", sm: "40%" },
                  height: "150px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "1px solid #e0e0e0",
                }}
              >
                {/* 🚨 이미지 URL이 필요합니다. 임시 URL을 사용하거나 백엔드 데이터에 맞춰 수정하세요. */}
                <img
                  src={ticket.imageUrl || "https://via.placeholder.com/150"}
                  alt={ticket.eventName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Box>

              {/* 📝 우측: 티켓 정보 및 금액 */}
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <Stack spacing={1}>
                  <Typography variant="h6" fontWeight="bold">
                    {ticket.eventName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    공연일자: {ticket.eventDate}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    좌석정보: {ticket.seatInfo || "정보 없음"}
                  </Typography>

                  {/* 💰 단위 가격 */}
                  <Typography variant="h6" color="primary" fontWeight="bold" sx={{ mt: 2 }}>
                    {(totalPrice / deal.quantity).toLocaleString()}원 / 개
                  </Typography>

                  {/* 🌟 수량 표시 */}
                  <Typography fontWeight="bold" sx={{ mt: 1 }}>
                    수량: {deal.quantity}개
                  </Typography>
                </Stack>
              </Box>
            </Box>

            {/* 💰 총 결제 금액 */}
            <Stack
              direction="row"
              justifyContent="flex-end"
              alignItems="center"
              sx={{ mt: 3, borderTop: "1px solid #eee", pt: 2 }}
            >
              <Typography variant="body1" sx={{ mr: 2 }}>
                총 결제 금액:
              </Typography>
              <Typography variant="h5" color="error" fontWeight="bold">
                {totalPrice.toLocaleString()}원
              </Typography>
            </Stack>
          </DialogContent>

          {/* 하단 버튼 액션 */}
          <DialogActions sx={{ p: 2.5, justifyContent: "center" }}>
            <Button
              onClick={() => setIsPaymentModalOpen(false)}
              color="inherit"
              variant="outlined"
              sx={{ borderRadius: "8px" }}
            >
              취소
            </Button>
            <Button
              onClick={handleConfirmPayment}
              variant="contained"
              color="primary"
              sx={{ borderRadius: "8px", px: 4 }}
            >
              결제하기
            </Button>
          </DialogActions>
        </Box>
      </Modal>
    </Box>
  );
};

export default BuyerPaymentPage;
