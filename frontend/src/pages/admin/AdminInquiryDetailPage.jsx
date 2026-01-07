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
  TextField,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminInquiryDetail, answerInquiry } from "../../api/services/inquiryService";

const AdminInquiryDetailPage = () => {
  const { inquiryId } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answerContent, setAnswerContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchInquiryDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await getAdminInquiryDetail(inquiryId);
        const data = res?.data ?? res ?? null;

        if (data) {
          setInquiry(data);
          setAnswerContent(data.answerContent || "");
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

  const handleSubmitAnswer = async () => {
    if (!answerContent.trim()) {
      alert("답변 내용을 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      await answerInquiry(inquiryId, { answerContent });
      alert("답변이 등록되었습니다.");
      // 페이지 새로고침
      window.location.reload();
    } catch (err) {
      console.error("답변 등록 실패:", err);
      alert("답변 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === "ANSWERED" || status === "완료") return "success";
    if (status === "PENDING" || status === "대기") return "warning";
    return "default";
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/admin/inquiries")}
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
                      label={inquiry.status === "ANSWERED" ? "답변완료" : inquiry.status === "PENDING" ? "대기중" : inquiry.status}
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

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  답변 작성
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  placeholder="답변 내용을 입력해주세요."
                  disabled={submitting}
                  sx={{ mb: 2 }}
                />
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    onClick={handleSubmitAnswer}
                    disabled={submitting || !answerContent.trim()}
                  >
                    {submitting ? "등록 중..." : inquiry.answerContent ? "답변 수정" : "답변 등록"}
                  </Button>
                </Stack>
              </Box>

              {inquiry.answerContent && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      기존 답변
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
                        {inquiry.answerContent}
                      </Typography>
                      {inquiry.answeredAt && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
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
    </AdminLayout>
  );
};

export default AdminInquiryDetailPage;

