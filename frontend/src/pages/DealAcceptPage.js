// src/pages/DealAcceptPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Stack, Typography, Box, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// ⚠️ 임시로 로그인된 사용자 ID 설정 (실제는 인증 시스템에서 가져와야 함)
const currentUserId = 3;
const API_BASE_URL = 'http://localhost:8083';

const DealAcceptPage = () => {
    const { ticket_id } = useParams();
    const navigate = useNavigate();

    const [ticket, setTicket] = useState(null);
    const [dealRequest, setDealRequest] = useState(null); // PENDING 거래 요청 정보
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. 데이터 로딩 (티켓 정보 및 PENDING 거래 요청 정보)
    useEffect(() => {
        const fetchDealData = async () => {
            if (!ticket_id) {
                setError("티켓 ID가 유효하지 않습니다.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                // 💡 백엔드에 티켓 ID로 PENDING 거래 요청을 조회하는 새로운 엔드포인트가 필요합니다.
                // 이 엔드포인트는 티켓 정보와 함께 PENDING Deal 요청 정보를 반환해야 합니다.
                const response = await axios.get(`${API_BASE_URL}/api/deals/ticket/${ticket_id}/request`);

                const data = response.data;

                // 백엔드 응답 예시: { ticket: {...}, deal: {...} }
                setTicket(data.ticket);
                setDealRequest(data.deal); // DEAL 객체에는 dealId, buyerId, sellerId, quantity 등이 포함됨

            } catch (err) {
                console.error('Failed to fetch deal data:', err);
                setError('요청 정보를 불러오는 데 실패했습니다. (500)');
            } finally {
                setLoading(false);
            }
        };

        fetchDealData();
    }, [ticket_id]);


    // 2. 버튼 활성화 및 접근 권한 검증
    const isOwner = ticket && ticket.ownerId === currentUserId; // 판매자 ID와 로그인 ID 비교
    const isPending = dealRequest && dealRequest.dealStatus === 'PENDING';
    const isButtonActive = isOwner && isPending && ticket && ticket.status === 'RESERVED';

    const handleGoBack = () => navigate(-1);

    // 3. 거래 수락/거절 핸들러
    const handleAction = async (action) => {
        if (!dealRequest || !dealRequest.dealId) {
            alert('유효한 거래 요청이 없습니다.');
            return;
        }

        const endpoint = `${API_BASE_URL}/api/deals/${dealRequest.dealId}/${action}`; // action: 'accept' 또는 'reject'

        try {
            const confirmMessage = action === 'accept' ? '정말로 양도를 수락하시겠습니까?' : '정말로 양도를 거절하시겠습니까?';
            if (!window.confirm(confirmMessage)) return;

            // 💡 백엔드에 PUT/PATCH 요청을 보냅니다.
            await axios.put(endpoint, {
                // 필요하다면 추가 데이터 전송 (예: 거절 사유)
                // rejectReason: action === 'reject' ? prompt("거절 사유를 입력하세요:") : null
            });

            alert(`양도 요청이 성공적으로 ${action === 'accept' ? '수락' : '거절'}되었습니다.`);
            // 처리 후 페이지를 리로드하거나 상태를 업데이트
            navigate('/'); // 예시: 홈으로 이동

        } catch (err) {
            alert(`처리 실패: ${err.response?.data?.message || '서버 오류가 발생했습니다.'}`);
        }
    };


    // 4. UI 렌더링
    if (loading) return <Box sx={{ p: 4 }}>로딩 중...</Box>;
    if (error) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
    if (!ticket) return <Alert severity="warning" sx={{ m: 4 }}>티켓 정보를 찾을 수 없습니다.</Alert>;

    // 접근 권한이 없는 경우 (판매자가 아닌 경우)
    if (!isOwner) {
         return <Alert severity="error" sx={{ m: 4 }}>해당 요청에 대한 처리 권한이 없습니다.</Alert>;
    }


    return (
        <Box className="container mx-auto px-4 py-6 max-w-2xl">
             <nav className="mb-8"><button onClick={handleGoBack}>&larr; 목록으로</button></nav>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>
                <Typography variant="h4" component="h1" fontWeight="bold">
                    {ticket.eventName || '티켓 이름 없음'}
                </Typography>

                <Stack direction="row" spacing={3} sx={{ my: 2 }}>
                    {/* 티켓 상태 */}
                    <Button variant="contained" sx={{ backgroundColor: ticket.status === 'RESERVED' ? '#FF9800' : '#4CAF50' }}>
                        티켓 상태: {ticket.status || '미확인'}
                    </Button>

                    {/* DEAL 상태 */}
                    <Button variant="contained" color={isPending ? 'warning' : 'primary'}>
                        DEAL 상태: {dealRequest ? dealRequest.dealStatus : 'N/A'}
                    </Button>
                </Stack>

                {/* 🌟 거래 요청 상세 정보 표시 */}
                {dealRequest && (
                    <Box sx={{ mt: 3, p: 3, border: '1px solid #ccc', borderRadius: '8px', width: '100%' }}>
                        <Typography variant="h6" gutterBottom>거래 요청 정보</Typography>
                        <Typography>요청 수량: {dealRequest.quantity}개</Typography>
                        <Typography>구매자 ID: {dealRequest.buyerId}</Typography>
                        <Typography>만료 일시: {new Date(dealRequest.expireAt).toLocaleString()}</Typography>
                    </Box>
                )}
            </Box>

            <section className="space-y-4 mb-8">
                 {/* 이하 상세 정보 섹션은 기존 UI와 동일하게 유지 */}
                 <header className="mt-8 border-b pb-4">
                    <Typography variant="h5" component="h2" fontWeight="bold">티켓 상세</Typography>
                 </header>

                 <p>가격 문의: {ticket.sellingPrice ? `${ticket.sellingPrice.toLocaleString()}원` : '가격 정보 없음'}</p>
                 <p>날짜: {ticket.eventDate || '날짜 미정'}</p>
                 <p>장소: {ticket.eventLocation || '장소 정보 없음'}</p>
                 {/* ... 기타 정보 */}
            </section>

            {/* 🌟 5. 양도 수락/거절 버튼 */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 5 }}>
                <Button
                    variant="contained"
                    color="success"
                    disabled={!isButtonActive}
                    onClick={() => handleAction('accept')}
                >
                    양도 수락
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    disabled={!isButtonActive}
                    onClick={() => handleAction('reject')}
                >
                    양도 거절
                </Button>
                {!isButtonActive && isOwner && (
                    <Typography color="error" sx={{ ml: 2, alignSelf: 'center' }}>
                        (현재 거래 상태에서는 수락/거절할 수 없습니다.)
                    </Typography>
                )}
            </Stack>

        </Box>
    );
};

export default DealAcceptPage;