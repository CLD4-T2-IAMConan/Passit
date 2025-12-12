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
import defaultTicket from '../assets/images/defaultTicket.png';

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

          // 💡 1. 실제 Java 백엔드 API 호출 (URL은 변경 없음)
          const response = await axios.get(`${TICKET_API_BASE_URL}/tickets/${ticket_id}`);

          // ⚠️ 수정 1: ApiResponse<T> 구조에서 실제 데이터(data)를 추출
          const apiResponse = response.data;
          if (apiResponse.data === null) {
              throw new Error('API 응답에 티켓 상세 정보가 포함되어 있지 않습니다.');
          }
          const data = apiResponse.data; // 💡 실제 TicketResponse 데이터

          // React 컴포넌트의 상태에 맞게 필드명과 데이터 형식 변환
          setTicket({
            // TicketResponse의 모든 필드를 그대로 복사
            ...data,

            // 💡 ticketId를 id로 매핑 (프론트엔드에서 id를 사용한다면)
            id: data.ticketId,

            // ⚠️ 수정 2: eventDate 필드를 사용하고, 시간 정보를 제거
            date: data.eventDate ? data.eventDate.split('T')[0] : '날짜 미정',

            // ⚠️ 수정 3: image1 필드를 주 이미지 URL로 사용
            imageUrl: data.image1 || defaultTicket,

            // 추가: 백엔드에서 받은 eventName을 프론트엔드 필드에 매핑
            eventName: data.eventName,
            eventLocation: data.eventLocation,
            ownerId: data.ownerId,
            ticketStatus: data.ticketStatus,
            originalPrice: data.originalPrice,
            sellingPrice: data.sellingPrice,
            seatInfo: data.seatInfo,
            ticketType: data.ticketType,
            description: data.description
            // ... (나머지 필요한 필드도 여기에 매핑 가능)
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


  if (loading) {
        // 로딩 중일 때는 간단한 로딩 텍스트를 반환하거나 로딩 컴포넌트를 사용합니다.
        return (
            <div className="text-center mt-20">
                <Typography variant="h6" color="textSecondary">
                    티켓 정보를 불러오는 중입니다...
                </Typography>
            </div>
        );
    }


    if (error) {
      // 🚨 수정할 부분: 에러 발생 시 UI 개선
      return (
        <Stack
          spacing={3} // 요소 간 간격
          alignItems="center" // 중앙 정렬
          justifyContent="center"
          sx={{ minHeight: '80vh', p: 4 }} // 화면 중앙에 오도록 최소 높이 설정
        >
          {/* 🚨 에러 메시지: 빨간색, 강조 */}
          <Typography
            variant="h5"
            color="error" // MUI 기본 에러 색상 (빨간색)
            fontWeight="bold"
          >
            {error}
          </Typography>

          {/* 🚨 보조 메시지 (선택 사항) */}
          <Typography
            variant="subtitle1"
            color="textSecondary"
          >
            입력하신 티켓 ID가 존재하지 않거나, 서버 연결에 문제가 발생했습니다.
          </Typography>

          {/* 🚨 목록으로 돌아가기 버튼: MUI Button 사용 */}
          <Button
            variant="outlined" // 외곽선 스타일
            color="primary"
            onClick={handleGoBack}
            size="large" // 큰 버튼 사용
          >
            목록으로 돌아가기
          </Button>
        </Stack>
      );
    }

    if (!ticket) return null; // 데이터 로드 실패 후 ticket이 null이면 아무것도 렌더링하지 않음

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
              sx={{ backgroundColor: ticket.ticketStatus === 'AVAILABLE' ? '#4CAF50' : '#FF9800',
                    '&:hover': { backgroundColor: ticket.ticketStatus === 'AVAILABLE' ? '#388E3C' : '#F57C00' }
              }}
            >
              티켓 상태: {ticket.ticketStatus || '미확인'}
            </Button>

            <Button
              variant="contained"
              color="primary" // primary 색상 사용
              disabled={ticket.ticketStatus !== 'AVAILABLE'} // 거래 상태에 따라 비활성화 예시
              onClick={handlePurchaseClick}
            >
              DEAL 상태: {ticket.ticketStatus === 'AVAILABLE' ? '구매 가능' : '거래 불가'}
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