import React, { useEffect, useState } from "react";
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
  Container,
  CircularProgress,
  Alert,
} from "@mui/material";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminNotices, deleteAdminNotice } from "../../api/services/noticeService";

export default function AdminNoticeListPage() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAdminNotices();
      const data = res?.data?.data ?? res?.data ?? res;
      setNotices(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("공지사항 목록 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noticeId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteAdminNotice(noticeId);
      alert("삭제되었습니다.");
      fetchNotices();
    } catch (e) {
      console.error(e);
      alert("삭제 실패");
    }
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              공지사항 관리
            </Typography>
            <Button variant="contained" onClick={() => navigate("/admin/notices/new")}>
              공지 등록
            </Button>
          </Stack>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : notices.length === 0 ? (
            <Typography>등록된 공지사항이 없습니다.</Typography>
          ) : (
            <>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                {notices.map((n) => {
                  const id = n.noticeId ?? n.id;
                  const isVisible = n.isVisible ?? n.is_visible ?? true;
                  const isPinned = n.isPinned ?? n.is_pinned ?? false;
                  const createdAt = n.createdAt ?? n.created_at;
                  return (
                    <Card key={id}>
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
                              {isPinned && <Chip size="small" label="상단고정" color="primary" />}
                              {isVisible ? (
                                <Chip size="small" label="공개" color="success" />
                              ) : (
                                <Chip size="small" label="비공개" />
                              )}
                            </Stack>
                            <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
                              ID: {id} · 등록일:{" "}
                              {createdAt ? new Date(createdAt).toLocaleDateString("ko-KR") : "-"}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="outlined"
                              onClick={() => navigate(`/admin/notices/${id}/edit`)}
                            >
                              수정
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={() => handleDelete(id)}
                            >
                              삭제
                            </Button>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            </>
          )}
        </Box>
      </Container>
    </AdminLayout>
  );
}
