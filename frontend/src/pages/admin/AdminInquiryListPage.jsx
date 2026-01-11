import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminInquiries } from "../../api/services/inquiryService";

export default function AdminInquiryListPage() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getAdminInquiries();
        const data = res?.data?.data ?? res?.data ?? res;
        setInquiries(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setError("문의 목록 조회 실패");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const getStatusColor = (status) => {
    if (status === "ANSWERED" || status === "완료") return "success";
    if (status === "PENDING" || status === "대기") return "warning";
    return "default";
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            문의사항 관리
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : inquiries.length === 0 ? (
            <Typography>문의가 없습니다.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>제목</TableCell>
                    <TableCell>유형</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell>작성일</TableCell>
                    <TableCell>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inquiries.map((inquiry) => {
                    const id = inquiry.inquiryId ?? inquiry.id;
                    const status = inquiry.status ?? inquiry.answerStatus;
                    return (
                      <TableRow
                        key={id}
                        sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                        onClick={() => navigate(`/admin/inquiries/${id}`)}
                      >
                        <TableCell>{id}</TableCell>
                        <TableCell>{inquiry.title}</TableCell>
                        <TableCell>{inquiry.type ?? "-"}</TableCell>
                        <TableCell>
                          <Chip
                            label={status === "ANSWERED" ? "답변완료" : "대기중"}
                            color={getStatusColor(status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {inquiry.createdAt
                            ? new Date(inquiry.createdAt).toLocaleDateString("ko-KR")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/inquiries/${id}`);
                            }}
                          >
                            상세보기
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Container>
    </AdminLayout>
  );
}
