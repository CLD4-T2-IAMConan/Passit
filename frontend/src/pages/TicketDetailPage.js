import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography'; // 텍스트 제목 출력을 위해 추가
import axios from 'axios';
// import TicketInfo from '../components/Ticket/TicketInfo'; // 추후 분리할 컴포넌트
import DealRequestModal from '../components/Ticket/DealRequestModal';
import LoadingModal from '../components/Ticket/LoadingModal';
import RequestSuccessModal from '../components/Ticket/RequestSuccessModal';

// 백엔드 서버의 기본 URL (Java Spring Boot, 8083 포트 가정)
const API_BASE_URL = 'http://localhost:8083';

const TicketDetailPage = () => {
  const { ticket_id } = useParams();
  const navigate = useNavigate();

  // 1. 상태 관리
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🌟 모달 열림/닫힘 상태 관리용 state 추가
  const [isDealRequestModalOpen, setIsDealRequestModalOpen] = useState(false);

  // 🌟🌟🌟 누락된 상태 변수 3가지 추가 (이 부분이 오류의 원인입니다!) 🌟🌟🌟
  const [isSubmitting, setIsSubmitting] = useState(false); // 로딩 모달 제어
  const [submitError, setSubmitError] = useState(null);   // API 에러 메시지 저장
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // 성공 모달 제어

  // 2. 데이터 로딩 로직
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

        // 💡 실제 Java 백엔드 API 호출
        const response = await axios.get(`${API_BASE_URL}/api/tickets/${ticket_id}`);

        const data = response.data;

        // DB 컬럼명(snake_case)이 있다면 여기서 React의 camelCase로 변환하는 것이 좋습니다.
        // 예: data.image_url을 data.imageUrl로 변환
        setTicket({
          ...data,
          id: data.ticketId,
          // DB에서 date 필드를 받아왔을 때, 시간 정보를 제거하고 날짜만 남기기
          date: data.date ? data.date.split('T')[0] : '날짜 미정',
          // DB가 image_url을 사용한다면:
          imageUrl: data.imageUrl || data.image_url || 'https://via.placeholder.com/600x400',
        });

      } catch (err) {
        console.error('Failed to fetch ticket detail:', err);
        // 404 에러 등 HTTP 에러 메시지를 사용자에게 보여줍니다.
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

// TicketDetailPage.js (수정할 부분)
    const handlePurchaseClick = () => {
        console.log("👉 [Page] 구매 버튼 클릭됨!");
        // 🕵️‍♀️ 티켓 객체와 ID 값 확인
        console.log("🕵️‍♀️ Current Ticket Object:", ticket);
        console.log("🕵️‍♀️ Checking ticket.id:", ticket ? ticket.id : 'N/A');

        if (ticket && ticket.id) {
        console.log("👉 [Page] 모달 열기 시도 (State 변경 -> true)");
          setIsDealRequestModalOpen(true);
        } else {
        console.error("❌ [Page] 티켓 데이터가 없거나 ID 필드가 유효하지 않습니다.", ticket);
        }
    };

    // 🌟 모달 닫기 핸들러 추가
    const handleCloseDealRequestModal = () => {
      setIsDealRequestModalOpen(false);
    };

    // 🕵️‍♀️ API 호출을 위한 핵심 핸들러 수정
    const handleConfirmPurchase = async (ticketId, quantity) => {

        // 1. 📅 만료 시간 계산 (현재 시간 + 1일)
        const expireAtDate = new Date();
        expireAtDate.setDate(expireAtDate.getDate() + 1); // 현재 날짜에 1일 추가

        // 💡 백엔드가 기대하는 ISO 8601 형식의 문자열로 변환
        const expireAtISOString = expireAtDate.toISOString();

        // 4단계: 로딩 시작
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            console.log(`📡 API 요청: ID=${ticketId}, 수량=${quantity}, 만료=${expireAtISOString}`);

            // 2. 📡 백엔드 API 호출
            const response = await axios.post(`${API_BASE_URL}/api/deals/request`, {
                ticketId: ticketId,          // 백엔드 DTO 필드명과 일치
                quantity: quantity,
                expireAt: expireAtISOString, // 계산된 만료 시간 전송
            });

            if (response.status === 201) {
                console.log("✅ 양도 요청 성공:", response.data);
                setIsDealRequestModalOpen(false); // 모달 닫기
                setIsSuccessModalOpen(true);    // 성공 팝업 열기
            }

        } catch (error) {
            console.error('❌ 양도 요청 실패:', error);

            // 백엔드에서 보낸 에러 메시지 추출
            const errorMessage = error.response?.data || "요청 처리 중 알 수 없는 오류가 발생했습니다.";
            setSubmitError(errorMessage);

        } finally {
            setIsSubmitting(false); // 4단계: 로딩 종료
        }
    };

  if (error) {
    return (
      <div className="text-center mt-20 p-4">
        <p className="text-red-600 font-semibold mb-4">{error}</p>
        <button onClick={handleGoBack} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  if (!ticket) return null;

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
            gap: '20px', // 요소 간 간격
            textAlign: 'center' // 텍스트 중앙 정렬
        }}>

          {/* 🌟 2. 티켓 이름 (텍스트) */}
          <Typography variant="h4" component="h1" fontWeight="bold">
            {ticket.eventName || '티켓 이름 없음'}
          </Typography>



          {/* 🌟 3. 티켓 상태 및 DEAL 상태 버튼 (한 줄에 배치) */}
          <Stack direction="row" spacing={3} sx={{ my: 2 }}> {/* spacing={3}로 간격 조정 */}

            {/* 티켓 상태 버튼 (색상으로 상태 강조) */}
            <Button
              variant="contained"
              sx={{ backgroundColor: ticket.status === 'AVAILABLE' ? '#4CAF50' : '#FF9800',
                    '&:hover': { backgroundColor: ticket.status === 'AVAILABLE' ? '#388E3C' : '#F57C00' }
              }}
            >
              티켓 상태: {ticket.status || '미확인'}
            </Button>

            {/* DEAL 상태 버튼 (예시) */}
            <Button
              variant="contained"
              color="primary" // primary 색상 사용
              disabled={ticket.status !== 'AVAILABLE'} // 거래 상태에 따라 비활성화 예시
              onClick={handlePurchaseClick}
            >
              DEAL 상태: {ticket.status === 'AVAILABLE' ? '구매 가능' : '거래 불가'}
            </Button>

          </Stack>

        </div>
        {/* 🌟 UI 개선 영역 끝 🌟 */}


        {/* 이하 상세 정보 섹션은 필요에 따라 기존대로 유지하거나 MUI 컴포넌트로 변경 가능 */}
        <section className="space-y-4 mb-8">
          <header className="mt-8 border-b pb-4">
            <Typography variant="h5" component="h2" fontWeight="bold">{ticket.eventName || '이름없음'}</Typography>
          </header>

          <p>가격 문의: {ticket.sellingPrice ? `${ticket.sellingPrice.toLocaleString()}원` : '가격 정보 없음'}</p>
          <p>날짜: {ticket.eventDate || '날짜 미정'}</p>
          <p>장소: {ticket.eventLocation || '장소 정보 없음'}</p>

        </section>
        {/* 🌟 팝업(모달) 컴포넌트 추가 */}
        {/* open 상태와 닫기 함수, 그리고 현재 티켓 정보를 전달합니다. */}
        <DealRequestModal
          open={isDealRequestModalOpen}
          onClose={handleCloseDealRequestModal}
          ticket={ticket}
          onConfirm={handleConfirmPurchase}
        />
        <LoadingModal open={isSubmitting} />
        <RequestSuccessModal
           open={isSuccessModalOpen}
           onClose={() => setIsSuccessModalOpen(false)} // 팝업을 닫는 함수
        />


      </div>
    );
  };

export default TicketDetailPage;