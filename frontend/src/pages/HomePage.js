import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Container,
  TextField,
  InputAdornment,
  Link,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import GitHubIcon from "@mui/icons-material/GitHub";
import { useAuth } from "../contexts/AuthContext";

const HomePage = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: 검색 기능 구현
    console.log("검색:", searchQuery);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Main Content - Hero Section */}
      <Box
        sx={{
          position: "relative",
          height: "calc(100vh - 64px)",
          mt: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "url(/images/concert.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            zIndex: 0,
          },
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 1,
            py: { xs: 6, sm: 8, md: 10 },
            px: { xs: 2, sm: 3 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: { xs: 2, sm: 2.5, md: 3 },
            }}
          >
            {/* Search Guide Text */}
            <Typography
              variant="h3"
              component="h2"
              sx={{
                color: "white",
                fontWeight: 700,
                textAlign: "center",
                mb: { xs: 0.5, sm: 1 },
                fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.75rem" },
                textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                fontFamily: "'Ria', sans-serif",
              }}
            >
              찾으시는{" "}
              <Box
                component="span"
                sx={{
                  color: "#FFD600",
                  position: "relative",
                  px: 0.5,
                  display: "inline-block",
                }}
              >
                티켓
              </Box>
              이 있으신가요?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255, 255, 255, 0.9)",
                textAlign: "center",
                mb: { xs: 2, sm: 2.5 },
                fontSize: { xs: "0.938rem", sm: "1.063rem", md: "1.125rem" },
                textShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }}
            >
              공연, 스포츠 티켓을 정가로 안전하게 거래하세요
            </Typography>

            {/* Search Input */}
            <Box
              component="form"
              onSubmit={handleSearch}
              sx={{
                width: "100%",
                maxWidth: { xs: "100%", sm: "600px", md: "700px" },
              }}
            >
              <TextField
                fullWidth
                placeholder="공연, 스포츠를 검색해보세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "16px",
                    fontSize: { xs: "0.938rem", sm: "1rem" },
                    py: { xs: 0.5, sm: 0.75 },
                    bgcolor: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(10px)",
                    "& fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.3)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                      borderWidth: "2px",
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Category Buttons - Fully Rounded Pill Style */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: { xs: 1.5, sm: 2, md: 2.5 },
                width: "100%",
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="outlined"
                sx={{
                  px: { xs: 2.5, sm: 3, md: 3.5 },
                  py: { xs: 0.75, sm: 1, md: 1.25 },
                  borderRadius: "9999px",
                  fontSize: { xs: "0.938rem", sm: "1rem", md: "1.063rem" },
                  fontWeight: 600,
                  bgcolor: "transparent",
                  borderColor: "rgba(255, 255, 255, 0.8)",
                  borderWidth: "2px",
                  color: "white",
                  backdropFilter: "blur(10px)",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    borderColor: "rgba(255, 255, 255, 1)",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                공연
              </Button>
              <Button
                variant="outlined"
                sx={{
                  px: { xs: 2.5, sm: 3, md: 3.5 },
                  py: { xs: 0.75, sm: 1, md: 1.25 },
                  borderRadius: "9999px",
                  fontSize: { xs: "0.938rem", sm: "1rem", md: "1.063rem" },
                  fontWeight: 600,
                  bgcolor: "transparent",
                  borderColor: "rgba(255, 255, 255, 0.8)",
                  borderWidth: "2px",
                  color: "white",
                  backdropFilter: "blur(10px)",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    borderColor: "rgba(255, 255, 255, 1)",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                스포츠
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: "white",
          borderTop: "1px solid",
          borderColor: "grey.200",
          mt: "auto",
          py: { xs: 3, sm: 4 },
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              gap: { xs: 2, sm: 3 },
            }}
          >
            {/* Left: Copyright */}
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: "0.813rem", sm: "0.875rem" } }}
              >
                © 2025 Passit. All rights reserved.
              </Typography>
            </Box>

            {/* Right: Links & GitHub */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
                gap: { xs: 1.5, sm: 3 },
              }}
            >
              <Link
                href="#"
                underline="hover"
                color="text.secondary"
                sx={{
                  fontSize: { xs: "0.813rem", sm: "0.875rem" },
                  "&:hover": { color: "primary.main" },
                }}
              >
                이용약관
              </Link>
              <Link
                href="#"
                underline="hover"
                color="text.secondary"
                sx={{
                  fontSize: { xs: "0.813rem", sm: "0.875rem" },
                  "&:hover": { color: "primary.main" },
                }}
              >
                개인정보처리방침
              </Link>
              {isAdmin && (
                <Link
                  onClick={() => navigate("/admin")}
                  underline="hover"
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: "0.813rem", sm: "0.875rem" },
                    cursor: "pointer",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  관리자
                </Link>
              )}
              <Divider
                orientation="vertical"
                flexItem
                sx={{ display: { xs: "none", sm: "block" } }}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<GitHubIcon />}
                href="https://github.com/CLD4-T2-IAMConan/Passit"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  fontSize: { xs: "0.813rem", sm: "0.875rem" },
                  px: { xs: 2, sm: 2.5 },
                  borderColor: "grey.300",
                  color: "text.secondary",
                  "&:hover": {
                    borderColor: "primary.main",
                    color: "primary.main",
                  },
                }}
              >
                GitHub
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
