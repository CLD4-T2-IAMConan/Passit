import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  Container,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  IconButton,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  ArrowBack,
  Image as ImageIcon,
  Close,
  HelpOutline,
  AttachFile,
} from "@mui/icons-material";
import { createInquiry } from "../../api/services/inquiryService";
import { handleError } from "../../utils/errorHandler";

const INQUIRY_TYPES = [
  { value: "ACCOUNT", label: "계정 관련" },
  { value: "TRADE", label: "거래 관련" },
  { value: "PAYMENT", label: "결제 관련" },
  { value: "SERVICE", label: "서비스 이용" },
  { value: "TICKET", label: "티켓 관련" },
  { value: "ETC", label: "기타" },
];

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const InquiryCreatePage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    type: "",
    title: "",
    content: "",
  });
  const [images, setImages] = useState([]); // File 객체 배열
  const [imagePreviews, setImagePreviews] = useState([]); // 미리보기 URL 배열
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // 폼 필드 변경 핸들러
  const handleChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
    // 에러 메시지 초기화
    if (error) setError(null);
  };

  // 이미지 선택 핸들러
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // 최대 개수 체크
    if (images.length + files.length > MAX_IMAGES) {
      setError(`이미지는 최대 ${MAX_IMAGES}개까지 첨부할 수 있습니다.`);
      return;
    }

    const validFiles = [];
    const previews = [];

    files.forEach((file) => {
      // 파일 크기 체크
      if (file.size > MAX_IMAGE_SIZE) {
        setError(`${file.name} 파일은 5MB 이하여야 합니다.`);
        return;
      }

      // 이미지 타입 체크
      if (!file.type.startsWith("image/")) {
        setError(`${file.name}은(는) 이미지 파일만 업로드 가능합니다.`);
        return;
      }

      validFiles.push(file);

      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result);
        if (previews.length === validFiles.length) {
          setImages((prev) => [...prev, ...validFiles]);
          setImagePreviews((prev) => [...prev, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    });

    // 파일 입력 초기화
    e.target.value = "";
  };

  // 이미지 제거 핸들러
  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // 이미지 URL 변환 (File 객체를 base64 또는 URL로 변환)
  const convertImagesToUrls = async () => {
    const urls = [];
    for (const file of images) {
      // FileReader를 사용하여 base64로 변환
      const url = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      urls.push(url);
    }
    return urls;
  };

  // 폼 제출 핸들러
  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // 유효성 검사
    if (!formData.type) {
      setError("문의 유형을 선택해주세요.");
      return;
    }
    if (!formData.title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    if (formData.title.trim().length < 2) {
      setError("제목은 최소 2자 이상 입력해주세요.");
      return;
    }
    if (!formData.content.trim()) {
      setError("내용을 입력해주세요.");
      return;
    }
    if (formData.content.trim().length < 10) {
      setError("내용은 최소 10자 이상 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      // 이미지 URL 변환
      const imageUrls = await convertImagesToUrls();

      // 백엔드 DTO에 맞춰 페이로드 생성
      const payload = {
        type: formData.type,
        title: formData.title.trim(),
        content: formData.content.trim(),
        imageUrls: imageUrls.length > 0 ? imageUrls : null,
      };

      const response = await createInquiry(payload);
      
      setSuccess(true);
      
      // 성공 후 목록 페이지로 이동
      setTimeout(() => {
        navigate("/cs/inquiries");
      }, 1500);
    } catch (err) {
      console.error("문의 등록 에러:", err);
      const errorMessage = handleError(err);
      setError(errorMessage || "문의 등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", py: 4, mt: "64px" }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p: 4, borderRadius: 2 }}>
          {/* 헤더 */}
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <IconButton onClick={() => navigate("/cs/inquiries")} sx={{ mr: -1 }}>
                <ArrowBack />
              </IconButton>
              <HelpOutline color="primary" sx={{ fontSize: 32 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                문의하기
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              문의사항을 남겨주시면 빠르게 답변드리겠습니다.
            </Typography>
          </Box>

          {/* 알림 메시지 */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              문의가 성공적으로 등록되었습니다. 목록 페이지로 이동합니다...
            </Alert>
          )}

          <form onSubmit={onSubmit}>
            <Stack spacing={3}>
              {/* 문의 유형 선택 */}
              <FormControl fullWidth required>
                <InputLabel id="inquiry-type-label">문의 유형</InputLabel>
                <Select
                  labelId="inquiry-type-label"
                  id="inquiry-type"
                  value={formData.type}
                  label="문의 유형"
                  onChange={handleChange("type")}
                  disabled={submitting}
                >
                  {INQUIRY_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 제목 입력 */}
              <TextField
                label="제목"
                value={formData.title}
                onChange={handleChange("title")}
                placeholder="문의 제목을 입력하세요"
                fullWidth
                required
                disabled={submitting}
                helperText={`${formData.title.length}/100자`}
                inputProps={{ maxLength: 100 }}
              />

              {/* 내용 입력 */}
              <TextField
                label="내용"
                value={formData.content}
                onChange={handleChange("content")}
                placeholder="문의 내용을 상세히 입력해주세요. (최소 10자 이상)"
                fullWidth
                required
                multiline
                minRows={8}
                disabled={submitting}
                helperText={`${formData.content.length}자 (최소 10자 이상)`}
                sx={{
                  "& .MuiInputBase-root": {
                    fontFamily: "inherit",
                  },
                }}
              />

              {/* 이미지 첨부 섹션 */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  이미지 첨부 (선택)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
                  문제 상황을 설명하는 이미지를 첨부해주세요. (최대 {MAX_IMAGES}개, 각 5MB 이하)
                </Typography>

                <Grid container spacing={2}>
                  {/* 이미지 미리보기 */}
                  {imagePreviews.map((preview, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card
                        sx={{
                          position: "relative",
                          aspectRatio: "1 / 1",
                          overflow: "hidden",
                          borderRadius: 2,
                        }}
                      >
                        <Box
                          component="img"
                          src={preview}
                          alt={`첨부 이미지 ${index + 1}`}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveImage(index)}
                          disabled={submitting}
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            bgcolor: "rgba(0, 0, 0, 0.5)",
                            color: "white",
                            "&:hover": {
                              bgcolor: "rgba(0, 0, 0, 0.7)",
                            },
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Card>
                    </Grid>
                  ))}

                  {/* 이미지 추가 버튼 */}
                  {images.length < MAX_IMAGES && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        disabled={submitting}
                        sx={{
                          aspectRatio: "1 / 1",
                          borderStyle: "dashed",
                          borderWidth: 2,
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                          height: "100%",
                          minHeight: 150,
                        }}
                      >
                        <AttachFile sx={{ fontSize: 40, color: "grey.400" }} />
                        <Typography variant="body2" color="text.secondary">
                          이미지 추가
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({images.length}/{MAX_IMAGES})
                        </Typography>
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                        />
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* 안내 문구 */}
              <Box
                sx={{
                  p: 2.5,
                  bgcolor: "rgba(25, 118, 210, 0.04)", // 매우 연한 파란색 배경
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "rgba(25, 118, 210, 0.12)", // 연한 테두리
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", mb: 1 }}>
                  안내사항
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  • 문의하신 내용은 평일 기준 1-2일 내에 답변드립니다.
                  <br />
                  • 계정 관련 문의는 이메일 인증이 필요할 수 있습니다.
                  <br />
                  • 개인정보가 포함된 내용은 등록하지 마세요.
                </Typography>
              </Box>

              {/* 버튼 그룹 */}
              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate("/cs/inquiries")}
                  disabled={submitting}
                  startIcon={<ArrowBack />}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting || !formData.type || !formData.title.trim() || !formData.content.trim()}
                  startIcon={submitting ? <CircularProgress size={16} /> : null}
                >
                  {submitting ? "등록 중..." : "문의 등록"}
                </Button>
              </Stack>
            </Stack>
          </form>
        </Paper>
      </Container>

      {/* Snackbar 알림 */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setError(null)} sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InquiryCreatePage;
