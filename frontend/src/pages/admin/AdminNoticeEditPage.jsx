import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

export default function AdminNoticeEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    title: "",
    content: "",
    is_visible: true,
    is_pinned: false,
  });

  useEffect(() => {
    // ✅ 더미 데이터로 기존값 세팅
    const dummy = {
      title: `공지사항 제목 ${id}`,
      content: `공지사항 내용입니다. (더미)\nID = ${id}`,
      is_visible: true,
      is_pinned: id === "1",
    };
    setForm(dummy);
  }, [id]);

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const onToggle = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.checked }));
  };

  const onSave = (e) => {
    e.preventDefault();
    console.log("[ADMIN NOTICE UPDATE] id =", id, "payload =", form);
    alert("수정 버튼 동작 확인 OK (현재는 console.log만)");
    navigate("/admin/notices");
  };

  const onDelete = () => {
    console.log("[ADMIN NOTICE DELETE] id =", id);
    alert("삭제 버튼 동작 확인 OK (현재는 console.log만)");
    navigate("/admin/notices");
  };

  return (
    <Box sx={{ p: 3, maxWidth: 960, mx: "auto" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5" fontWeight={800}>
          관리자 · 공지 수정 (ID: {id})
        </Typography>

        <Button variant="outlined" onClick={() => navigate("/admin/notices")}>
          목록으로
        </Button>
      </Stack>

      <Divider sx={{ my: 2 }} />

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
              />

              <TextField
                label="내용"
                value={form.content}
                onChange={onChange("content")}
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
                <Button variant="outlined" type="button" onClick={() => navigate("/admin/notices")}>
                  취소
                </Button>

                <Button color="error" variant="outlined" type="button" onClick={onDelete}>
                  삭제
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
