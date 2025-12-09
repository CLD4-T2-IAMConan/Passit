import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Paper, Typography, useTheme, useMediaQuery } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleLoginSuccess = (user) => {
    console.log("로그인 성공:", user);
    // role에 따라 리다이렉트
    if (user.role === "ADMIN") {
      navigate("/admin/users");
    } else {
      navigate("/");
    }
  };

  const handleRegisterSuccess = (user) => {
    console.log("회원가입 성공:", user);
    setIsLogin(true);
  };

  const switchToLogin = () => {
    setIsLogin(true);
  };

  const switchToRegister = () => {
    setIsLogin(false);
  };

  return (
    <Box
      sx={{
        height: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 2.5, md: 3 },
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1200,
          height: { xs: "100%", md: "85vh" },
          maxHeight: "700px",
        }}
      >
        <Paper
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            overflow: "hidden",
            height: "100%",
          }}
        >
          {/* 왼쪽 정보 섹션 */}
          <Box
            sx={{
              bgcolor: "#F8F9FC",
              p: { xs: 3, sm: 4, md: 5, lg: 6 },
              display: { xs: isLogin ? "none" : "flex", md: "flex" },
              flexDirection: "column",
              justifyContent: "center",
              order: 1,
              overflow: "hidden",
            }}
          >
            {/* 로고 및 타이틀 */}
            <Box sx={{ mb: { xs: 3, md: 4 } }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: { xs: 2, md: 3 },
                }}
              >
                <CheckCircleIcon
                  sx={{ fontSize: { xs: 28, md: 32 }, color: "primary.main" }}
                />
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "1.25rem", md: "1.5rem" },
                    color: "primary.main",
                  }}
                >
                  Passit
                </Typography>
              </Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mb: { xs: 1.5, md: 2 },
                  fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                  color: "#1a1a1a",
                }}
              >
                {isLogin
                  ? "다시 오신 것을 환영합니다"
                  : "정가 거래를 시작하세요"}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  lineHeight: 1.7,
                  fontSize: { xs: "0.938rem", md: "1rem" },
                  color: "text.secondary",
                }}
              >
                {isLogin
                  ? "정가 기반 안전한 티켓 양도 플랫폼 패싯입니다"
                  : "에스크로로 안전하게, 정가로 투명하게 티켓을 양도하세요"}
              </Typography>
            </Box>

            {/* 특징 목록 (회원가입 시에만 표시) */}
            {!isLogin && !isMobile && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2.5,
                  mt: 4,
                }}
              >
                {[
                  "정가 기반 안전한 양도",
                  "에스크로 결제 시스템",
                  "투명한 거래 내역",
                  "불법 암표 근절",
                ].map((feature, index) => (
                  <Box
                    key={index}
                    sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                  >
                    <CheckCircleIcon
                      sx={{ fontSize: 20, color: "primary.main" }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: "text.primary",
                      }}
                    >
                      {feature}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* 오른쪽 폼 섹션 */}
          <Box
            sx={{
              p: { xs: 3, sm: 4, md: 5, lg: 6 },
              bgcolor: "background.paper",
              order: 2,
              display: "flex",
              alignItems: "center",
              overflow: "hidden",
              height: "100%",
            }}
          >
            {isLogin ? (
              <LoginForm
                onLoginSuccess={handleLoginSuccess}
                onSwitchToRegister={switchToRegister}
              />
            ) : (
              <RegisterForm
                onRegisterSuccess={handleRegisterSuccess}
                onSwitchToLogin={switchToLogin}
              />
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AuthPage;
