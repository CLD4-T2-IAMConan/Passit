import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Box,
  CircularProgress,
  Container,
  Alert,
  Button,
  Stack,
  Typography,
  Paper,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";

/**
 * 인증이 필요한 라우트를 보호하는 컴포넌트
 * @param {Object} props
 * @param {React.ReactNode} props.children - 보호할 컴포넌트
 * @param {boolean} props.adminOnly - 관리자만 접근 가능 여부
 */
const PrivateRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  // 로딩 중
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return (
      <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", pt: "64px" }}>
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Stack spacing={3} alignItems="center">
              <LockIcon sx={{ fontSize: 64, color: "primary.main" }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                로그인이 필요합니다
              </Typography>
              <Alert severity="warning" sx={{ width: "100%" }}>
                이 페이지는 로그인 후 이용할 수 있습니다.
              </Alert>
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" onClick={() => navigate(-1)}>
                  이전 페이지
                </Button>
                <Button variant="contained" onClick={() => navigate("/auth")}>
                  로그인하기
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  // 관리자 권한이 필요한데 관리자가 아닌 경우
  if (adminOnly && !isAdmin) {
    return (
      <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", pt: "64px" }}>
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Stack spacing={3} alignItems="center">
              <LockIcon sx={{ fontSize: 64, color: "error.main" }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                접근 권한이 없습니다
              </Typography>
              <Alert severity="error" sx={{ width: "100%" }}>
                이 페이지는 관리자만 접근할 수 있습니다.
              </Alert>
              <Button variant="contained" onClick={() => navigate("/")}>
                홈으로 이동
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  return children;
};

export default PrivateRoute;
