import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Stack,
  Alert,
} from "@mui/material";
import ticketService from "../api/services/ticketService";

const MyTicketListPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");

  const fetchMyTickets = async () => {
    try {
      setError("");
      const response = await ticketService.getMyTickets();

      // ✅ service에서 response.data를 반환하므로 data 한 번만 접근
      setTickets(response.data || []);
    } catch (err) {
      console.error("My 티켓 조회 실패:", err);

      if (err.response) {
        setError(
          err.response.data?.error ||
            `요청 실패 (status: ${err.response.status})`
        );
      } else {
        setError("서버와 통신할 수 없습니다.");
      }
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  return (
    <Container sx={{ mt: 10 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        My 티켓
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>티켓 ID</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>공연명</TableCell>
              <TableCell>공연 날짜</TableCell>
              <TableCell>판매 가격</TableCell>
              <TableCell align="right">관리</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  등록한 티켓이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.ticketId} hover>
                  <TableCell>{ticket.ticketId}</TableCell>
                  <TableCell>{ticket.ticketStatus}</TableCell>
                  <TableCell>{ticket.eventName}</TableCell>
                  <TableCell>{ticket.eventDate}</TableCell>
                  <TableCell>
                    {ticket.sellingPrice?.toLocaleString()}원
                  </TableCell>

                  {/* UI만 */}
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/my/tickets/${ticket.ticketId}/edit`)}
                      >
                        수정
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled
                      >
                        삭제
                      </Button>
                    </Stack>
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

export default MyTicketListPage;
