import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  Box,
  Paper,
  InputAdornment,
  Card,
  CardMedia,
  IconButton,
  Stack,
  ListSubheader,
} from "@mui/material";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";
import ticketService from "../api/services/ticketService";
import { categoryService } from "../api/services/categoryService";

export default function TicketCreatePage() {
  const navigate = useNavigate();

  // 폼 상태
  const [form, setForm] = useState({
    eventName: "",
    eventDate: "",
    eventLocation: "",
    originalPrice: "",
    categoryId: "",
    tradeType: "",
    sellingPrice: "",
    seatInfo: "",
    ticketType: "일반",
    description: "",
    image1: null,
    image2: null,
  });

  // 이미지 미리보기 상태
  const [imagePreviews, setImagePreviews] = useState({
    image1: null,
    image2: null,
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  // 카테고리 데이터 가져오기
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getAllCategories(true);
        if (response.success) {
          setCategories(response.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // 카테고리 렌더링 헬퍼 (계층 구조)
  const renderCategoryMenuItems = (categories, level = 0) => {
    if (!Array.isArray(categories)) return null;

    return categories.map((category) => {
      const indent = "　".repeat(level); // 전각 공백으로 들여쓰기
      const items = [];

      // 부모 카테고리 (대분류/중분류)
      if (category.children && category.children.length > 0) {
        items.push(
          <ListSubheader key={`header-${category.id}`} sx={{ lineHeight: "36px" }}>
            {indent}
            {category.name}
          </ListSubheader>
        );
        // 자식 카테고리 렌더링
        items.push(...renderCategoryMenuItems(category.children, level + 1));
      } else {
        // 말단 카테고리만 선택 가능
        items.push(
          <MenuItem key={category.id} value={category.id}>
            {indent}
            {category.name}
          </MenuItem>
        );
      }

      return items;
    });
  };

  // 입력 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 가격 검증: 판매가가 정가보다 높으면 경고
    if (name === "sellingPrice" || name === "originalPrice") {
      const originalPrice = name === "originalPrice" ? Number(value) : Number(form.originalPrice);
      const sellingPrice = name === "sellingPrice" ? Number(value) : Number(form.sellingPrice);

      if (sellingPrice > 0 && originalPrice > 0 && sellingPrice > originalPrice) {
        setError("판매 가격은 정가보다 높을 수 없습니다.");
      } else if (error === "판매 가격은 정가보다 높을 수 없습니다.") {
        setError(null);
      }
    }
  };

  // 파일 변경 및 미리보기
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];

    if (file) {
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("이미지 파일은 5MB 이하여야 합니다.");
        return;
      }

      // 이미지 타입 체크
      if (!file.type.startsWith("image/")) {
        setError("이미지 파일만 업로드 가능합니다.");
        return;
      }

      setForm((prev) => ({
        ...prev,
        [name]: file,
      }));

      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => ({
          ...prev,
          [name]: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 제거
  const handleRemoveImage = (imageName) => {
    setForm((prev) => ({
      ...prev,
      [imageName]: null,
    }));
    setImagePreviews((prev) => ({
      ...prev,
      [imageName]: null,
    }));
  };

  // 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 판매 가격 검증
    const originalPrice = Number(form.originalPrice);
    const sellingPrice = Number(form.sellingPrice);

    if (sellingPrice > 0 && sellingPrice > originalPrice) {
      setError("판매 가격은 정가보다 높을 수 없습니다.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();

    // 필수 필드 검증
    if (!form.eventName || !form.eventName.trim()) {
      setError("공연/이벤트 이름은 필수 입력값입니다.");
      setLoading(false);
      return;
    }
    if (!form.eventDate) {
      setError("공연 날짜는 필수 입력값입니다.");
      setLoading(false);
      return;
    }
    if (!form.eventLocation || !form.eventLocation.trim()) {
      setError("공연 장소는 필수 입력값입니다.");
      setLoading(false);
      return;
    }
    if (!form.originalPrice || Number(form.originalPrice) <= 0) {
      setError("원래 가격은 필수 입력값입니다.");
      setLoading(false);
      return;
    }
    if (!form.categoryId) {
      setError("카테고리는 필수 입력값입니다.");
      setLoading(false);
      return;
    }
    if (!form.tradeType) {
      setError("거래 방식은 필수 입력값입니다.");
      setLoading(false);
      return;
    }

    // FormData에 데이터 추가
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        // eventDate는 ISO 형식으로 변환
        if (key === "eventDate" && value) {
          let isoDate = value;
          // datetime-local 형식 (YYYY-MM-DDTHH:mm)을 ISO 8601 형식으로 변환
          if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
            isoDate = value + ":00";
          }
          formData.append(key, isoDate);
        }
        // categoryId는 숫자로 변환
        else if (key === "categoryId") {
          formData.append(key, String(value));
        }
        // originalPrice, sellingPrice는 숫자로 변환
        else if (key === "originalPrice" || key === "sellingPrice") {
          if (value) {
            formData.append(key, String(value));
          }
        }
        // 이미지 파일은 그대로 추가
        else if (key === "image1" || key === "image2") {
          if (value && value instanceof File) {
            formData.append(key, value);
          }
        }
        // 나머지는 문자열로 변환
        else {
          formData.append(key, String(value));
        }
      }
    });

    try {
      const response = await ticketService.createTicket(formData);

      if (!response.success) {
        throw new Error(response.error || response.message || "티켓 등록에 실패했습니다.");
      }

      setSuccess(true);
      setError(null);

      // 2초 후 목록 페이지로 이동
      setTimeout(() => {
        navigate("/tickets");
      }, 2000);
    } catch (err) {
      // 에러 응답에서 상세 메시지 추출
      let errorMessage = "티켓 등록에 실패했습니다.";
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      console.error("티켓 등록 에러:", err.response?.data || err);
      setError(errorMessage);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", py: 4, mt: "64px" }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p: 4, borderRadius: 2 }}>
          {/* 헤더 */}
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <ConfirmationNumberIcon color="primary" sx={{ fontSize: 32 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                티켓 등록
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              판매하실 티켓 정보를 입력해주세요
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
              티켓이 성공적으로 등록되었습니다. 목록 페이지로 이동합니다...
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* 기본 정보 섹션 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                기본 정보
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                  gap: 2.5,
                  gridAutoRows: "1fr",
                }}
              >
                {/* 공연명 - 전체 너비 */}
                <Box sx={{ gridColumn: { xs: "span 1", sm: "span 3" } }}>
                  <TextField
                    fullWidth
                    label="공연명 / 이벤트명"
                    name="eventName"
                    value={form.eventName}
                    onChange={handleChange}
                    required
                    placeholder="예: 아이유 콘서트 2025"
                    InputProps={{
                      sx: { height: 56 },
                    }}
                  />
                </Box>

                {/* 카테고리 */}
                <TextField
                  select
                  fullWidth
                  label="카테고리"
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  required
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: { maxHeight: 400 },
                      },
                    },
                    sx: { height: 56 },
                  }}
                  sx={{
                    "& .MuiInputBase-root": {
                      height: 56,
                    },
                  }}
                >
                  {renderCategoryMenuItems(categories)}
                </TextField>

                {/* 공연 날짜 */}
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="공연 날짜 및 시간"
                  name="eventDate"
                  value={form.eventDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                  InputProps={{
                    sx: { height: 56 },
                  }}
                />

                {/* 공연 장소 */}
                <TextField
                  fullWidth
                  label="공연 장소"
                  name="eventLocation"
                  value={form.eventLocation}
                  onChange={handleChange}
                  required
                  placeholder="예: 잠실실내체육관"
                  InputProps={{
                    sx: { height: 56 },
                  }}
                />

                {/* 티켓 유형 */}
                <TextField
                  fullWidth
                  label="티켓 유형"
                  name="ticketType"
                  value={form.ticketType}
                  onChange={handleChange}
                  placeholder="예: 일반, VIP, 초대권"
                  InputProps={{
                    sx: { height: 56 },
                  }}
                />

                {/* 좌석 정보 - 2칸 차지 */}
                <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
                  <TextField
                    fullWidth
                    label="좌석 정보"
                    name="seatInfo"
                    value={form.seatInfo}
                    onChange={handleChange}
                    placeholder="예: VIP석 A구역 3열 15번"
                    InputProps={{
                      sx: { height: 56 },
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* 가격 정보 섹션 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                가격 정보
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                  gap: 2.5,
                  gridAutoRows: "1fr",
                }}
              >
                {/* 원래 가격 */}
                <TextField
                  fullWidth
                  label="정가"
                  name="originalPrice"
                  type="number"
                  value={form.originalPrice}
                  onChange={handleChange}
                  required
                  InputProps={{
                    endAdornment: <InputAdornment position="end">원</InputAdornment>,
                    sx: { height: 56 },
                  }}
                />

                {/* 판매 가격 */}
                <TextField
                  fullWidth
                  label="판매 가격"
                  name="sellingPrice"
                  type="number"
                  value={form.sellingPrice}
                  onChange={handleChange}
                  placeholder="미입력시 정가와 동일"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">원</InputAdornment>,
                    sx: { height: 56 },
                  }}
                />

                {/* 거래 방식 */}
                <TextField
                  select
                  fullWidth
                  label="거래 방식"
                  name="tradeType"
                  value={form.tradeType}
                  onChange={handleChange}
                  required
                  SelectProps={{
                    sx: { height: 56 },
                  }}
                  sx={{
                    "& .MuiInputBase-root": {
                      height: 56,
                    },
                  }}
                >
                  <MenuItem value="ONSITE">현장거래</MenuItem>
                  <MenuItem value="DELIVERY">배송거래</MenuItem>
                </TextField>
              </Box>
            </Box>

            {/* 상세 설명 섹션 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                상세 설명
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="티켓 설명"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="티켓에 대한 상세한 설명을 입력해주세요&#10;예: 급하게 일정이 생겨 양도합니다. 좋은 자리입니다!"
                helperText="구매자가 알아야 할 정보를 자세히 작성해주세요"
              />
            </Box>

            {/* 이미지 업로드 섹션 */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                티켓 이미지
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                티켓 사진을 업로드해주세요 (최대 2장, 각 5MB 이하)
              </Typography>

              <Grid container spacing={2}>
                {/* 이미지 1 */}
                <Grid item xs={12} sm={6}>
                  <Box
                    sx={{
                      width: "200px",
                      height: "200px",
                      mx: "auto",
                    }}
                  >
                    {imagePreviews.image1 ? (
                      <Card
                        sx={{
                          position: "relative",
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "grey.100",
                          overflow: "hidden",
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={imagePreviews.image1}
                          alt="티켓 이미지 1"
                          sx={{
                            objectFit: "contain",
                            width: "100%",
                            height: "100%",
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveImage("image1")}
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            bgcolor: "rgba(0,0,0,0.6)",
                            color: "white",
                            "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Card>
                    ) : (
                      <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        sx={{
                          height: "100%",
                          borderStyle: "dashed",
                          borderWidth: 2,
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <ImageIcon sx={{ fontSize: 48, color: "grey.400" }} />
                        <Typography variant="body2" color="text.secondary">
                          이미지 1 업로드 (선택)
                        </Typography>
                        <input
                          type="file"
                          name="image1"
                          hidden
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </Button>
                    )}
                  </Box>
                </Grid>

                {/* 이미지 2 */}
                <Grid item xs={12} sm={6}>
                  <Box
                    sx={{
                      width: "200px",
                      height: "200px",
                      mx: "auto",
                    }}
                  >
                    {imagePreviews.image2 ? (
                      <Card
                        sx={{
                          position: "relative",
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "grey.100",
                          overflow: "hidden",
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={imagePreviews.image2}
                          alt="티켓 이미지 2"
                          sx={{
                            objectFit: "contain",
                            width: "100%",
                            height: "100%",
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveImage("image2")}
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            bgcolor: "rgba(0,0,0,0.6)",
                            color: "white",
                            "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Card>
                    ) : (
                      <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        sx={{
                          height: "100%",
                          borderStyle: "dashed",
                          borderWidth: 2,
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <ImageIcon sx={{ fontSize: 48, color: "grey.400" }} />
                        <Typography variant="body2" color="text.secondary">
                          이미지 2 업로드 (선택)
                        </Typography>
                        <input
                          type="file"
                          name="image2"
                          hidden
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* 제출 버튼 */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ minWidth: 120 }}
              >
                {loading ? "등록 중..." : "등록하기"}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
