import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

export default function AdminNoticeListPage() {
  const navigate = useNavigate();

  // ✅ 더미 데이터 (내일 API 붙일 때 여기만 교체)
  const notices = useMemo(
    () => [
      {
        id: 1,
        title: "공지사항 제목 1",
        is_visible: true,
        is_pinned: true,
        created_at: "2025-12-14",
      },
      {
        id: 2,
        title: "공지사항 제목 2",
        is_visible: false,
        is_pinned: false,
        created_at: "2025-12-13",
      },
      {
        id: 3,
        title: "공지사항 제목 3",
        is_visible: true,
        is_pinned: false,
        created_at: "2025-12-12",
      },
    ],
    []
  );

  return (
    <Box sx={{ p: 3, maxWidth: 960, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" fontWeight={800}>
          관리자 · 공지 관리
        </Typography>

        <Button
          variant="contained"
          onClick={() => navigate("/admin/notices/new")}
        >
          공지 등록
        </Button>
      </Stack>

      <Typography sx={{ mt: 1, color: "text.secondary" }}>
        * 현재는 UI 확인용 더미 데이터입니다. (API 연결은 내일)
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Stack spacing={2}>
        {notices.map((n) => (
          <Card key={n.id}>
            <CardContent>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
              >
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight={800}>{n.title}</Typography>
                    {n.is_pinned && <Chip size="small" label="상단고정" />}
                    {n.is_visible ? (
                      <Chip size="small" label="공개" />
                    ) : (
                      <Chip size="small" label="비공개" />
                    )}
                  </Stack>

                  <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
                    ID: {n.id} · 등록일: {n.created_at}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/admin/notices/${n.id}/edit`)}
                  >
                    수정
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}