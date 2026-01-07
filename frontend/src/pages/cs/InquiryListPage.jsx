import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Alert,
} from "@mui/material";

import { getMyInquiries } from "../../api/services/inquiryService";

// 테스트 데이터
const MOCK_INQUIRIES = [
  {
    id: 1,
    inquiryId: 1,
    title: "티켓 거래 취소 문의",
    content: "티켓 거래를 취소하고 싶은데 어떻게 해야 하나요?",
    status: "ANSWERED",
    answerStatus: "ANSWERED",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    inquiryId: 2,
    title: "결제 오류 관련 문의",
    content: "결제 중 오류가 발생했습니다. 환불이 가능한가요?",
    status: "PENDING",
    answerStatus: "PENDING",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    inquiryId: 3,
    title: "회원 정보 수정 방법",
    content: "회원 정보를 수정하고 싶은데 어디서 할 수 있나요?",
    status: "ANSWERED",
    answerStatus: "ANSWERED",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    inquiryId: 4,
    title: "티켓 등록 방법 문의",
    content: "티켓을 등록하고 싶은데 어떻게 해야 하나요?",
    status: "PENDING",
    answerStatus: "PENDING",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const InquiryListPage = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchList = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await getMyInquiries();

      // 백엔드 응답 형태가 배열이거나 { data: [...] }거나 섞여도 최대한 안전하게 처리
      const data = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res)
          ? res
          : [];

      // 데이터가 없거나 빈 배열이면 빈 배열로 표시
      setItems(data);
    } catch (err) {
      console.error("문의 목록 조회 실패:", err);
      setErrorMsg("문의 목록을 불러오는데 실패했습니다. 다시 시도해주세요.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", pt: "64px" }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            문의 목록
          </Typography>

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={fetchList}>
            새로고침
          </Button>
          <Button variant="contained" onClick={() => navigate("/cs/inquiries/new")}>
            문의하기
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              문의 목록을 불러오는 중...
            </Typography>
          </Stack>
        ) : errorMsg ? (
          <Alert severity="error" sx={{ my: 2 }}>
            {errorMsg}
            <Button size="small" onClick={fetchList} sx={{ mt: 1 }}>
              다시 시도
            </Button>
          </Alert>
        ) : items.length === 0 ? (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              등록된 문의가 없습니다.
            </Typography>
            <Button variant="contained" onClick={() => navigate("/cs/inquiries/new")}>
              문의하기
            </Button>
          </Stack>
        ) : (
          <List>
            {items.map((it, idx) => {
              // id 키가 inquiryId / id 등으로 올 수 있어서 안전 처리
              const id = it?.inquiryId ?? it?.id;

              // 제목/상태도 프로젝트마다 필드명이 다를 수 있어서 fallback
              const title = it?.title ?? it?.subject ?? `문의 #${id ?? idx + 1}`;
              const status = it?.status ?? it?.answerStatus ?? "";

              return (
                <React.Fragment key={id ?? idx}>
                  <ListItem
                    button
                    onClick={() => {
                      if (!id) return;
                      navigate(`/cs/inquiries/${id}`);
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography fontWeight={700}>{title}</Typography>
                          {status && (
                            <Chip
                              label={status === "ANSWERED" || status === "완료" ? "답변완료" : "대기중"}
                              color={status === "ANSWERED" || status === "완료" ? "success" : "warning"}
                              size="small"
                            />
                          )}
                        </Stack>
                      }
                      secondary={
                        it?.createdAt
                          ? `작성일: ${new Date(it.createdAt).toLocaleDateString("ko-KR")}`
                          : it?.createdDate
                            ? `작성일: ${new Date(it.createdDate).toLocaleDateString("ko-KR")}`
                            : ""
                      }
                    />
                  </ListItem>
                  {idx !== items.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Paper>
      </Container>
    </Box>
  );
};

export default InquiryListPage;
