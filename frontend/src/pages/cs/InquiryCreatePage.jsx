import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { createInquiry } from "../../api/services/inquiryService";

const InquiryCreatePage = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) return alert("제목을 입력해줘");
    if (!content.trim()) return alert("내용을 입력해줘");

    setSubmitting(true);
    try {
      // 백엔드 DTO 필드명이 다를 수 있어도 보통 title/content로 받음
      const payload = { title: title.trim(), content: content.trim() };
      await createInquiry(payload);

      alert("문의가 등록됐어");
      navigate("/cs/inquiries");
    } catch (err) {
      console.error(err);
      alert("문의 등록 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          문의하기
        </Typography>
        <Button variant="outlined" onClick={() => navigate("/cs/inquiries")}>
          목록
        </Button>
      </Stack>

      <Paper sx={{ p: 2 }}>
        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            <TextField
              label="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="문의 제목을 입력하세요"
              fullWidth
            />

            <TextField
              label="내용"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="문의 내용을 입력하세요"
              fullWidth
              multiline
              minRows={6}
            />

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate("/cs/inquiries")}
                disabled={submitting}
              >
                취소
              </Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "등록 중..." : "등록"}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default InquiryCreatePage;