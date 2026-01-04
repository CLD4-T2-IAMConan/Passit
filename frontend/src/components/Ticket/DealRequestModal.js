// frontend/src/components/Ticket/DealRequestModal.js
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  IconButton,
} from "@mui/material";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import { ConfirmationNumber } from "@mui/icons-material";

// 부모 컴포넌트로부터 open 상태, 닫기 함수, 티켓 정보를 받습니다.
const DealRequestModal = ({ open, onClose, ticket, onConfirm }) => {
  const [quantity, setQuantity] = useState(1); // 수량 상태 관리 (초기값 1)

  // 수량 감소 함수 (최소 1개)
  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // 수량 증가 함수 (최대 수량 제한 로직 추가 가능)
  const handleIncrease = () => {
    setQuantity(quantity + 1);
  };

  // 구매 확정 버튼 클릭 시 호출될 함수
  const handleConfirmClick = () => {
    // 1. 수량 유효성 검사 (예시)
    if (quantity <= 0) {
      alert("수량을 1개 이상 입력해주세요.");
      return;
    }
    // ticketId 또는 id 중 사용 가능한 값 사용
    const ticketId = ticket.ticketId || ticket.id;
    if (!ticketId) {
      alert("티켓 ID를 찾을 수 없습니다.");
      return;
    }
    console.log(`구매 확정: 티켓 ID ${ticketId}, 수량 ${quantity}`);
    onConfirm(ticketId, quantity);
    onClose(); // 모달 닫기
  };

  if (!ticket) return null; // 티켓 정보가 없으면 렌더링 안 함

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>구매 정보 확인</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 3 }}>
          {/* 🖼️ 좌측: 티켓 이미지 */}
          <Box
            sx={{
              width: { xs: "100%", sm: "40%" },
              height: "200px",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid #e0e0e0",
              bgcolor: "grey.300",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {ticket.image1 || ticket.imageUrl ? (
              <Box
                component="img"
                src={ticket.image1 || ticket.imageUrl}
                alt={ticket.eventName}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : null}
            {/* 기본 아이콘 (이미지가 없거나 로드 실패 시 표시) */}
            {!ticket.image1 && !ticket.imageUrl && (
              <ConfirmationNumber sx={{ fontSize: 60, color: "grey.400" }} />
            )}
          </Box>

          {/* 📝 우측: 티켓 정보 및 수량 선택 */}
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
                공연일자:{" "}
                {ticket.eventDate
                  ? new Date(ticket.eventDate).toLocaleString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "날짜 미정"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                좌석정보: {ticket.seatInfo || "정보 없음"}
              </Typography>
              <Typography variant="h6" color="primary" fontWeight="bold" sx={{ mt: 2 }}>
                {ticket.sellingPrice?.toLocaleString()}원
              </Typography>
            </Stack>

            {/* ➕➖ 수량 선택 영역 */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 3 }}>
              <Typography fontWeight="bold">수량 선택</Typography>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ border: "1px solid #e0e0e0", borderRadius: "8px", p: 0.5 }}
              >
                <IconButton onClick={handleDecrease} size="small" disabled={quantity <= 1}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ minWidth: "30px", textAlign: "center", fontWeight: "bold" }}>
                  {quantity}
                </Typography>
                <IconButton onClick={handleIncrease} size="small">
                  <AddIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>

            {/* 총 결제 금액 예상 표시 (선택 사항) */}
            <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mt: 3 }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                총 결제 예정 금액:
              </Typography>
              <Typography variant="h5" color="error" fontWeight="bold">
                {(ticket.sellingPrice * quantity).toLocaleString()}원
              </Typography>
            </Stack>
          </Box>
        </Box>
      </DialogContent>

      {/* 하단 버튼 액션 */}
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} color="inherit" variant="outlined" sx={{ borderRadius: "8px" }}>
          취소
        </Button>
        <Button
          onClick={handleConfirmClick}
          variant="contained"
          color="primary"
          sx={{ borderRadius: "8px", px: 4 }}
        >
          양도 요청하기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DealRequestModal;
