// src/components/Tickets/DealAcceptModal.js

import React from 'react';
import { Dialog, DialogTitle, DialogContent, Button, DialogActions, Typography, Box } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';

const DealAcceptModal = ({ open, onClose, onConfirmAccept }) => {

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">

            {/* 제목 영역 */}
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: 1 // 내용과의 간격 조정
            }}>
                {/* 🚨 HTML 구조 오류 방지를 위해 component="span"을 사용합니다. */}
                <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
                    양도 수락 확인
                </Typography>
                <Button onClick={onClose}><CloseIcon /></Button>
            </DialogTitle>

            {/* 내용 영역 */}
            <DialogContent dividers sx={{ textAlign: 'center' }}>
                <CheckCircleOutlineIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    양도를 수락하시겠습니까?
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
                    확인 시, **구매자에게 결제 요청이 전송**되며 거래가 다음 단계로 진행됩니다.
                </Typography>
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    수락 후에는 취소가 어려울 수 있습니다. 신중하게 결정해 주세요.
                </Typography>
            </DialogContent>

            {/* 액션 버튼 영역 */}
            <DialogActions>
                <Button onClick={onClose} variant="outlined">
                    취소
                </Button>
                <Button
                    onClick={onConfirmAccept}
                    variant="contained"
                    color="success"
                >
                    확인 (양도 수락)
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DealAcceptModal;