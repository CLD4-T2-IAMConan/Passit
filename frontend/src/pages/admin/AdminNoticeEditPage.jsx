import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import AdminLayout from "../../layouts/AdminLayout";
import {
  getAdminNoticeDetail,
  updateAdminNotice,
  deleteAdminNotice,
} from "../../api/services/noticeService";

export default function AdminNoticeEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    content: "",
    isVisible: true,
    isPinned: false,
  });

  useEffect(() => {
    fetchNotice();
  }, [id]);

  const fetchNotice = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAdminNoticeDetail(id);
      const data = res?.data ?? res;
      if (data) {
        setForm({
          title: data.title || "",
          content: data.content || "",
          isVisible: data.isVisible ?? data.is_visible ?? true,
          isPinned: data.isPinned ?? data.is_pinned ?? false,
        });
      }
    } catch (err) {
      console.error(err);
      setError("공지사항을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const onToggle = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.checked }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await updateAdminNotice(id, {
        title: form.title,
        content: form.content,
        isVisible: form.isVisible,
        isPinned: form.isPinned,
      });
      alert("수정되었습니다.");
      navigate("/admin/notices");
    } catch (err) {
      console.error(err);
      setError("공지사항 수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      setSubmitting(true);
      await deleteAdminNotice(id);
      alert("삭제되었습니다.");
      navigate("/admin/notices");
    } catch (err) {
      console.error(err);
      alert("삭제 실패");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              공지사항 수정 (ID: {id})
            </Typography>
            <Button variant="outlined" onClick={() => navigate("/admin/notices")}>
              목록으로
            </Button>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Card>
            <CardContent>
              <Box component="form" onSubmit={onSave}>
                <Stack spacing={2}>
                  <TextField
                    label="제목"
                    value={form.title}
                    onChange={onChange("title")}
                    fullWidth
                    required
                    disabled={submitting}
                  />

                  <TextField
                    label="내용"
                    value={form.content}
                    onChange={onChange("content")}
                    fullWidth
                    multiline
                    minRows={6}
                    required
                    disabled={submitting}
                  />

                  <Stack direction="row" spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={form.isVisible}
                          onChange={onToggle("isVisible")}
                          disabled={submitting}
                        />
                      }
                      label={form.isVisible ? "공개" : "비공개"}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={form.isPinned}
                          onChange={onToggle("isPinned")}
                          disabled={submitting}
                        />
                      }
                      label={form.isPinned ? "상단고정" : "상단고정 해제"}
                    />
                  </Stack>

                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      type="button"
                      onClick={() => navigate("/admin/notices")}
                      disabled={submitting}
                    >
                      취소
                    </Button>

                    <Button
                      color="error"
                      variant="outlined"
                      type="button"
                      onClick={onDelete}
                      disabled={submitting}
                    >
                      {submitting ? <CircularProgress size={20} /> : "삭제"}
                    </Button>

                    <Button variant="contained" type="submit" disabled={submitting}>
                      {submitting ? <CircularProgress size={20} /> : "저장"}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </AdminLayout>
  );
}
