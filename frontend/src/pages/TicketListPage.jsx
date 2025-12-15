import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
} from "@mui/material";
import ticketService from "../api/services/ticketService";
import { useNavigate } from "react-router-dom";

const TicketListPage = () => {
  const navigate = useNavigate();

  // 필터 기준 + 입력값
  const [filterType, setFilterType] = useState("eventName");
  const [keyword, setKeyword] = useState("");

  // 결과 / 에러
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");

  const fetchTickets = async () => {
    try {
      setError("");

      // ✅ TicketSearchCondition에 정확히 맞는 객체 구성
      const condition = {
        eventName: null,
        ticketStatus: null,
        ownerId: null,
        startDate: null,
        endDate: null,
        categoryId: null,
      };

      switch (filterType) {
        case "eventName":
          condition.eventName = keyword;
          break;

        case "status":
          condition.ticketStatus = keyword; // AVAILABLE, SOLD 등
          break;

        case "category":
          condition.categoryId = Number(keyword);
          break;

        case "date":
          // 하루 단위 검색
          condition.startDate = `${keyword}T00:00:00`;
          condition.endDate = `${keyword}T23:59:59`;
          break;

        default:
          break;
      }

      const response = await ticketService.getTickets(condition);
      setTickets(response.data.data);
    } catch (err) {
      console.error("검색 실패:", err);

      if (err.response) {
        setError(err.response.data?.error || "검색 중 오류가 발생했습니다.");
      } else {
        setError("서버와 통신할 수 없습니다.");
      }
    }
  };

  useEffect(() => {
    fetchTickets(); // 최초 전체 조회
  }, []);

  return (
    <Container sx={{ mt: 10 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        티켓 목록
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 🔍 필터 선택 */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          select
          label="필터 기준"
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setKeyword("");
          }}
          size="small"
          sx={{ width: 180 }}
        >
          <MenuItem value="eventName">공연명</MenuItem>
          <MenuItem value="status">상태</MenuItem>
          <MenuItem value="date">이벤트 날짜</MenuItem>
          <MenuItem value="category">카테고리</MenuItem>
        </TextField>

        <TextField
          label="검색값"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          size="small"
          placeholder={
            filterType === "date"
              ? "YYYY-MM-DD"
              : filterType === "status"
              ? "AVAILABLE / SOLD"
              : filterType === "category"
              ? "카테고리 ID"
              : "검색어 입력"
          }
        />

        <Button variant="contained" onClick={fetchTickets}>
          검색
        </Button>
      </Box>

      {/* 📋 목록 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>티켓 ID</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>공연명</TableCell>
              <TableCell>공연 날짜</TableCell>
              <TableCell>판매 가격</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  검색 결과가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow
                  key={ticket.ticketId}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => navigate(`/tickets/${ticket.ticketId}`)}
                >
                  <TableCell>{ticket.ticketId}</TableCell>
                  <TableCell>{ticket.ticketStatus}</TableCell>
                  <TableCell>{ticket.eventName}</TableCell>
                  <TableCell>{ticket.eventDate}</TableCell>
                  <TableCell>
                    {ticket.sellingPrice?.toLocaleString()}원
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default TicketListPage;
