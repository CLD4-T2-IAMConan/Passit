import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getInquiryDetail } from "../../api/services/inquiryService";

// 테스트 데이터
const MOCK_INQUIRIES = {
  1: {
    id: 1,
    inquiryId: 1,
    title: "티켓 거래 취소 문의",
    content: "티켓 거래를 취소하고 싶은데 어떻게 해야 하나요? 결제는 이미 완료된 상태입니다.",
    status: "ANSWERED",
    answerStatus: "ANSWERED",
    answer:
      "티켓 거래 취소는 판매자와 구매자 간 협의가 필요합니다. 채팅방에서 판매자에게 취소 요청을 하시거나, 고객센터로 문의해주시면 도와드리겠습니다. 결제가 완료된 경우 환불 절차가 진행됩니다.",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  2: {
    id: 2,
    inquiryId: 2,
    title: "결제 오류 관련 문의",
    content:
      "결제 중 오류가 발생했습니다. 카드 결제를 시도했는데 '결제 실패' 메시지가 나왔습니다. 환불이 가능한가요?",
    status: "PENDING",
    answerStatus: "PENDING",
    answer: null,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  3: {
    id: 3,
    inquiryId: 3,
    title: "회원 정보 수정 방법",
    content: "회원 정보를 수정하고 싶은데 어디서 할 수 있나요?",
    status: "ANSWERED",
    answerStatus: "ANSWERED",
    answer:
      "회원 정보 수정은 마이페이지 > 프로필에서 가능합니다. 로그인 후 상단 메뉴의 '마이페이지'를 클릭하시면 프로필 수정 페이지로 이동할 수 있습니다.",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  4: {
    id: 4,
    inquiryId: 4,
    title: "티켓 등록 방법 문의",
    content: "티켓을 등록하고 싶은데 어떻게 해야 하나요? 처음 사용하는데 설명이 필요합니다.",
    status: "PENDING",
    answerStatus: "PENDING",
    answer: null,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

const InquiryDetailPage = () => {
  const { inquiryId } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInquiryDetail = async () => {
      setLoading(true);
      setError(null);
      setInquiry(null);

      try {
        const res = await getInquiryDetail(inquiryId);
        const data = res?.data ?? res ?? null;

        if (data) {
          setInquiry(data);
        } else {
          setError("문의 데이터를 찾을 수 없습니다.");
        }
      } catch (err) {
        console.error("문의 상세 조회 실패:", err);
        setError("문의 상세 정보를 불러오는데 실패했습니다. 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    };

    if (inquiryId) {
      fetchInquiryDetail();
    } else {
      setLoading(false);
      setError("문의 ID가 없습니다.");
    }
  }, [inquiryId]);

  const getStatusColor = (status) => {
    if (status === "ANSWERED" || status === "완료") return "success";
    if (status === "PENDING" || status === "대기") return "warning";
    return "default";
  };

  return (
    <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", pt: "64px" }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/cs/inquiries")}
          sx={{ mb: 2 }}
        >
          목록으로
        </Button>

        {loading && (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              문의 정보를 불러오는 중...
            </Typography>
          </Stack>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && !inquiry && (
          <Alert severity="info" sx={{ my: 2 }}>
            문의 데이터가 없습니다.
          </Alert>
        )}

        {!loading && !error && inquiry && (
          <Paper sx={{ p: 4 }}>
            <Stack spacing={3}>
              <Box>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {inquiry.title}
                  </Typography>
                  {inquiry.status && (
                    <Chip
                      label={
                        inquiry.status === "ANSWERED"
                          ? "답변완료"
                          : inquiry.status === "PENDING"
                            ? "대기중"
                            : inquiry.status
                      }
                      color={getStatusColor(inquiry.status)}
                      size="small"
                    />
                  )}
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                  {inquiry.type && (
                    <Typography variant="body2" color="text.secondary">
                      유형: {inquiry.type}
                    </Typography>
                  )}
                  {inquiry.createdAt && (
                    <Typography variant="body2" color="text.secondary">
                      작성일: {new Date(inquiry.createdAt).toLocaleDateString("ko-KR")}
                    </Typography>
                  )}
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  문의 내용
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.8,
                    minHeight: 100,
                  }}
                >
                  {inquiry.content}
                </Typography>
                {inquiry.imageUrls && inquiry.imageUrls.length > 0 && (
                  <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
                    {inquiry.imageUrls.map((imageUrl, idx) => (
                      <Box
                        key={idx}
                        component="img"
                        src={imageUrl}
                        alt={`첨부 이미지 ${idx + 1}`}
                        sx={{
                          maxWidth: 200,
                          maxHeight: 200,
                          objectFit: "cover",
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                          cursor: "pointer",
                        }}
                        onClick={() => window.open(imageUrl, "_blank")}
                      />
                    ))}
                  </Stack>
                )}
              </Box>

              {(inquiry.answerContent || inquiry.answer) && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      답변
                    </Typography>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: "grey.50",
                        borderRadius: 2,
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.8,
                        }}
                      >
                        {inquiry.answerContent || inquiry.answer}
                      </Typography>
                      {inquiry.answeredAt && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1, display: "block" }}
                        >
                          답변일: {new Date(inquiry.answeredAt).toLocaleDateString("ko-KR")}
                        </Typography>
                      )}
                    </Paper>
                  </Box>
                </>
              )}
            </Stack>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default InquiryDetailPage;
