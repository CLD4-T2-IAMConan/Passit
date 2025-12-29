import { useState } from "react";
import { Container, Typography, TextField, Button, Grid, MenuItem, Alert } from "@mui/material";
import ticketService from "../api/services/ticketService";

export default function TicketCreatePage() {
  // =========================
  // 상태 (TicketCreateRequest 기준)
  // =========================
  const [form, setForm] = useState({
    eventName: "",
    eventDate: "",
    eventLocation: "",
    originalPrice: "",
    categoryId: "",
    tradeType: "",
    sellingPrice: "",
    seatInfo: "",
    ticketType: "",
    description: "",
    image1: null,
    image2: null,
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // =========================
  // 입력 변경
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files[0],
    }));
  };

  // =========================
  // 제출
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        formData.append(key, value);
      }
    });

    try {
      const response = await ticketService.createTicket(formData);

      if (!response.success) {
        throw new Error(response.error);
      }

      setSuccess(true);
      setError(null);
    } catch (err) {
      setError(err.message || "티켓 등록에 실패했습니다.");
      setSuccess(false);
    }
  };

  // =========================
  // 렌더링
  // =========================
  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        티켓 등록
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">티켓이 성공적으로 등록되었습니다.</Alert>}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* 공연명 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="공연명"
              name="eventName"
              value={form.eventName}
              onChange={handleChange}
              required
            />
          </Grid>

          {/* 공연 날짜 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              type="datetime-local"
              label="공연 날짜"
              name="eventDate"
              value={form.eventDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          {/* 공연 장소 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="공연 장소"
              name="eventLocation"
              value={form.eventLocation}
              onChange={handleChange}
              required
            />
          </Grid>

          {/* 카테고리 */}
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="카테고리"
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              required
            >
              <MenuItem value={1}>콘서트</MenuItem>
              <MenuItem value={2}>뮤지컬</MenuItem>
              <MenuItem value={3}>스포츠</MenuItem>
            </TextField>
          </Grid>

          {/* 거래 방식 */}
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="거래 방식"
              name="tradeType"
              value={form.tradeType}
              onChange={handleChange}
              required
            >
              <MenuItem value="DIRECT">직거래</MenuItem>
              <MenuItem value="DELIVERY">배송</MenuItem>
            </TextField>
          </Grid>

          {/* 가격 */}
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="원래 가격"
              name="originalPrice"
              type="number"
              value={form.originalPrice}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="판매 가격"
              name="sellingPrice"
              type="number"
              value={form.sellingPrice}
              onChange={handleChange}
            />
          </Grid>

          {/* 좌석 정보 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="좌석 정보"
              name="seatInfo"
              value={form.seatInfo}
              onChange={handleChange}
            />
          </Grid>

          {/* 티켓 유형 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="티켓 유형"
              name="ticketType"
              value={form.ticketType}
              onChange={handleChange}
            />
          </Grid>

          {/* 설명 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="설명"
              name="description"
              value={form.description}
              onChange={handleChange}
            />
          </Grid>

          {/* 이미지 1 */}
          <Grid item xs={12}>
            <Button variant="outlined" component="label">
              이미지 1 업로드
              <input type="file" name="image1" hidden onChange={handleFileChange} />
            </Button>
          </Grid>

          {/* 이미지 2 */}
          <Grid item xs={12}>
            <Button variant="outlined" component="label">
              이미지 2 업로드
              <input type="file" name="image2" hidden onChange={handleFileChange} />
            </Button>
          </Grid>

          {/* 제출 */}
          <Grid item xs={12}>
            <Button fullWidth type="submit" variant="contained">
              등록하기
            </Button>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
}
