// src/pages/DealAcceptPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Stack, Typography, Box, Alert, Modal } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // 아이콘은 그대로 유지

// ⚠️ 임시로 로그인된 사용자 ID 설정 (실제는 인증 시스템에서 가져와야 함)
const currentUserId = 4;
const API_BASE_URL = 'http://localhost:8083';

const DealAcceptPage = () => {
    const { ticket_id } = useParams();
    const navigate = useNavigate();

    const [ticket, setTicket] = useState(null);
    const [dealRequest, setDealRequest] = useState(null); // PENDING 거래 요청 정보
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // const [dealData, setDealData] = useState(null); // 기존 코드에서 중복된 dealData 상태 제거

    // 💡 1. 모달 상태 추가 및 핸들러 정의
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false); // 🌟 수락 모달 상태 추가

    // 현재 처리 중인 액션을 저장 (accept 또는 reject)
    const [currentAction, setCurrentAction] = useState(null);

    // 모달 핸들러
    const handleOpenRejectModal = () => setIsRejectModalOpen(true);
    const handleCloseRejectModal = () => setIsRejectModalOpen(false);
    const handleOpenAcceptModal = () => setIsAcceptModalOpen(true); // 🌟 수락 모달 핸들러
    const handleCloseAcceptModal = () => setIsAcceptModalOpen(false); // 🌟 수락 모달 핸들러

    // 1. 데이터 로딩 (기존 로직 유지)
    useEffect(() => {
        const fetchDealData = async () => {
            if (!ticket_id) {
                setError("티켓 ID가 유효하지 않습니다.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await axios.get(`${API_BASE_URL}/api/deals/ticket/${ticket_id}/request`);

                const data = response.data;
                setTicket(data.ticket);
                setDealRequest(data.deal);

            } catch (err) {
                console.error('Failed to fetch deal data:', err);
                setError('요청 정보를 불러오는 데 실패했습니다. (500)');
            } finally {
                setLoading(false);
            }
        };

        fetchDealData();
    }, [ticket_id]);


    // 2. 버튼 활성화 및 접근 권한 검증 (기존 로직 유지)
    const isOwner = ticket && ticket.ownerId === currentUserId;
    const isPending = dealRequest && dealRequest.dealStatus === 'PENDING';
    const isButtonActive = isOwner && isPending && ticket && ticket.status === 'RESERVED'; // ticket.status -> ticket.ticketStatus로 수정했을 가능성 고려

    const handleGoBack = () => navigate(-1);

    // 3. 거래 수락/거절 버튼 클릭 핸들러 (모달 열기)
    const handleAction = async (action) => {
        if (!dealRequest || !dealRequest.dealId) {
            alert('유효한 거래 요청이 없습니다.');
            return;
        }

        // 현재 진행할 액션을 저장
        setCurrentAction(action);

        if (action === 'accept') {
            handleOpenAcceptModal(); // 수락 모달 열기
        } else if (action === 'reject') {
            handleOpenRejectModal(); // 거절 모달 열기
        }
    };

    // 4. 모달에서 '확인'을 눌렀을 때 실행되는 실제 API 호출 로직
    const confirmAction = async () => {
        if (!currentAction) return;

        const action = currentAction;
        const endpoint = `${API_BASE_URL}/api/deals/${dealRequest.dealId}/${action}`;

        // 모달 닫기
        if (action === 'accept') {
            handleCloseAcceptModal();
        } else if (action === 'reject') {
            handleCloseRejectModal();
        }

        try {
            // 💡 백엔드에 PUT 요청 (수락 또는 거절)
            await axios.put(endpoint, {});

            alert(`양도 요청이 성공적으로 ${action === 'accept' ? '수락' : '거절'}되었습니다.`);
            // 처리 후 페이지를 리로드하거나 상태를 업데이트
            navigate('/mypage/deals'); // 처리 후 이동할 경로 (예시)

        } catch (err) {
            alert(`처리 실패: ${err.response?.data?.message || '서버 오류가 발생했습니다.'}`);
            // 실패했을 경우 다시 모달 상태를 초기화할 필요는 없지만, 사용자 경험에 따라 처리 가능
        } finally {
            setCurrentAction(null); // 액션 상태 초기화
        }
    };


    // 5. UI 렌더링 (기존 로직 유지)
    if (loading) return <Box sx={{ p: 4 }}>로딩 중...</Box>;
    if (error) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
    if (!ticket) return <Alert severity="warning" sx={{ m: 4 }}>티켓 정보를 찾을 수 없습니다.</Alert>;

    if (!isOwner) {
         return <Alert severity="error" sx={{ m: 4 }}>해당 요청에 대한 처리 권한이 없습니다.</Alert>;
    }

    // MUI 모달 스타일
    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
        borderRadius: 2,
    };

    return (
        <Box className="container mx-auto px-4 py-6 max-w-2xl">
             <nav className="mb-8"><button onClick={handleGoBack}>&larr; 목록으로</button></nav>

            {/* ... (기존 티켓 및 DEAL 정보 표시 섹션 유지) ... */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>
                <Typography variant="h4" component="h1" fontWeight="bold">
                    {ticket.eventName || '티켓 이름 없음'}
                </Typography>

                <Stack direction="row" spacing={3} sx={{ my: 2 }}>
                    <Button variant="contained" sx={{ backgroundColor: ticket.status === 'RESERVED' ? '#FF9800' : '#4CAF50' }}>
                        티켓 상태: {ticket.status || '미확인'}
                    </Button>
                    <Button variant="contained" color={isPending ? 'warning' : 'primary'}>
                        DEAL 상태: {dealRequest ? dealRequest.dealStatus : 'N/A'}
                    </Button>
                </Stack>

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
                 <p>좌석 정보: {ticket.seatInfo || '정보 없음'}</p>
            </section>

            {/* 🌟 5. 양도 수락/거절 버튼 */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 5 }}>
                <Button
                    variant="contained"
                    color="success"
                    disabled={!isButtonActive}
                    onClick={() => handleAction('accept')} // 모달 열기
                >
                    양도 수락
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    disabled={!isButtonActive}
                    onClick={() => handleAction('reject')} // 모달 열기
                >
                    양도 거절
                </Button>
                {!isButtonActive && isOwner && (
                    <Typography color="error" sx={{ ml: 2, alignSelf: 'center' }}>
                        (현재 거래 상태에서는 수락/거절할 수 없습니다.)
                    </Typography>
                )}
            </Stack>

            {/* ======================================================= */}
            {/* 🌟🌟🌟 모달 컴포넌트 섹션 🌟🌟🌟 */}
            {/* ======================================================= */}

            {/* 💡 6. 양도 거절 확인 모달 */}
            <Modal
                open={isRejectModalOpen}
                onClose={handleCloseRejectModal}
                aria-labelledby="reject-modal-title"
                aria-describedby="reject-modal-description"
            >
                <Box sx={modalStyle}>
                    <Typography id="reject-modal-title" variant="h6" component="h2" gutterBottom>
                        양도 거절 확인
                    </Typography>
                    <Typography id="reject-modal-description" sx={{ mt: 2, mb: 3 }}>
                        정말로 이 양도 요청을 거절하시겠습니까? 거래가 취소됩니다.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button variant="outlined" onClick={handleCloseRejectModal}>
                            취소
                        </Button>
                        <Button variant="contained" color="error" onClick={confirmAction}>
                            확인 (거절)
                        </Button>
                    </Box>
                </Box>
            </Modal>

            {/* 💡 7. 양도 수락 확인 모달 */}
            <Modal
                open={isAcceptModalOpen}
                onClose={handleCloseAcceptModal}
                aria-labelledby="accept-modal-title"
                aria-describedby="accept-modal-description"
            >
                <Box sx={modalStyle}>
                    <Typography id="accept-modal-title" variant="h6" component="h2" gutterBottom>
                        양도 수락 확인
                    </Typography>
                    <Typography id="accept-modal-description" sx={{ mt: 2, mb: 3 }}>
                        정말로 이 양도 요청을 수락하시겠습니까? 티켓 상태가 **판매 완료(SOLD)**로 변경됩니다.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button variant="outlined" onClick={handleCloseAcceptModal}>
                            취소
                        </Button>
                        <Button variant="contained" color="success" onClick={confirmAction}>
                            확인 (수락)
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
};

export default DealAcceptPage;