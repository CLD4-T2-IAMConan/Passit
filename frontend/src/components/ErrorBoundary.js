import React, { Component } from "react";
import { Box, Button, Container, Typography, Paper } from "@mui/material";
import { Error as ErrorIcon, Refresh } from "@mui/icons-material";

/**
 * 에러 바운더리 컴포넌트
 * - React 에러를 캐치하여 앱이 크래시되지 않도록 방지
 * - 사용자 친화적인 에러 화면 제공
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 에러 로깅 (예: 외부 에러 트래킹 서비스로 전송)
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // 프로덕션 환경에서는 Sentry 등의 서비스로 에러 리포트
    // if (process.env.NODE_ENV === 'production') {
    //   logErrorToService(error, errorInfo);
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback UI가 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 화면
      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              py: 4,
            }}
          >
            <Paper
              sx={{
                p: { xs: 3, sm: 4 },
                textAlign: "center",
                border: "1px solid",
                borderColor: "error.light",
              }}
              role="alert"
              aria-live="assertive"
            >
              <ErrorIcon
                sx={{
                  fontSize: { xs: 64, sm: 80 },
                  color: "error.main",
                  mb: 2,
                }}
                aria-hidden="true"
              />

              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1.5rem", sm: "2rem" },
                }}
              >
                앗! 문제가 발생했어요
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                paragraph
                sx={{ mb: 3 }}
              >
                예상치 못한 오류가 발생했습니다.
                <br />
                페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
              </Typography>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <Paper
                  sx={{
                    p: 2,
                    mb: 3,
                    bgcolor: "grey.50",
                    textAlign: "left",
                    maxHeight: 200,
                    overflow: "auto",
                  }}
                >
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </Typography>
                </Paper>
              )}

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleReload}
                  size="large"
                >
                  페이지 새로고침
                </Button>
                <Button
                  variant="outlined"
                  onClick={this.handleReset}
                  size="large"
                >
                  다시 시도
                </Button>
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 3 }}
              >
                문제가 계속되면 고객지원팀에 문의해주세요.
              </Typography>
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
