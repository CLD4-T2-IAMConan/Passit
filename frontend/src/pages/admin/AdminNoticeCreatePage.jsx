import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

export default function AdminNoticeCreatePage() {
  const navigate = useNavigate();

  const initial = useMemo(
    () => ({
      title: "",
      content: "",
      is_visible: true,
      is_pinned: false,
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

  const onSubmit = (e) => {
    e.preventDefault();
    console.log("[ADMIN NOTICE CREATE] payload =", form);
    alert("등록 버튼 동작 확인 OK (현재는 console.log만)");
    navigate("/admin/notices");
  };

  return (
    <Box sx={{ p: 3, maxWidth: 960, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" fontWeight={800}>
          관리자 · 공지 등록
        </Typography>

        <Button variant="outlined" onClick={() => navigate("/admin/notices")}>
          목록으로
        </Button>
      </Stack>

      <Divider sx={{ my: 2 }} />

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
              />

              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={<Switch checked={form.is_visible} onChange={onToggle("is_visible")} />}
                  label={form.is_visible ? "공개" : "비공개"}
                />

                <FormControlLabel
                  control={<Switch checked={form.is_pinned} onChange={onToggle("is_pinned")} />}
                  label={form.is_pinned ? "상단고정" : "상단고정 해제"}
                />
              </Stack>

              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button variant="outlined" type="button" onClick={() => setForm(initial)}>
                  초기화
                </Button>
                <Button variant="contained" type="submit">
                  저장
                </Button>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
