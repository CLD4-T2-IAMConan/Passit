// src/components/Ticket/RequestSuccessModal.js

import React from 'react';
import { Dialog, DialogTitle, DialogContent, Button, DialogActions, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// 🚨 onConfirmReload prop을 추가합니다.
const RequestSuccessModal = ({ open, onClose, onConfirmReload }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', color: 'green' }}>
        <CheckCircleIcon sx={{ mr: 1 }} /> 양도 요청 완료
      </DialogTitle>
      <DialogContent dividers>
        <Typography>
          티켓 판매자에게 양도 요청이 성공적으로 전달되었습니다.
        </Typography>
        <Typography sx={{ mt: 1 }}>
          판매자가 요청을 수락하면 거래가 진행됩니다.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onConfirmReload} // 이 함수가 새로고침을 담당
          variant="contained"
          color="primary"
        >
          확인
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RequestSuccessModal;