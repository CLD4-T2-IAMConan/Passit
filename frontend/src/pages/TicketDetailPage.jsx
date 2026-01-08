/**
 * 상용화 수준 티켓 상세 페이지
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  Divider,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  Breadcrumbs,
  Link,
  MobileStepper,
} from "@mui/material";
import {
  ArrowBack,
  Favorite,
  FavoriteBorder,
  Share,
  Chat,
  LocationOn,
  CalendarToday,
  ConfirmationNumber,
  AttachMoney,
  Person,
  CheckCircle,
  Cancel,
  KeyboardArrowLeft,
  KeyboardArrowRight,
} from "@mui/icons-material";
import ticketService from "../api/services/ticketService";
import userService from "../services/userService";
import authService from "../services/authService";
import { useAuth } from "../contexts/AuthContext";
import tokenManager from "../lib/auth/tokenManager";
import { createChatRoom } from "../api/services/chat/chat.api";
import DealRequestModal from "../components/Ticket/DealRequestModal";
import LoadingModal from "../components/Ticket/LoadingModal";
import RequestSuccessModal from "../components/Ticket/RequestSuccessModal";

const TicketDetailPage = () => {
  const { ticket_id } = useParams();
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated } = useAuth();

  // 상태 관리
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDealRequestModalOpen, setIsDealRequestModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // 티켓 정보 로딩
  useEffect(() => {
    if (!ticket_id) {
      setLoading(false);
      setError("티켓 ID가 유효하지 않습니다.");
      return;
    }

    const fetchTicket = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await ticketService.getTicketDetail(ticket_id);
        if (response.success && response.data) {
          setTicket(response.data);
        } else {
          throw new Error("티켓 정보를 불러올 수 없습니다.");
        }
      } catch (err) {
        console.error("Failed to fetch ticket detail:", err);
        if (err.response?.status === 404) {
          setError(`티켓 ID ${ticket_id}번을 찾을 수 없습니다.`);
        } else {
          setError("티켓 정보를 불러오는 데 실패했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticket_id]);

  // 찜하기 상태 확인 (로그인한 경우에만)
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!currentUser || !ticket_id) return;

      try {
        const response = await ticketService.checkFavorite(ticket_id);
        if (response.success) {
          setIsFavorite(response.data);
        }
      } catch (error) {
        console.error("Failed to check favorite status:", error);
        // 에러가 나도 계속 진행 (로그인 안 한 경우일 수 있음)
      }
    };

    checkFavoriteStatus();
  }, [currentUser, ticket_id]);

  // 사용자 정보 로딩
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoadingUser(true);
        // 먼저 로컬스토리지에서 사용자 정보 확인
        const localUser = authService.getCurrentUser();
        if (localUser) {
          // userId 필드가 없으면 id 필드 사용
          setCurrentUser({
            ...localUser,
            userId: localUser.userId || localUser.id,
          });
          setLoadingUser(false);
          return;
        }

        // 로컬스토리지에 없으면 API 호출
        const response = await userService.getMe();
        // response.data가 객체인지 확인
        const userData = response.data || response;
        setCurrentUser({
          ...userData,
          userId: userData.userId || userData.id,
        });
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        // 에러가 나도 로컬스토리지에서 한 번 더 확인
        const localUser = authService.getCurrentUser();
        if (localUser) {
          setCurrentUser({
            ...localUser,
            userId: localUser.userId || localUser.id,
          });
        } else {
          setCurrentUser(null);
        }
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserInfo();
  }, []);

  // 카테고리 이름 매핑
  const getCategoryName = (categoryId) => {
    const categoryMap = {
      1: "콘서트",
      2: "뮤지컬",
      3: "스포츠",
      4: "전시",
      5: "클래식",
    };
    return categoryMap[categoryId] || "기타";
  };

  // 상태 라벨 및 색상
  const getStatusInfo = (status) => {
    const statusMap = {
      AVAILABLE: { label: "판매중", color: "success" },
      RESERVED: { label: "예약중", color: "warning" },
      SOLD: { label: "판매완료", color: "default" },
      EXPIRED: { label: "만료", color: "error" },
    };
    return statusMap[status] || { label: status, color: "default" };
  };

  // 거래 방식 라벨
  const getTradeTypeLabel = (tradeType) => {
    const tradeTypeMap = {
      ONSITE: "현장 거래",
      DELIVERY: "택배 거래",
    };
    return tradeTypeMap[tradeType] || tradeType;
  };

  // 찜하기 토글
  const handleToggleFavorite = async () => {
    if (!currentUser) {
      setSubmitError("찜하기 기능은 로그인이 필요합니다.");
      return;
    }
    if (!ticket_id) {
      setSubmitError("티켓 정보가 없습니다.");
      return;
    }

    // JWT 토큰 확인
    const token = tokenManager.getAccessToken();
    if (!token) {
      setSubmitError("로그인 토큰이 없습니다. 다시 로그인해주세요.");
      return;
    }

    try {
      const response = await ticketService.toggleFavorite(ticket_id);
      if (response.success) {
        setIsFavorite(response.data); // true면 찜하기 추가, false면 제거
      } else {
        setSubmitError(response.error || "찜하기 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      if (error.response?.status === 403) {
        setSubmitError("인증이 필요합니다. 다시 로그인해주세요.");
      } else if (error.response?.status === 401) {
        setSubmitError("로그인이 만료되었습니다. 다시 로그인해주세요.");
      } else {
        setSubmitError(error.response?.data?.error || "찜하기 처리 중 오류가 발생했습니다.");
      }
    }
  };

  // 공유하기
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: ticket?.eventName || "티켓",
          text: ticket?.description || "",
          url: url,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // 클립보드에 복사
      navigator.clipboard.writeText(url).then(() => {
        alert("링크가 클립보드에 복사되었습니다.");
      });
    }
  };

  // 채팅으로 이동
  const handleChat = async () => {
    if (!isAuthenticated || !currentUser) {
      setSubmitError("채팅 기능은 로그인이 필요합니다.");
      return;
    }
    if (!ticket || !ticket.ticketId) {
      setSubmitError("티켓 정보가 부족합니다.");
      return;
    }
    if (ticket.ownerId === currentUser.userId) {
      setSubmitError("자신의 티켓에는 채팅할 수 없습니다.");
      return;
    }

    try {
      setSubmitError(null);
      // 채팅방 생성 API 호출
      const newRoom = await createChatRoom({
        ticketId: ticket.ticketId,
        buyerId: currentUser.userId,
      });

      if (!newRoom || !newRoom.chatroomId) {
        throw new Error("채팅방 생성 응답이 올바르지 않습니다.");
      }

      // 생성된 채팅방으로 바로 이동
      navigate(`/chat/${newRoom.chatroomId}`, {
        state: { isNewRoom: true, buyerId: currentUser.userId },
      });
    } catch (error) {
      console.error("채팅방 생성 실패:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "채팅방 생성에 실패했습니다. 다시 시도해주세요.";
      setSubmitError(errorMessage);
    }
  };

  // 양도 요청
  const handlePurchaseClick = () => {
    if (!currentUser) {
      setSubmitError("로그인이 필요합니다.");
      return;
    }
    if (!ticket || !ticket.ticketId) {
      setSubmitError("티켓 정보가 부족합니다.");
      return;
    }
    if (ticket.ownerId === currentUser.userId) {
      setSubmitError("자신의 티켓은 구매할 수 없습니다.");
      return;
    }
    if (ticket.ticketStatus !== "AVAILABLE") {
      setSubmitError("현재 판매 중인 티켓이 아닙니다.");
      return;
    }

    setSubmitError(null);
    setIsDealRequestModalOpen(true);
  };

  // 양도 요청 확인
  const handleConfirmPurchase = async (ticketId, quantity) => {
    if (!currentUser || !currentUser.userId) {
      setSubmitError("로그인 정보가 유효하지 않습니다.");
      setIsDealRequestModalOpen(false);
      return;
    }

    if (ticket.ownerId === currentUser.userId) {
      setSubmitError("자신의 티켓은 구매할 수 없습니다.");
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
      // tradeService 사용
      const tradeService = (await import("../services/tradeService")).default;
      const response = await tradeService.createDealRequest({
        buyerId: currentUser.userId,
        ticketId: ticketId,
        quantity: quantity,
        expireAt: expireAtISOString,
      });

      // 백엔드가 ApiResponse를 반환할 수 있으므로 처리
      if (response && (response.success || response.dealId)) {
        setIsDealRequestModalOpen(false);
        setIsSuccessModalOpen(true);
      } else {
        throw new Error(
          response?.error || response?.message || "요청 처리 중 오류가 발생했습니다."
        );
      }
    } catch (error) {
      console.error("❌ 양도 요청 실패:", error);
      setSubmitError(error.message || "요청 처리 중 알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 성공 모달 확인
  const handleSuccessConfirm = () => {
    setIsSuccessModalOpen(false);
    window.location.reload();
  };

  if (loading || loadingUser) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Stack spacing={3} alignItems="center">
          <Typography variant="h5" color="error" fontWeight="bold">
            {error}
          </Typography>
          <Button variant="contained" onClick={() => navigate("/tickets")}>
            목록으로 돌아가기
          </Button>
        </Stack>
      </Container>
    );
  }

  if (!ticket) return null;

  const isOwner = currentUser && ticket.ownerId === currentUser.userId;
  const isAvailable = ticket.ticketStatus === "AVAILABLE";
  const statusInfo = getStatusInfo(ticket.ticketStatus);

  return (
    <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", pt: "64px" }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            color="inherit"
            href="/tickets"
            onClick={(e) => {
              e.preventDefault();
              navigate("/tickets");
            }}
            sx={{ cursor: "pointer" }}
          >
            티켓 목록
          </Link>
          <Typography color="text.primary">{ticket.eventName}</Typography>
        </Breadcrumbs>

        <Grid container spacing={4}>
          {/* 왼쪽: 이미지 슬라이드 */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, overflow: "hidden", position: "relative" }}>
              {/* 이미지 슬라이드 */}
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "1 / 1", // 정방형
                  minHeight: 600, // 아까 크기 유지
                  bgcolor: "grey.300",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {/* 이미지 목록 */}
                {(() => {
                  const images = [ticket.image1, ticket.image2].filter(Boolean);
                  const currentImage = images[activeImageIndex] || null;

                  return (
                    <>
                      {currentImage ? (
                        <Box
                          component="img"
                          src={currentImage}
                          alt={`${ticket.eventName} - 이미지 ${activeImageIndex + 1}`}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <ConfirmationNumber sx={{ fontSize: 120, color: "grey.400" }} />
                      )}

                      {/* 이전/다음 버튼 (이미지가 2개 이상일 때만 표시) */}
                      {images.length > 1 && (
                        <>
                          <IconButton
                            onClick={() =>
                              setActiveImageIndex((prev) =>
                                prev === 0 ? images.length - 1 : prev - 1
                              )
                            }
                            sx={{
                              position: "absolute",
                              left: 8,
                              top: "50%",
                              transform: "translateY(-50%)",
                              bgcolor: "rgba(255, 255, 255, 0.8)",
                              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.9)" },
                            }}
                          >
                            <KeyboardArrowLeft />
                          </IconButton>
                          <IconButton
                            onClick={() =>
                              setActiveImageIndex((prev) =>
                                prev === images.length - 1 ? 0 : prev + 1
                              )
                            }
                            sx={{
                              position: "absolute",
                              right: 8,
                              top: "50%",
                              transform: "translateY(-50%)",
                              bgcolor: "rgba(255, 255, 255, 0.8)",
                              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.9)" },
                            }}
                          >
                            <KeyboardArrowRight />
                          </IconButton>
                        </>
                      )}
                    </>
                  );
                })()}
              </Box>

              {/* 이미지 인디케이터 (이미지가 2개 이상일 때만 표시) */}
              {(() => {
                const images = [ticket.image1, ticket.image2].filter(Boolean);
                if (images.length <= 1) return null;

                return (
                  <MobileStepper
                    steps={images.length}
                    position="static"
                    activeStep={activeImageIndex}
                    sx={{
                      bgcolor: "transparent",
                      justifyContent: "center",
                      py: 1,
                    }}
                    nextButton={null}
                    backButton={null}
                  />
                );
              })()}
            </Card>
          </Grid>

          {/* 오른쪽: 상세 정보 및 액션 */}
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              {/* 헤더 */}
              <Box>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Chip label={getCategoryName(ticket.categoryId)} color="primary" size="small" />
                  <Chip label={statusInfo.label} color={statusInfo.color} size="small" />
                  <Chip
                    label={getTradeTypeLabel(ticket.tradeType)}
                    variant="outlined"
                    size="small"
                  />
                </Stack>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {ticket.eventName}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {ticket.description || "상세 설명이 없습니다."}
                </Typography>
              </Box>

              <Divider />

              {/* 티켓 정보 */}
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Stack spacing={2}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarToday color="action" />
                    <Typography variant="body1">
                      <strong>공연 날짜:</strong>{" "}
                      {ticket.eventDate
                        ? new Date(ticket.eventDate).toLocaleString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "날짜 미정"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationOn color="action" />
                    <Typography variant="body1">
                      <strong>장소:</strong> {ticket.eventLocation || "장소 정보 없음"}
                    </Typography>
                  </Box>
                  {ticket.seatInfo && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <ConfirmationNumber color="action" />
                      <Typography variant="body1">
                        <strong>좌석 정보:</strong> {ticket.seatInfo}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AttachMoney color="action" />
                    <Typography variant="body1">
                      <strong>정가:</strong> {ticket.originalPrice?.toLocaleString()}원
                    </Typography>
                  </Box>
                  {ticket.sellingPrice && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <AttachMoney color="primary" />
                      <Typography variant="h6" color="primary">
                        <strong>판매 가격:</strong> {ticket.sellingPrice.toLocaleString()}원
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>

              {/* 에러 메시지 */}
              {submitError && (
                <Alert
                  severity="error"
                  onClose={() => setSubmitError(null)}
                  sx={{
                    maxHeight: "100px",
                    overflowY: "auto",
                    wordBreak: "break-word",
                    "& .MuiAlert-message": {
                      width: "100%",
                    },
                  }}
                >
                  {submitError}
                </Alert>
              )}

              {/* 액션 버튼들 */}
              <Stack spacing={2}>
                {/* 찜하기, 공유하기 아이콘 (상단) */}
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <IconButton
                    onClick={handleToggleFavorite}
                    color={isFavorite ? "error" : "default"}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    {isFavorite ? <Favorite /> : <FavoriteBorder />}
                  </IconButton>
                  <IconButton
                    onClick={handleShare}
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Share />
                  </IconButton>
                </Stack>

                {/* 메인 액션 버튼들 */}
                <Stack spacing={2}>
                  {isOwner ? (
                    <Button variant="contained" size="large" fullWidth disabled sx={{ py: 1.5 }}>
                      내가 등록한 티켓입니다
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={!isAvailable}
                        onClick={handlePurchaseClick}
                        sx={{ py: 1.5 }}
                      >
                        {isAvailable ? "양도 요청하기" : "판매 중이 아닙니다"}
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        fullWidth
                        startIcon={<Chat />}
                        onClick={handleChat}
                        disabled={!currentUser || isOwner}
                        sx={{ py: 1.5 }}
                      >
                        채팅하기
                      </Button>
                    </>
                  )}
                </Stack>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* 모달들 */}
      <DealRequestModal
        open={isDealRequestModalOpen}
        onClose={() => setIsDealRequestModalOpen(false)}
        ticket={ticket}
        onConfirm={handleConfirmPurchase}
      />
      <LoadingModal open={isSubmitting} />
      <RequestSuccessModal
        open={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        onConfirmReload={handleSuccessConfirm}
      />
    </Box>
  );
};

export default TicketDetailPage;
