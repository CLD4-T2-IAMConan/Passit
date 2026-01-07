import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Box, Typography, Button, Stack, CircularProgress, Alert, Paper, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import AdminLayout from "../../layouts/AdminLayout";
import reportService from "../../services/reportService";

const STATUS_OPTIONS = ["RECEIVED", "IN_PROGRESS", "RESOLVED", "REJECTED"];

export default function AdminReportDetailPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState("RECEIVED");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const idNum = useMemo(() => {
    const n = Number(reportId);
    return Number.isNaN(n) ? reportId : n;
  }, [reportId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await reportService.getAdminReportDetail(idNum);
      const data = res.data?.data ?? res.data;
      setDetail(data || null);

      const currentStatus = data?.status;
      if (currentStatus && STATUS_OPTIONS.includes(currentStatus)) {
        setStatus(currentStatus);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("신고 상세 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idNum]);

  const handleUpdateStatus = async () => {
    try {
      setSaving(true);
      setErrorMsg("");
      await reportService.updateReportStatus(idNum, status);
      await fetchDetail();
      alert("상태 변경 완료");
    } catch (e) {
      console.error(e);
      setErrorMsg("상태 변경 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box>
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              뒤로
            </Button>
            <Button variant="outlined" onClick={() => navigate("/admin/reports")}>
              목록
            </Button>
          </Stack>

          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            신고 상세 (관리자)
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : errorMsg ? (
            <Alert severity="error">{errorMsg}</Alert>
          ) : !detail ? (
            <Alert severity="info">데이터가 없습니다.</Alert>
          ) : (
            <>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Stack spacing={2}>
                  <Typography><strong>ID</strong>: {detail.reportId ?? detail.id}</Typography>
                  <Typography><strong>상태</strong>: {detail.status}</Typography>
                  <Typography><strong>신고자</strong>: {detail.reporterId ?? detail.userId}</Typography>
                  <Typography><strong>대상 타입</strong>: {detail.targetType}</Typography>
                  <Typography><strong>대상 ID</strong>: {detail.targetId}</Typography>
                  <Typography><strong>사유</strong>: {detail.reason}</Typography>
                  {detail.createdAt && (
                    <Typography>
                      <strong>생성일</strong>: {new Date(detail.createdAt).toLocaleDateString("ko-KR")}
                    </Typography>
                  )}
                </Stack>
              </Paper>

              <Paper sx={{ p: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>상태 변경</InputLabel>
                    <Select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={saving}
                      label="상태 변경"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    onClick={handleUpdateStatus}
                    disabled={saving}
                  >
                    {saving ? <CircularProgress size={20} /> : "변경"}
                  </Button>
                </Stack>
              </Paper>
            </>
          )}
        </Box>
      </Container>
    </AdminLayout>
  );
}
