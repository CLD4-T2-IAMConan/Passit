import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, CircularProgress, Typography, Alert } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

const KakaoCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleKakaoCallback } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get("token");
      const refreshToken = searchParams.get("refreshToken");
      const userId = searchParams.get("userId");
      const email = searchParams.get("email");
      const name = searchParams.get("name");
      const provider = searchParams.get("provider");
      const error = searchParams.get("error");
      const errorMessage = searchParams.get("message");

      if (error) {
        // 에러 발생 시 로그인 페이지로 리다이렉트
        console.error("Kakao login error:", errorMessage);
        navigate(
          "/auth?error=kakao_login_failed&message=" +
            encodeURIComponent(errorMessage || error)
        );
        return;
      }

      if (token && refreshToken && userId && email && name) {
        try {
          // 카카오 로그인 콜백 처리
          const result = handleKakaoCallback(
            token,
            refreshToken,
            userId,
            email,
            name,
            provider
          );

          if (result.success) {
            // 상태 업데이트가 완료되도록 약간의 지연 후 리다이렉트
            // React의 상태 업데이트는 비동기이므로 다음 틱을 기다림
            await new Promise((resolve) => setTimeout(resolve, 100));

            // 로그인 성공 시 홈으로 리다이렉트
            navigate("/", { replace: true });
          } else {
            navigate("/auth?error=kakao_login_failed");
          }
        } catch (err) {
          console.error("Error processing Kakao callback:", err);
          navigate(
            "/auth?error=kakao_login_failed&message=" +
              encodeURIComponent(err.message)
          );
        }
      } else {
        // 필수 파라미터가 없는 경우
        console.error("Missing required parameters:", {
          token: !!token,
          refreshToken: !!refreshToken,
          userId: !!userId,
          email: !!email,
          name: !!name,
        });
        navigate(
          "/auth?error=kakao_login_failed&message=필수 정보가 누락되었습니다"
        );
      }
    };

    processCallback();
  }, [searchParams, navigate, handleKakaoCallback]);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <CircularProgress size={48} />
      <Typography variant="body1" color="text.secondary">
        카카오 로그인 처리 중...
      </Typography>
    </Box>
  );
};

export default KakaoCallbackPage;
