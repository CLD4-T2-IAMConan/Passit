import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Box, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import AdminLayout from "../../layouts/AdminLayout";
import reportService from "../../services/reportService";

export default function AdminReportListPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await reportService.getAdminReports();
        const data = res.data?.data ?? res.data;
        setReports(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setErrorMsg("신고 목록 조회 실패");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : errorMsg ? (
          <Alert severity="error">{errorMsg}</Alert>
        ) : (
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
              신고 관리
            </Typography>

            {reports.length === 0 ? (
              <Typography sx={{ mt: 2 }}>신고 데이터가 없습니다.</Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>상태</TableCell>
                      <TableCell>대상</TableCell>
                      <TableCell>사유</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reports.map((r) => (
                      <TableRow
                        key={r.reportId ?? r.id}
                        sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                        onClick={() => navigate(`/admin/reports/${r.reportId ?? r.id}`)}
                      >
                        <TableCell>{r.reportId ?? r.id}</TableCell>
                        <TableCell>{r.status}</TableCell>
                        <TableCell>
                          {r.targetType} #{r.targetId}
                        </TableCell>
                        <TableCell>{r.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Container>
    </AdminLayout>
  );
}
