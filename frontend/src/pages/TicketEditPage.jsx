import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, TextField, Button, Stack, Alert } from "@mui/material";
import ticketService from "../api/services/ticketService";

const TicketEditPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    eventName: "",
    eventDate: "",
    sellingPrice: "",
    description: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");

  /** 1️⃣ 기존 티켓 정보 조회 */
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await ticketService.getTicketDetail(ticketId);
        const ticket = res.data;

        setForm({
          eventName: ticket.eventName,
          eventDate: ticket.eventDate,
          sellingPrice: ticket.sellingPrice,
          description: ticket.description || "",
        });

        // 기존 이미지 미리보기
        if (ticket.image1) {
          setImagePreview(`http://localhost:8082${ticket.image1}`);
        }
      } catch (err) {
        setError("티켓 정보를 불러올 수 없습니다.");
      }
    };

    fetchTicket();
  }, [ticketId]);

  /** 2️⃣ 텍스트 변경 */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /** 3️⃣ 이미지 선택 */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  /** 4️⃣ 수정 요청 */
  const handleSubmit = async () => {
    try {
      const formData = new FormData();

      // 텍스트 필드
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // 이미지 선택했을 때만 전송
      if (imageFile) {
        formData.append("image1", imageFile);
      }

      await ticketService.updateTicket(ticketId, formData);
      navigate("/mypage/my-tickets");
    } catch (err) {
      setError("티켓 수정 중 오류가 발생했습니다.");
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        티켓 수정
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Stack spacing={2}>
        <TextField label="공연명" name="eventName" value={form.eventName} onChange={handleChange} />

        <TextField
          label="공연 날짜"
          name="eventDate"
          type="datetime-local"
          value={form.eventDate}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="판매 가격"
          name="sellingPrice"
          value={form.sellingPrice}
          onChange={handleChange}
        />

        <TextField
          label="설명"
          name="description"
          multiline
          rows={3}
          value={form.description}
          onChange={handleChange}
        />

        {/* 이미지 */}
        {imagePreview && (
          <img src={imagePreview} alt="미리보기" style={{ width: 200, borderRadius: 8 }} />
        )}

        <Button variant="outlined" component="label">
          이미지 변경
          <input type="file" hidden onChange={handleImageChange} />
        </Button>

        <Button variant="contained" onClick={handleSubmit}>
          수정 완료
        </Button>
      </Stack>
    </Box>
  );
};

export default TicketEditPage;
