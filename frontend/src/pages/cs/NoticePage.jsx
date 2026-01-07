import React, { useEffect, useState } from "react";
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
  Chip,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getNoticeDetail } from "../../services/noticeService";

// 테스트 데이터
const MOCK_NOTICES = {
  1: {
    id: 1,
    noticeId: 1,
    title: "🎉 Passit 서비스 오픈 안내",
    content: `Passit 티켓 거래 플랫폼이 정식 오픈되었습니다.

주요 기능:
- 티켓 등록 및 판매
- 안전한 거래 시스템
- 실시간 채팅 기능
- 간편한 결제 시스템

많은 이용 부탁드립니다.`,
    isImportant: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  2: {
    id: 2,
    noticeId: 2,
    title: "티켓 거래 시 주의사항",
    content: `안전한 거래를 위해 반드시 확인해주세요.

1. 티켓 정보 확인
   - 공연명, 날짜, 좌석 정보를 정확히 확인하세요.
   - 티켓 이미지를 꼼꼼히 검토하세요.

2. 거래 전 확인사항
   - 판매자와 채팅으로 상세 정보를 확인하세요.
   - 가격과 수량을 다시 한 번 확인하세요.

3. 결제 후
   - 결제 완료 후 판매자에게 연락이 갑니다.
   - 티켓 수령 방법을 확인하세요.

문제가 발생하면 고객센터로 문의해주세요.`,
    isImportant: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  3: {
    id: 3,
    noticeId: 3,
    title: "결제 시스템 점검 안내",
    content: `2024년 1월 10일 02:00 ~ 04:00 결제 시스템 점검으로 인해 일시적으로 결제 서비스가 중단됩니다.

점검 시간: 2024년 1월 10일 02:00 ~ 04:00 (2시간)
영향 범위: 결제 서비스 일시 중단

점검 시간 동안에는 결제가 불가능하며, 점검 완료 후 정상적으로 이용하실 수 있습니다.
불편을 드려 죄송합니다.`,
    isImportant: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  4: {
    id: 4,
    noticeId: 4,
    title: "신규 회원 가입 이벤트",
    content: `신규 회원 가입 시 5,000원 적립금을 드립니다!

이벤트 기간: 2024년 1월 1일 ~ 1월 31일
지급 조건: 신규 회원 가입 완료 시
지급 금액: 5,000원 적립금

많은 참여 부탁드립니다!`,
    isImportant: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  5: {
    id: 5,
    noticeId: 5,
    title: "고객센터 운영 시간 안내",
    content: `고객센터 운영 시간 안내입니다.

운영 시간: 평일 09:00 ~ 18:00
휴무일: 주말 및 공휴일

문의사항이 있으시면 운영 시간 내에 문의해주시기 바랍니다.
긴급한 사항은 이메일로 문의해주세요.`,
    isImportant: false,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

export default function NoticePage() {
  const { noticeId } = useParams();
  const navigate = useNavigate();

  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const res = await getNoticeDetail(noticeId);

        // 백엔드 응답: { success: true, data: {...} }
        const data = res?.data?.data ?? null;
        
        // 데이터가 없으면 테스트 데이터 사용
        if (!data && MOCK_NOTICES[noticeId]) {
          setNotice(MOCK_NOTICES[noticeId]);
        } else {
          setNotice(data);
        }
      } catch (e) {
        console.error(e);
        // API 호출 실패 시 테스트 데이터 사용
        if (MOCK_NOTICES[noticeId]) {
          setNotice(MOCK_NOTICES[noticeId]);
        } else {
          setErrorMsg("공지 상세 조회 실패");
        }
      } finally {
        setLoading(false);
      }
    };

    if (noticeId) fetchDetail();
  }, [noticeId]);

  return (
    <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", pt: "64px" }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/cs/notices")}
          sx={{ mb: 2 }}
        >
          목록으로
        </Button>

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

        {!loading && !errorMsg && notice && (
          <Paper sx={{ p: 4 }}>
            <Stack spacing={3}>
              <Box>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {notice?.title ?? "(제목 없음)"}
                  </Typography>
                  {notice?.isImportant && (
                    <Chip label="중요" color="error" size="small" />
                  )}
                </Stack>
                {notice?.createdAt && (
                  <Typography variant="body2" color="text.secondary">
                    작성일: {new Date(notice.createdAt).toLocaleDateString("ko-KR")}
                  </Typography>
                )}
              </Box>

              <Divider />

              <Typography
                variant="body1"
                sx={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.8,
                  minHeight: 200,
                }}
              >
                {notice?.content ?? "(내용 없음)"}
              </Typography>
            </Stack>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
