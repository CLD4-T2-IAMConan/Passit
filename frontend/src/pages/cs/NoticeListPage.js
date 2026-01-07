import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Stack,
} from "@mui/material";
import { getNotices } from "../../services/noticeService";

// 테스트 데이터
const MOCK_NOTICES = [
  {
    id: 1,
    noticeId: 1,
    title: "🎉 Passit 서비스 오픈 안내",
    content: "Passit 티켓 거래 플랫폼이 정식 오픈되었습니다. 많은 이용 부탁드립니다.",
    isImportant: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    noticeId: 2,
    title: "티켓 거래 시 주의사항",
    content: "안전한 거래를 위해 반드시 확인해주세요.",
    isImportant: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    noticeId: 3,
    title: "결제 시스템 점검 안내",
    content: "2024년 1월 10일 02:00 ~ 04:00 결제 시스템 점검으로 인해 일시적으로 결제 서비스가 중단됩니다.",
    isImportant: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    noticeId: 4,
    title: "신규 회원 가입 이벤트",
    content: "신규 회원 가입 시 5,000원 적립금을 드립니다. 많은 참여 부탁드립니다!",
    isImportant: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    noticeId: 5,
    title: "고객센터 운영 시간 안내",
    content: "고객센터 운영 시간은 평일 09:00 ~ 18:00입니다. 주말 및 공휴일은 휴무입니다.",
    isImportant: false,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function NoticeListPage() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const res = await getNotices();

        // 백엔드 응답: { success: true, data: [...] }
        const list = res?.data?.data ?? [];
        const fetchedNotices = Array.isArray(list) ? list : [];
        
        // 데이터가 없거나 빈 배열이면 테스트 데이터 사용
        if (fetchedNotices.length === 0) {
          setNotices(MOCK_NOTICES);
        } else {
          setNotices(fetchedNotices);
        }
      } catch (e) {
        console.error(e);
        // API 호출 실패 시 테스트 데이터 사용
        setNotices(MOCK_NOTICES);
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  return (
    <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", pt: "64px" }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            공지사항
          </Typography>
          <Typography variant="body1" color="text.secondary">
            중요한 공지사항을 확인하세요
          </Typography>
        </Box>

        <Paper sx={{ p: 2 }}>
          {loading && (
            <Stack alignItems="center" sx={{ py: 6 }}>
              <CircularProgress />
            </Stack>
          )}

          {!loading && errorMsg && (
            <Alert severity="error" sx={{ my: 2 }}>
              {errorMsg}
            </Alert>
          )}

          {!loading && !errorMsg && notices.length === 0 && (
            <Typography sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
              등록된 공지사항이 없습니다.
            </Typography>
          )}

          {!loading && !errorMsg && notices.length > 0 && (
            <List>
              {notices.map((notice, idx) => {
                const id = notice?.id ?? notice?.noticeId;
                const title = notice?.title ?? "(제목 없음)";
                const createdAt = notice?.createdAt ?? notice?.createdDate ?? "";

                return (
                  <React.Fragment key={id ?? idx}>
                    <ListItem disablePadding>
                      <ListItemButton onClick={() => navigate(`/cs/notices/${id}`)}>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography fontWeight={600}>{title}</Typography>
                              {notice?.isImportant && (
                                <Chip label="중요" color="error" size="small" />
                              )}
                            </Stack>
                          }
                          secondary={createdAt ? `작성일: ${new Date(createdAt).toLocaleDateString("ko-KR")}` : ""}
                        />
                      </ListItemButton>
                    </ListItem>
                    {idx !== notices.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
