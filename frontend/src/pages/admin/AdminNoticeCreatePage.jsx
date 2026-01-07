import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { createAdminNotice } from "../../api/services/noticeService";

export default function AdminNoticeCreatePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const initial = useMemo(
    () => ({
      title: "",
      content: "",
      isVisible: true,
      isPinned: false,
    }),
    []
  );

  const [form, setForm] = useState(initial);

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const onToggle = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.checked }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await createAdminNotice({
        title: form.title,
        content: form.content,
        isVisible: form.isVisible,
        isPinned: form.isPinned,
      });
      alert("공지사항이 등록되었습니다.");
      navigate("/admin/notices");
    } catch (err) {
      console.error(err);
      setError("공지사항 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              공지사항 등록
            </Typography>
            <Button variant="outlined" onClick={() => navigate("/admin/notices")}>
              목록으로
            </Button>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Card>
            <CardContent>
              <Box component="form" onSubmit={onSubmit}>
                <Stack spacing={2}>
                  <TextField
                    label="제목"
                    value={form.title}
                    onChange={onChange("title")}
                    placeholder="공지 제목을 입력하세요"
                    fullWidth
                    required
                    disabled={submitting}
                  />

                  <TextField
                    label="내용"
                    value={form.content}
                    onChange={onChange("content")}
                    placeholder="공지 내용을 입력하세요"
                    fullWidth
                    multiline
                    minRows={6}
                    required
                    disabled={submitting}
                  />

                  <Stack direction="row" spacing={2}>
                    <FormControlLabel
                      control={<Switch checked={form.isVisible} onChange={onToggle("isVisible")} disabled={submitting} />}
                      label={form.isVisible ? "공개" : "비공개"}
                    />

                    <FormControlLabel
                      control={<Switch checked={form.isPinned} onChange={onToggle("isPinned")} disabled={submitting} />}
                      label={form.isPinned ? "상단고정" : "상단고정 해제"}
                    />
                  </Stack>

                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button variant="outlined" type="button" onClick={() => setForm(initial)} disabled={submitting}>
                      초기화
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
