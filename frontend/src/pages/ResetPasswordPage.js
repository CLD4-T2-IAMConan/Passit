import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ResetPasswordForm from "../components/ResetPasswordForm";

const ResetPasswordPage = () => {
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
              display: { xs: "none", md: "flex" },
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
                <CheckCircleIcon sx={{ fontSize: { xs: 28, md: 32 }, color: "primary.main" }} />
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
                비밀번호를 잊으셨나요?
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  lineHeight: 1.7,
                  fontSize: { xs: "0.938rem", md: "1rem" },
                  color: "text.secondary",
                }}
              >
                가입 시 사용한 이메일로 인증하고 새로운 비밀번호를 설정하세요
              </Typography>
            </Box>

            {/* 안내 사항 */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2.5,
                mt: 4,
              }}
            >
              {[
                "가입 시 사용한 이메일을 입력하세요",
                "이메일로 받은 인증 코드를 입력하세요",
                "새로운 비밀번호를 설정하세요",
              ].map((step, index) => (
                <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: "text.primary",
                    }}
                  >
                    {step}
                  </Typography>
                </Box>
              ))}
            </Box>
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
            <ResetPasswordForm />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default ResetPasswordPage;
