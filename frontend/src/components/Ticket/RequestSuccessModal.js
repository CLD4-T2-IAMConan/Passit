// src/components/Ticket/RequestSuccessModal.js (새로 생성)

import React from 'react';
import { Dialog, DialogTitle, DialogContent, Button, DialogActions, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const RequestSuccessModal = ({ open, onClose }) => {
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
        <Button onClick={onClose} variant="contained" color="primary">
          확인
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RequestSuccessModal;