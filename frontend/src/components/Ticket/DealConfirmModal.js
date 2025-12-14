// src/components/Ticket/DealConfirmModal.js

import React from 'react';
import { Modal, Box, Typography, Button, Stack } from '@mui/material';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    borderRadius: '8px',
    textAlign: 'center',
};

const DealConfirmModal = ({ open, onClose, onConfirmCompletion }) => {
    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="completion-modal-title"
            aria-describedby="completion-modal-description"
        >
            <Box sx={style}>
                <Typography id="completion-modal-title" variant="h6" component="h2" gutterBottom color="primary">
                    구매 확정 안내
                </Typography>

                <Typography id="completion-modal-description" sx={{ mt: 2, mb: 3 }}>
                    **구매 확정을 진행하시겠습니까?**
                    <br />
                    <span style={{ fontWeight: 'bold', color: 'red' }}>⚠️ 구매확정 시 환불이 불가능합니다.</span>
                    <br />
                    공연에 입장 후 눌러주세요.
                </Typography>

                <Stack direction="row" spacing={2} justifyContent="center">
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onConfirmCompletion} // 구매 확정 핸들러 연결
                    >
                        확정 및 거래 완료
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={onClose}
                    >
                        취소
                    </Button>
                </Stack>
            </Box>
        </Modal>
    );
};

export default DealConfirmModal;