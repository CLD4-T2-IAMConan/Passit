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
  Modal,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { userService } from "../api/services/userService";

// ⚠️ 공통 설정
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
  // 🚨 [해결] 모든 Hook은 컴포넌트 내부 최상단에 선언
  const { payment_id } = useParams(); 
  const navigate = useNavigate();

  // 1. 상태 관리
  const [payments, setPayments] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [deal, setDeal] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(undefined); 

  // 2. 사용자 정보 로딩
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await userService.getMe();
        setCurrentUser(response.data); 
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        setCurrentUser(null);
      }
    };
    fetchUserInfo();
  }, []);

  const currentUserId = currentUser?.userId || 1;

  // 3. 데이터 로딩 함수 (useCallback으로 감싸 무한 루프 방지)
  const fetchPaymentData = useCallback(async () => {
    if (!payment_id) return;
    
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/payments/${payment_id}/detail?currentUserId=${currentUserId}`
      );
      const data = response.data;

      setTicket(data.ticket);
      setDeal(data.deal);
      setPayments(data.payments);

      // 🚨 [해결] NaN 방지: 백엔드 DTO 필드명(price)에 맞춰 계산
      const calculatedTotal = (data.ticket?.sellingPrice || 0) * (data.deal?.quantity || 0);
      setTotalPrice(calculatedTotal);

    } catch (err) {
      console.error("데이터 로딩 실패", err);
      setError("거래 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [payment_id, currentUserId]);

  // 사용자 정보가 확인된 후 데이터 호출
  useEffect(() => {
    if (currentUser !== undefined) {
      fetchPaymentData();
    }
  }, [fetchPaymentData, currentUser]);

  // 4. 핸들러 함수들
  const handleCancelClick = () => setIsCancelModalOpen(true);

  const handleConfirmCancel = async () => {
    setIsCancelModalOpen(false);
    try {
      setLoading(true);
      await axios.put(`${API_BASE_URL}/api/deals/${deal.dealId}/cancel`, {
        cancelReason: "구매자가 결제 페이지에서 직접 취소함"
      }, {
        params: { buyerId: currentUserId }
      });

      alert("주문이 정상적으로 취소되었습니다.");
      navigate("/deals"); 

    } catch (err) {
      console.error("Cancel order failed:", err);
      alert("주문 취소 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayClick = () => setIsPaymentModalOpen(true);

  const handleConfirmPayment = useCallback(async () => {
    setIsPaymentModalOpen(false); 

    if (!payment_id) {
      alert("결제 ID를 찾을 수 없습니다.");
      return;
    }

    try {
      const prepareResponse = await axios.get(
        `${API_BASE_URL}/api/payments/${payment_id}/prepare`,
        { params: { currentUserId: currentUserId } }
      );
      const data = prepareResponse.data;

      if (!window.AUTHNICE) {
        throw new Error("NICEPAY SDK가 로드되지 않았습니다.");
      }

      window.AUTHNICE.requestPay({
        clientId: data.clientId,
        method: "card",
        orderId: data.orderId,
        amount: data.amount,
        goodsName: data.goodsName,
        returnUrl: data.returnUrl,

        fnError: function (result) {
          alert(`결제 실패: ${result.msg}`);
          fetchPaymentData();
        },
      });
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message;
      alert(`결제 준비 실패: ${errorMessage}`);
    }
  }, [payment_id, fetchPaymentData, currentUserId]);

  // 5. 조건부 렌더링 (로딩/에러)
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
            결제 대상: {ticket.eventName}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body1" color="text.secondary">단위 가격:</Typography>
              <Typography variant="subtitle1">{(ticket.sellingPrice || 0).toLocaleString()}원</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1" color="text.secondary">수량:</Typography>
              <Typography variant="subtitle1">{deal.quantity}개</Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, p: 2, borderTop: "1px dashed #ccc", textAlign: "right" }}>
            <Typography variant="h5" color="error">
              총 결제 금액: {(totalPrice || 0).toLocaleString()}원
            </Typography>
            <Typography variant="caption" color="text.secondary">
              현재 상태: {payments.paymentStatus}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* 하단 버튼 섹션 */}
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 5 }}>
        <Button
          variant="outlined"
          color="error"
          size="large"
          onClick={handleCancelClick}
          disabled={!isPaymentPending}
          sx={{ px: 4 }}
        >
          주문 취소하기
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handlePayClick}
          disabled={!isPaymentPending}
          sx={{ px: 4 }}
        >
          결제하기
        </Button>
      </Stack>

      {/* 1. 주문 취소 확인 모달 */}
      <Modal open={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>주문 취소 확인</Typography>
          <Typography variant="body1" sx={{ my: 2, color: 'text.secondary' }}>
            정말로 이 주문을 취소하시겠습니까?<br />
            취소하시면 티켓이 다시 판매 상태로 변경됩니다.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
            <Button onClick={() => setIsCancelModalOpen(false)} variant="outlined" color="inherit">돌아가기</Button>
            <Button onClick={handleConfirmCancel} variant="contained" color="error">주문 취소 확정</Button>
          </Stack>
        </Box>
      </Modal>

      {/* 2. 결제 정보 확인 모달 (NICEPAY 호출 전 최종 확인) */}
      <Modal open={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)}>
        <Box sx={modalStyle}>
          <DialogTitle sx={{ fontWeight: "bold" }}>결제 정보 확인</DialogTitle>
          <DialogContent dividers sx={{ p: 2 }}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 3 }}>
              {/* 좌측: 티켓 이미지 */}
              <Box sx={{ width: { xs: "100%", sm: "40%" }, height: "150px", borderRadius: "12px", overflow: "hidden", border: "1px solid #e0e0e0" }}>
                <img src={ticket.imageUrl || "https://via.placeholder.com/150"} alt={ticket.eventName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </Box>
              {/* 우측: 정보 */}
              <Box sx={{ flex: 1, textAlign: "left" }}>
                <Stack spacing={1}>
                  <Typography variant="h6" fontWeight="bold">{ticket.eventName}</Typography>
                  <Typography variant="body2" color="text.secondary">공연일자: {ticket.eventDate}</Typography>
                  <Typography variant="body2" color="text.secondary">좌석정보: {ticket.seatInfo || "정보 없음"}</Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold" sx={{ mt: 1 }}>
                    {(ticket.sellingPrice || 0).toLocaleString()}원 / 개
                  </Typography>
                  <Typography fontWeight="bold">수량: {deal.quantity}개</Typography>
                </Stack>
              </Box>
            </Box>
            <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mt: 3, borderTop: "1px solid #eee", pt: 2 }}>
              <Typography variant="body1" sx={{ mr: 2 }}>총 결제 금액:</Typography>
              <Typography variant="h5" color="error" fontWeight="bold">{(totalPrice || 0).toLocaleString()}원</Typography>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: "center" }}>
            <Button onClick={() => setIsPaymentModalOpen(false)} color="inherit" variant="outlined">취소</Button>
            <Button onClick={handleConfirmPayment} variant="contained" color="primary" sx={{ px: 4 }}>결제하기</Button>
          </DialogActions>
        </Box>
      </Modal>
    </Box>
  );
};

export default BuyerPaymentPage;