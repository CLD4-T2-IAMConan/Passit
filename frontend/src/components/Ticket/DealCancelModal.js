// src/components/Deals/DealCancelModal.js

import React from 'react';
import { Dialog, DialogTitle, DialogContent, Button, DialogActions, Typography, Box } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';

// 🌟 MUI 커스텀 모달 스타일 (재사용을 위해 컴포넌트 파일에 포함)
const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
    textAlign: 'center'
};


const DealCancelModal = ({ open, onClose, onConfirmCancel }) => {

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">

            {/* 제목 영역 */}
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: 1
            }}>
                <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
                    양도 취소 확인
                </Typography>
                <Button onClick={onClose}><CloseIcon /></Button>
            </DialogTitle>

            {/* 내용 영역 */}
            <DialogContent dividers sx={{ textAlign: 'center' }}>
                <WarningIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    정말로 이 거래를 취소하시겠습니까?
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
                    취소 시, 거래가 즉시 종료되며 **티켓은 재고 (AVAILABLE) 상태로 복구**됩니다.
                </Typography>
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    이 작업은 되돌릴 수 없습니다. 신중하게 진행해주세요.
                </Typography>
            </DialogContent>

            {/* 액션 버튼 영역 */}
            <DialogActions>
                <Button onClick={onClose} variant="outlined">
                    유지 (취소 안 함)
                </Button>
                <Button
                    onClick={onConfirmCancel}
                    variant="contained"
                    color="error"
                >
                    확인 (양도 취소)
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DealCancelModal;