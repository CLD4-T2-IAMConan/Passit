import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography'; // 텍스트 제목 출력을 위해 추가
import axios from 'axios';
import DealRequestModal from '../components/Ticket/DealRequestModal';
import LoadingModal from '../components/Ticket/LoadingModal';
import RequestSuccessModal from '../components/Ticket/RequestSuccessModal';
import defaultTicket from '../assets/images/defaultTicket.png';
import { userService } from "../api/services/userService";

// 백엔드 서버의 기본 URL (Java Spring Boot, 8083 포트 가정)
const API_BASE_URL = 'http://localhost:8083';
const TICKET_API_BASE_URL = 'http://localhost:8082'; // 💡 8082 포트로 고정

const TicketDetailPage = () => {
  const { ticket_id } = useParams();
  const navigate = useNavigate();

  // 1. 상태 관리
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentUser, setCurrentUser] = useState(null); // 사용자 전체 정보
  const [loadingUser, setLoadingUser] = useState(true); // 사용자 정보 로딩 상태


  // 🌟 모달 열림/닫힘 상태 관리용 state 추가
  const [isDealRequestModalOpen, setIsDealRequestModalOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false); // 로딩 모달 제어
  const [submitError, setSubmitError] = useState(null);   // API 에러 메시지 저장
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // 성공 모달 제어

  // 2. 데이터 로딩 로직 (티켓 정보)
  useEffect(() => {
    // ticket_id가 유효한지 확인
    if (!ticket_id) {
        setLoading(false);
        setError("티켓 ID가 유효하지 않습니다.");
        return;
    }

    const fetchData = async () => {
        try {
          setLoading(true);
          setError(null);

          const response = await axios.get(`${TICKET_API_BASE_URL}/tickets/${ticket_id}`);
          const apiResponse = response.data;
          if (apiResponse.data === null) {
              throw new Error('API 응답에 티켓 상세 정보가 포함되어 있지 않습니다.');
          }
          const data = apiResponse.data;

          setTicket({
            ...data,
            id: data.ticketId,
            date: data.eventDate ? data.eventDate.split('T')[0] : '날짜 미정',
            imageUrl: data.image1 || defaultTicket,
            eventName: data.eventName,
            eventLocation: data.eventLocation,
            ownerId: data.ownerId, // 💡 ownerId가 포함되어 있습니다.
            ticketStatus: data.ticketStatus,
            originalPrice: data.originalPrice,
            sellingPrice: data.sellingPrice,
            seatInfo: data.seatInfo,
            ticketType: data.ticketType,
            description: data.description
          });

        } catch (err) {
          console.error('Failed to fetch ticket detail:', err);
          if (err.response && err.response.status === 404) {
              setError(`티켓 ID ${ticket_id}번을 찾을 수 없습니다.`);
          } else {
              setError('티켓 정보를 불러오는 데 실패했습니다. 서버 연결 상태를 확인해주세요.');
          }
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [ticket_id]);

  // 3. 핸들러 함수들
  const handleGoBack = () => {
    navigate(-1);
  };

  // 🚨 [새로고침 로직] 확인 버튼 클릭 시 실행될 핸들러
  const handleSuccessConfirm = () => {
      setIsSuccessModalOpen(false); // 모달 닫기
      window.location.reload();    // 🚨 강제 새로고침 실행
  };

 // 사용자 정보 로딩 로직
   useEffect(() => {
     const fetchUserInfo = async () => {
       try {
         setLoadingUser(true);
         const response = await userService.getMe();
         const fullUserInfo = response.data;
         // 💡 fullUserInfo에는 id 또는 userId 필드가 포함되어야 합니다.
         setCurrentUser(fullUserInfo);
       } catch (error) {
         console.error("Failed to fetch user info:", error);
         setCurrentUser(null); // 로그인되지 않은 상태
       } finally {
         setLoadingUser(false);
       }
     };

     fetchUserInfo();
   }, []);

    const handlePurchaseClick = () => {
        // 🚨 1. 필수 데이터 존재 여부 확인
        if (!ticket || !ticket.id || !currentUser || !currentUser.userId) {
            console.error("❌ 구매 데이터 부족: 티켓/ID/사용자 정보가 유효하지 않습니다.");
            setSubmitError("로그인이 필요하거나 티켓 정보가 부족합니다.");
            return;
        }

        // 🚨 2. 소유자 여부 검증 (추가된 핵심 로직)
        // ownerId와 currentUser.id가 같은지 확인합니다.
        if (ticket.ownerId === currentUser.userId) {
            setSubmitError("🚨 자신의 티켓은 구매(양도 요청)할 수 없습니다.");
            console.warn("❌ Owner attempted to purchase their own ticket.");
            setIsDealRequestModalOpen(false); // 모달이 이미 열려 있을 수도 있으므로 닫음
            return;
        }

        // 3. 모든 검증 통과 시
        setSubmitError(null); // 이전 에러 메시지 제거
        setIsDealRequestModalOpen(true);
    };

    // 🌟 모달 닫기 핸들러 추가
    const handleCloseDealRequestModal = () => {
      setIsDealRequestModalOpen(false);
    };

    // 거래 요청 API 호출 핸들러
    const handleConfirmPurchase = async (ticketId, quantity) => {

        if (!currentUser || !currentUser.userId) {
             setSubmitError("로그인 정보가 유효하지 않아 거래 요청을 할 수 없습니다.");
             setIsDealRequestModalOpen(false);
             setIsSuccessModalOpen(false);
             return;
        }
        // 💡 currentUser.id를 buyerId로 사용합니다.
        const buyerId = currentUser.userId;

        // 🚨 최종 검증: 거래 요청 시점에 다시 한번 소유자 검증
        if (ticket.ownerId === buyerId) {
            setSubmitError("🚨 자신의 티켓은 구매(양도 요청)할 수 없습니다. (재검증 실패)");
            setIsSubmitting(false);
            setIsDealRequestModalOpen(false);
            return;
        }

        const expireAtDate = new Date();
        expireAtDate.setDate(expireAtDate.getDate() + 1);
        const expireAtISOString = expireAtDate.toISOString();

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            console.log(`📡 API 요청: ... 구매자 ID=${buyerId}`);

            const response = await axios.post(`${API_BASE_URL}/api/deals/request`, {
                buyerId: buyerId,
                ticketId: ticketId,
                quantity: quantity,
                expireAt: expireAtISOString,
            });

            if (response.status === 201) {
                console.log("✅ 양도 요청 성공:", response.data);
                setIsDealRequestModalOpen(false);
                setIsSuccessModalOpen(true);
            }

        } catch (error) {
            console.error('❌ 양도 요청 실패:', error);
            const errorMessage = error.response?.data?.message || "요청 처리 중 알 수 없는 오류가 발생했습니다.";
            setSubmitError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };


    if (loading || loadingUser) {
        return (
            <div className="text-center mt-20">
                <Typography variant="h6" color="textSecondary">
                    {loading ? '티켓 정보를' : '사용자 정보를'} 불러오는 중입니다...
                </Typography>
            </div>
        );
    }

    if (error) {
      return (
        <Stack
          spacing={3}
          alignItems="center"
          justifyContent="center"
          sx={{ minHeight: '80vh', p: 4 }}
        >
          <Typography variant="h5" color="error" fontWeight="bold">
            {error}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            입력하신 티켓 ID가 존재하지 않거나, 서버 연결에 문제가 발생했습니다.
          </Typography>
          <Button variant="outlined" color="primary" onClick={handleGoBack} size="large">
            목록으로 돌아가기
          </Button>
        </Stack>
      );
    }

    if (!ticket) return null;


    // 🚨 렌더링 시점에 소유자 여부 판단
    const isOwner = currentUser && ticket && (currentUser.userId === ticket.ownerId);
    // 🚨 구매 가능 상태
    const isAvailable = ticket.ticketStatus === 'AVAILABLE';

  // 5. 메인 UI 렌더링
  return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* 상단 네비게이션은 좌측 정렬 유지 */}
        <nav className="mb-8">
          <button onClick={handleGoBack} className="text-gray-600 hover:text-black">
            &larr; 목록으로
          </button>
        </nav>

        {/* 🌟 1. UI 개선 영역: 중앙 정렬 컨테이너 🌟 */}
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            textAlign: 'center'
        }}>

          {/* 🌟 2. 티켓 이름 (텍스트) */}
          <Typography variant="h4" component="h1" fontWeight="bold">
            {ticket.eventName || '티켓 이름 없음'}
          </Typography>

          {/* 🚨 submitError 메시지 표시 */}
          {submitError && (
              <Typography color="error" variant="body1" sx={{ mt: 1, mb: 1 }}>
                  {submitError}
              </Typography>
          )}

          {/* 🌟 3. 티켓 상태 및 DEAL 상태 버튼 (한 줄에 배치) */}
          <Stack direction="row" spacing={3} sx={{ my: 2 }}>

            {/* 티켓 상태 버튼 (색상으로 상태 강조) */}
            <Button
              variant="contained"
              sx={{ backgroundColor: isAvailable ? '#4CAF50' : '#FF9800',
                    '&:hover': { backgroundColor: isAvailable ? '#388E3C' : '#F57C00' }
              }}
            >
              티켓 상태: {ticket.ticketStatus || '미확인'}
            </Button>

            <Button
              variant="contained"
              color="primary"
              // 🚨 disabled 조건에 isOwner 추가
              disabled={!isAvailable || isOwner}
              onClick={handlePurchaseClick}
            >
              {/* 🚨 버튼 텍스트 변경: 소유자일 경우 */}
              DEAL 상태: {isOwner ? '본인 티켓 (구매 불가)' : (isAvailable ? '구매 가능' : '거래 불가')}
            </Button>

          </Stack>

        </div>


        {/* 이하 상세 정보 섹션은 필요에 따라 기존대로 유지하거나 MUI 컴포넌트로 변경 가능 */}
        <section className="space-y-4 mb-8">
          <header className="mt-8 border-b pb-4">
            <Typography variant="h5" component="h2" fontWeight="bold">{ticket.eventName || '이름없음'}</Typography>
          </header>

          <p>가격 문의: {ticket.sellingPrice ? `${ticket.sellingPrice.toLocaleString()}원` : '가격 정보 없음'}</p>
          <p>날짜: {ticket.eventDate || '날짜 미정'}</p>
          <p>장소: {ticket.eventLocation || '장소 정보 없음'}</p>

        </section>
        <DealRequestModal
          open={isDealRequestModalOpen}
          onClose={handleCloseDealRequestModal}
          ticket={ticket}
          onConfirm={handleConfirmPurchase}
        />
        <LoadingModal open={isSubmitting} />
        <RequestSuccessModal
           open={isSuccessModalOpen}
           onClose={() => setIsSuccessModalOpen(false)}
        />


      </div>
    );
  };

export default TicketDetailPage;