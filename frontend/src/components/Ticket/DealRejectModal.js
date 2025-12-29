// src/components/Tickets/DealRejectModal.js

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  DialogActions,
  Typography,
  TextField,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const DealRejectModal = ({ open, onClose, onConfirmReject }) => {
  const [rejectReason, setRejectReason] = useState("");

  // 모달 닫을 때 상태 초기화
  const handleClose = () => {
    setRejectReason("");
    onClose();
  };

  // 거절 확인 버튼 클릭 시
  const handleConfirm = () => {
    // 거절 사유가 비어있지 않은지 검증 (필수 사항이 아니라면 이 검증을 제거하세요)
    if (!rejectReason.trim()) {
      alert("거절 사유를 입력해주세요.");
      return;
    }

    // 부모 컴포넌트로 사유와 함께 거절 처리 위임
    onConfirmReject(rejectReason);
    setRejectReason(""); // 처리 후 입력 필드 초기화
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" component="span">
          양도 거절 사유 입력
        </Typography>
        <Button onClick={handleClose}>
          <CloseIcon />
        </Button>
      </DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          이 거래 요청을 거절하려면 사유를 입력해주세요. 거절 처리 후 거래는 취소됩니다.
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          id="rejectReason"
          label="거절 사유 (필수)"
          type="text"
          fullWidth
          variant="outlined"
          multiline
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          취소
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={!rejectReason.trim()} // 사유를 입력해야 활성화
        >
          확인 (거래 거절)
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DealRejectModal;
