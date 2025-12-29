import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Divider,
} from "@mui/material";
import { Visibility, VisibilityOff, Person, Lock } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { API_SERVICES } from "../config/apiConfig";
import { ENDPOINTS } from "../api/endpoints";

const LoginForm = ({ onSuccess, onError, onLoginSuccess, onSwitchToRegister }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      if (!formData.email && !formData.password) {
        setError("email and password are required");
      } else if (!formData.email) {
        setError("email is required");
      } else {
        setError("password is required");
      }
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email)) {
      setError("Invalid email format");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password, rememberMe);
      // 성공 시
      onSuccess?.(result.user);
      onLoginSuccess?.(result.user);
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          "Invalid email or password";

        setError(message);
        onError?.(message);
      } finally {
        setLoading(false);
    }
  };

  const handleKakaoLogin = () => {
    // 카카오 로그인 API로 리다이렉트
    // API_SERVICES.ACCOUNT는 이미 /api를 포함하고 있으므로 직접 사용
    window.location.href = `${API_SERVICES.ACCOUNT}${ENDPOINTS.AUTH.KAKAO}`;
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box sx={{ mb: { xs: 2, md: 2.5 }, flexShrink: 0 }}>
        <Typography
          variant="h4"
          component="h2"
          sx={{
            fontWeight: 700,
            mb: 1,
            fontSize: { xs: "1.375rem", sm: "1.5rem", md: "1.75rem" },
          }}
        >
          로그인
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: { xs: "0.875rem", md: "0.938rem" } }}
        >
          간편하게 로그인하고 서비스를 이용하세요
        </Typography>
      </Box>

      {/* Form */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: { xs: 2.5, md: 3 },
          flex: 1,
          justifyContent: "space-between",
        }}
      >
        <Box>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* 카카오 로그인 */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleKakaoLogin}
            sx={{
              bgcolor: "#FEE500",
              color: "#000000",
              fontWeight: 600,
              py: 2,
              fontSize: "1rem",
              "&:hover": {
                bgcolor: "#FDD835",
              },
              textTransform: "none",
            }}
            startIcon={
              <Box
                component="img"
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHZpZXdCb3g9IjAgMCAxOCAxOCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTkgMEMxMy45NzA2IDAgMTggMy4zODI3IDE4IDcuNTY3NjlDMTggMTEuNzUyNyAxMy45NzA2IDE1LjEzNTQgOSAxNS4xMzU0QzguMTI3MTggMTUuMTM1NCA3LjI5NDI1IDE1LjAyMDQgNi41MDk1NCAxNC44MDc4TDIuOTM5ODEgMTcuNDYwOUMyLjY2NDE4IDE3LjY5NDkgMi4yNzg0MSAxNy42NDgxIDIuMDU0NjkgMTcuMzU0OUMxLjk0MTE5IDE3LjIwODkgMS44ODM0OSAxNy4wMjI3IDEuODkxNTkgMTYuODMyM0wyLjExNDQyIDEyLjkxNTlDMC43ODU3MzggMTEuNjM0IDAgOS42OTc3NiAwIDcuNTY3NjlDMCAzLjM4MjcgNC4wMjk0NCAwIDkgMFoiIGZpbGw9IiMwMDAwMDAiLz4KPC9zdmc+"
                alt="Kakao"
                sx={{ width: 20, height: 20 }}
              />
            }
          >
            카카오로 3초만에 시작하기
          </Button>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem" }}>
              또는
            </Typography>
          </Divider>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              fullWidth
              type="email"
              name="email"
              label="이메일"
              value={formData.email}
              onChange={handleChange}
              required
              variant="outlined"
              placeholder="이메일@example.com"
            />

            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              name="password"
              label="비밀번호"
              value={formData.password}
              onChange={handleChange}
              required
              variant="outlined"
              placeholder="비밀번호를 입력하세요"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 1.5,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  size="small"
                  color="primary"
                />
              }
              label={
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    fontSize: "0.875rem",
                  }}
                >
                  로그인 상태 유지
                </Typography>
              }
            />
            <Link
              component="button"
              type="button"
              onClick={() => (window.location.href = "/reset-password")}
              underline="hover"
              color="primary"
              sx={{
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              비밀번호 찾기
            </Link>
          </Box>
        </Box>

        <Box sx={{ mt: "auto" }}>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              py: { xs: 1.25, sm: 1.5 },
              fontWeight: 600,
              fontSize: { xs: "0.938rem", sm: "1rem" },
            }}
          >
            {loading ?  "logging in" : "로그인"}
          </Button>

          <Box sx={{ textAlign: "center", pt: 2 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: "0.813rem", sm: "0.875rem" } }}
            >
              계정이 없으신가요?{" "}
              <Link
                component="button"
                type="button"
                onClick={onSwitchToRegister}
                underline="hover"
                color="primary"
                sx={{ fontWeight: 500 }}
              >
                회원가입
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginForm;
