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
    Modal, // MUI Modal 컴포넌트
    DialogTitle,
    DialogContent,
    DialogActions
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
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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

    // 💡 1. '결제하기' 버튼 클릭 시: 결제 확인 모달 열기
        const handlePayClick = () => {
            setIsPaymentModalOpen(true);
        };

        // 💡 2. 결제 모달 내부 '결제하기' 버튼 클릭 시: API 호출 및 NICEPAY 호출 (통합)
        const handleConfirmPayment = useCallback(async () => {
            setIsPaymentModalOpen(false); // 모달 닫기

            if (!payment_id) {
                alert('결제 ID를 찾을 수 없습니다.');
                return;
            }

            try {
                // 1. 백엔드에서 결제 준비 데이터 가져오기 (GET /api/payments/{id}/prepare)
                // 백엔드에서 NicepayPrepareResponse DTO를 받아옴
                const prepareResponse = await axios.get(
                    `${API_BASE_URL}/api/payments/${payment_id}/prepare`
                );
                const data = prepareResponse.data;

                // 2. NICEPAY SDK가 로드되었는지 확인
                if (!window.AUTHNICE) {
                     throw new Error("NICEPAY SDK가 로드되지 않았습니다. index.html을 확인하세요.");
                }

                // 3. NICEPAY 결제창 호출 (팝업/인라인 형태로 현재 페이지 위에 띄워짐)
                window.AUTHNICE.requestPay({
                    clientId: data.clientId,
                    method: 'card', // 결제 수단
                    orderId: data.orderId,
                    amount: data.amount,
                    goodsName: data.goodsName,

                    // 🚨 returnUrl: NICEPAY 인증 성공 후 돌아올 URL을 백엔드에서 지정한 URL을 그대로 사용합니다.
                    // 이 URL은 최종 승인 처리 및 상태 업데이트를 담당하는 페이지여야 합니다.
                    returnUrl: data.returnUrl, // 예: http://localhost:3000/buyer/payment/결제ID/result

                    fnError: function (result) {
                        // 결제 실패 또는 취소 시 NICEPAY가 호출하는 함수
                        alert(`결제 실패: ${result.msg}`);
                        console.error('NICEPAY Error:', result);
                        fetchPaymentData(); // 현재 페이지 데이터 새로고침
                    }
                });

            } catch (err) {
                const errorMessage = err.response?.data || err.message;
                alert(`결제 준비 실패: ${errorMessage}`);
                console.error('결제 준비 실패:', err);
            }

        }, [payment_id, fetchPaymentData]); // 의존성 추가

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
                    onClick={handlePayClick} // 🌟 모달 열기 함수 연결
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

            {/* 🌟🌟 2. 결제 정보 확인 모달 (새로 추가) 🌟🌟 */}
                        <Modal
                            open={isPaymentModalOpen}
                            onClose={() => setIsPaymentModalOpen(false)}
                            aria-labelledby="payment-modal-title"
                            aria-describedby="payment-modal-description"
                        >
                            <Box sx={modalStyle}>
                                <DialogTitle sx={{ fontWeight: 'bold' }}>결제 정보 확인</DialogTitle>

                                <DialogContent dividers sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>

                                        {/* 🖼️ 좌측: 티켓 이미지 */}
                                        <Box
                                            sx={{
                                                width: { xs: '100%', sm: '40%' },
                                                height: '150px',
                                                borderRadius: '12px',
                                                overflow: 'hidden',
                                                border: '1px solid #e0e0e0',
                                            }}
                                        >
                                            <img
                                                src={ticket.imageUrl || '기본_이미지_URL'}
                                                alt={ticket.eventName}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </Box>

                                        {/* 📝 우측: 티켓 정보 및 금액 */}
                                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            <Stack spacing={1}>
                                                <Typography variant="h6" fontWeight="bold">
                                                    {ticket.eventName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    공연일자: {ticket.eventDate}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    좌석정보: {ticket.seatInfo || '정보 없음'}
                                                </Typography>

                                                {/* 💰 단위 가격 (payments table의 price 사용을 위해 totalPrice를 역산) */}
                                                <Typography variant="h6" color="primary" fontWeight="bold" sx={{ mt: 2 }}>
                                                    {(totalPrice / deal.quantity).toLocaleString()}원 / 개
                                                </Typography>

                                                {/* 🌟 수량 표시 (수량 선택 기능은 제거) */}
                                                <Typography fontWeight="bold" sx={{ mt: 1 }}>
                                                    수량: {deal.quantity}개
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    </Box>

                                    {/* 💰 총 결제 금액 */}
                                    <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mt: 3, borderTop: '1px solid #eee', pt: 2 }}>
                                        <Typography variant="body1" sx={{ mr: 2 }}>총 결제 금액:</Typography>
                                        <Typography variant="h5" color="error" fontWeight="bold">
                                            {totalPrice.toLocaleString()}원
                                        </Typography>
                                    </Stack>
                                </DialogContent>

                                {/* 하단 버튼 액션 */}
                                <DialogActions sx={{ p: 2.5, justifyContent: 'center' }}>
                                    <Button
                                        onClick={() => setIsPaymentModalOpen(false)}
                                        color="inherit"
                                        variant="outlined"
                                        sx={{ borderRadius: '8px' }}
                                    >
                                        취소
                                    </Button>
                                    <Button
                                        onClick={handleConfirmPayment}
                                        variant="contained"
                                        color="primary"
                                        sx={{ borderRadius: '8px', px: 4 }}
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