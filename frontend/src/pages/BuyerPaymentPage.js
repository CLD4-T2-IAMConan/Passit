// src/pages/BuyerPaymentPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
    Modal // MUI Modal 컴포넌트
} from '@mui/material';

// ⚠️ 임시 설정
const API_BASE_URL = 'http://localhost:8083';
// 🌟 현재 로그인된 사용자 ID (백엔드의 getUserId()와 일치해야 함)
const currentUserId = 1;

// 🌟 MUI 커스텀 모달 스타일
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


const BuyerPaymentPage = () => {
    // URL에서 payment_id를 가져옴 (라우팅: /buyer/payment/:payment_id)
    const { payment_id } = useParams();
    const navigate = useNavigate();

    // 상태 관리
    const [payments, setPayments] = useState(null);
    const [ticket, setTicket] = useState(null);
    const [deal, setDeal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🌟 모달 상태
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    // ----------------------------------------------------
    // 1. 데이터 로딩 및 접근 권한 확인 (GET /api/payments/{id}/details)
    // ----------------------------------------------------
    const fetchPaymentData = useCallback(async () => {
        if (!payment_id) {
            setError("결제 ID가 유효하지 않습니다.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // 프론트에서 payment_id로, 백엔드에서 paymentId로 받음
            const response = await axios.get(`${API_BASE_URL}/api/payments/${payment_id}/details`);

            const data = response.data;

            // 🌟 권한 검사: 현재 사용자 ID와 Payments의 buyerId 비교
            if (data.payments.buyerId !== currentUserId) {
                 setError("해당 결제 정보를 조회할 권한이 없습니다.");
                 setLoading(false);
                 return;
            }

            setPayments(data.payments);
            setTicket(data.ticket);
            setDeal(data.deal);

        } catch (err) {
            console.error('Failed to fetch payment data:', err);
            setError(`정보를 불러오는 데 실패했습니다: ${err.response?.data || '서버 오류'}`);
        } finally {
            setLoading(false);
        }
    }, [payment_id]);

    useEffect(() => {
        fetchPaymentData();
    }, [fetchPaymentData]);


    // ----------------------------------------------------
    // 2. 버튼 핸들러 (취소 로직)
    // ----------------------------------------------------

    // 💡 1. '양도 취소하기' 버튼 클릭 시: 모달 열기
    const handleCancelClick = () => {
        setIsCancelModalOpen(true);
    };

    // 💡 2. 모달 내부 '확인' 버튼 클릭 시: API 호출 (PUT /api/deals/{id}/cancel)
    const handleConfirmCancel = useCallback(async () => {
        setIsCancelModalOpen(false); // 모달 닫기

        if (!deal || !deal.dealId) {
            alert('거래 정보를 찾을 수 없습니다.');
            return;
        }

        const endpoint = `${API_BASE_URL}/api/deals/${deal.dealId}/cancel`;

        try {
            await axios.put(endpoint, {});

            alert("거래가 성공적으로 취소되었습니다.");
            // 성공 후 구매자 거래 목록 페이지로 이동 가정
            navigate('/mypage/buyer/deals');

        } catch (err) {
            const errorMessage = err.response?.data?.message || err.response?.data || '서버 오류가 발생했습니다.';
            alert(`취소 실패: ${errorMessage}`);
            fetchPaymentData(); // 실패 시 데이터 새로고침
        }
    }, [deal, navigate, fetchPaymentData]);

    // 3. 결제 버튼 클릭 시 (로직 미구현)
    const handlePayClick = () => {
        console.log("결제하기 버튼 클릭됨. (결제 모달/API 로직 구현 예정)");
    };

    // ----------------------------------------------------
    // 3. 렌더링 및 UI
    // ----------------------------------------------------

    if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
    if (!payments || !ticket || !deal) return <Alert severity="warning" sx={{ m: 4 }}>필요한 거래 정보를 찾을 수 없습니다.</Alert>;

    const isPaymentPending = payments.paymentStatus === 'PENDING';
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
                    {/* 이미지 및 기본 정보는 백엔드 데이터에 맞춰 수정 필요 */}
                    <Typography variant="h5" component="h2" gutterBottom>
                        결제 대상: {ticket.eventName || '티켓 이름'}
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="body1" color="text.secondary">단위 가격:</Typography>
                            <Typography variant="subtitle1">{ticket.sellingPrice?.toLocaleString() || '0'}원</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="body1" color="text.secondary">수량:</Typography>
                            <Typography variant="subtitle1">{deal.quantity}개</Typography>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, p: 2, borderTop: '1px dashed #ccc', textAlign: 'right' }}>
                        <Typography variant="h5" color="error">
                            총 결제 금액: {totalPrice.toLocaleString()}원
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            현재 상태: {payments.paymentStatus}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>


            {/* 버튼 섹션 */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 5 }}>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={handleCancelClick}
                    disabled={!isPaymentPending}
                >
                    양도 취소하기
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handlePayClick}
                    disabled={!isPaymentPending}
                >
                    결제하기
                </Button>
            </Stack>

            {/* 🌟 커스텀 취소 확인 모달 (파일 내부에 직접 포함) 🌟 */}
            <Modal
                open={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                aria-labelledby="cancel-modal-title"
                aria-describedby="cancel-modal-description"
            >
                <Box sx={modalStyle}>
                    <Typography id="cancel-modal-title" variant="h6" component="h2" gutterBottom>
                        양도 취소 확인
                    </Typography>
                    <Typography id="cancel-modal-description" sx={{ mt: 2, mb: 3 }}>
                        정말로 이 거래를 취소하시겠습니까? 거래가 종료되고 티켓은 재고로 돌아갑니다.
                    </Typography>

                    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
                        <Button variant="outlined" onClick={() => setIsCancelModalOpen(false)}>
                            취소
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleConfirmCancel} // API 호출 함수 연결
                        >
                            확인 (취소)
                        </Button>
                    </Stack>
                </Box>
            </Modal>

        </Box>
    );
};

export default BuyerPaymentPage;