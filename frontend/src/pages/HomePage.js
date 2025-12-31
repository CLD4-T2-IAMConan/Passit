/**
 * 상용화 수준 HomePage - Professional Landing Page
 */
import React, { useState, useEffect } from "react";
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
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  Stack,
  Paper,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import GitHubIcon from "@mui/icons-material/GitHub";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useAuth } from "../contexts/AuthContext";
import ticketService from "../services/ticketService";

const HomePage = () => {
  const navigate = useNavigate();
  const { isAdmin, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  // 최신 티켓 가져오기
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const response = await ticketService.getTickets({
          ticketStatus: "AVAILABLE", // 백엔드 필드명에 맞춤
          page: 0,
          size: 8,
        });
        if (response.success && response.data) {
          // 페이지네이션 응답인 경우 content 사용, 배열인 경우 그대로 사용
          if (response.data.content && Array.isArray(response.data.content)) {
            setTickets(response.data.content);
          } else if (Array.isArray(response.data)) {
            setTickets(response.data);
          } else {
            setTickets([]);
          }
        } else {
          setTickets([]);
        }
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tickets?keyword=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategoryClick = (category) => {
    navigate(`/tickets?category=${encodeURIComponent(category)}`);
  };

  const handleTicketClick = (ticketId) => {
    navigate(`/tickets/${ticketId}/detail`);
  };

  const getTicketTitle = (ticket) => {
    return ticket.eventName || ticket.title || "티켓";
  };

  const getTicketPrice = (ticket) => {
    return ticket.sellingPrice || ticket.price || 0;
  };

  const getCategoryName = (categoryId) => {
    const categoryMap = {
      1: "콘서트",
      2: "뮤지컬",
      3: "스포츠",
      4: "전시",
      5: "클래식",
    };
    return categoryMap[categoryId] || "기타";
  };

  // 카테고리별 티켓 개수 계산
  const getCategoryCounts = () => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    tickets.forEach((ticket) => {
      if (ticket.categoryId && counts[ticket.categoryId] !== undefined) {
        counts[ticket.categoryId]++;
      }
    });
    return counts;
  };

  const categoryCounts = getCategoryCounts();

  // 카테고리 데이터
  const categories = [
    { name: "콘서트", icon: "🎤", count: categoryCounts[1] },
    { name: "뮤지컬", icon: "🎭", count: categoryCounts[2] },
    { name: "스포츠", icon: "⚽", count: categoryCounts[3] },
    { name: "전시", icon: "🎨", count: categoryCounts[4] },
    { name: "클래식", icon: "🎻", count: categoryCounts[5] },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          minHeight: { xs: "500px", md: "600px" },
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
            py: { xs: 6, md: 8 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Typography
              variant="h2"
              component="h1"
              sx={{
                color: "white",
                fontFamily: "'PartialSans', sans-serif",
                fontWeight: 400,
                textAlign: "center",
                fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.75rem" },
                textShadow: "0 4px 12px rgba(0,0,0,0.4)",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              찾으시는{" "}
              <Box
                component="span"
                sx={{
                  color: "#FFD600",
                  display: "inline-block",
                  fontFamily: "'PartialSans', sans-serif",
                  textShadow: "0 4px 12px rgba(255,214,0,0.3)",
                }}
              >
                티켓
              </Box>
              이 있으신가요?
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: "rgba(255, 255, 255, 0.9)",
                textAlign: "center",
                fontSize: { xs: "1rem", md: "1.25rem" },
                textShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }}
            >
              공연, 스포츠 티켓을 정가로 안전하게 거래하세요
            </Typography>

            {/* Search Bar */}
            <Box
              component="form"
              onSubmit={handleSearch}
              sx={{
                width: "100%",
                maxWidth: "700px",
                mt: 2,
              }}
            >
              <TextField
                fullWidth
                placeholder="공연명, 스포츠 경기를 검색해보세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "50px",
                    bgcolor: "white",
                    py: 0.5,
                    fontSize: "1rem",
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="submit"
                        size="large"
                        sx={{
                          color: "primary.main",
                          bgcolor: "transparent",
                          "&:hover": {
                            bgcolor: "rgba(25,118,210,0.08)",
                          },
                        }}
                      >
                        <SearchIcon sx={{ fontSize: 28 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* CTA Buttons */}
            {!isAuthenticated && (
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate("/auth")}
                  sx={{
                    borderRadius: "50px",
                    px: 4,
                    py: 1.5,
                    fontSize: "1.1rem",
                  }}
                >
                  시작하기
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/tickets")}
                  sx={{
                    borderRadius: "50px",
                    px: 4,
                    py: 1.5,
                    fontSize: "1.1rem",
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    borderColor: "white",
                    color: "white",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                      borderColor: "white",
                    },
                  }}
                >
                  티켓 둘러보기
                </Button>
              </Stack>
            )}
          </Box>
        </Container>
      </Box>

      {/* Categories Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            카테고리별 티켓
          </Typography>
          <Typography variant="body2" color="text.secondary">
            원하는 카테고리를 선택하고 티켓을 찾아보세요
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(5, 1fr)",
            },
            gap: 2,
            gridAutoRows: "1fr",
          }}
        >
          {categories.map((category) => (
            <Paper
              key={category.name}
              onClick={() => handleCategoryClick(category.name)}
              sx={{
                p: 2.5,
                textAlign: "center",
                cursor: "pointer",
                borderRadius: 3,
                bgcolor: "white",
                transition: "all 0.3s",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "rgba(25, 118, 210, 0.04)",
                },
              }}
            >
              <Typography variant="h2" sx={{ mb: 1 }}>
                {category.icon}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {category.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {category.count}개
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>

      {/* Popular Tickets Section */}
      <Box sx={{ bgcolor: "grey.50", py: 8 }}>
        <Container maxWidth="lg">
          <Box
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <TrendingUpIcon sx={{ mr: 1, color: "error.main", fontSize: 32 }} />
              <Box>
                <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  지금 HOT한 티켓 🔥
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  실시간 인기 티켓을 확인하세요
                </Typography>
              </Box>
            </Box>
          </Box>

          {loading ? (
            <Typography textAlign="center">로딩 중...</Typography>
          ) : tickets.length > 0 ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(1, 1fr)",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 3,
                gridAutoRows: "1fr",
              }}
            >
              {tickets.slice(0, 8).map((ticket, index) => (
                <Card
                  key={ticket.ticketId || ticket.id}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 1.5,
                    position: "relative",
                    border: "1px solid",
                    borderColor: "grey.200",
                    transition: "border-color 0.3s",
                    "&:hover": {
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => handleTicketClick(ticket.ticketId || ticket.id)}
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "stretch",
                      justifyContent: "flex-start",
                    }}
                  >
                    <CardMedia
                      component="div"
                      sx={{
                        height: 200,
                        bgcolor: "grey.300",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                      }}
                    >
                      <ConfirmationNumberIcon sx={{ fontSize: 60, color: "grey.400" }} />
                      {/* HOT 뱃지 - 상위 3개 티켓에만 표시 */}
                      {index < 3 && (
                        <Chip
                          label={index === 0 ? "🔥 HOT" : "🌟 인기"}
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 12,
                            left: 12,
                            bgcolor: index === 0 ? "error.main" : "warning.main",
                            color: "white",
                            fontWeight: 700,
                          }}
                        />
                      )}
                      {/* 판매중 상태 뱃지 */}
                      <Chip
                        label="판매중"
                        size="small"
                        color="success"
                        sx={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                        }}
                      />
                    </CardMedia>
                    <CardContent
                      sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        p: 2,
                      }}
                    >
                      <Typography variant="h6" noWrap sx={{ fontWeight: 600, mb: 1 }}>
                        {getTicketTitle(ticket)}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                        <Chip
                          label={getCategoryName(ticket.categoryId)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        {ticket.eventLocation && <Chip label={ticket.eventLocation} size="small" />}
                      </Stack>
                      <Box sx={{ mt: "auto" }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            mb: 1,
                          }}
                        >
                          <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                            {getTicketPrice(ticket).toLocaleString()}
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.secondary"
                              sx={{ ml: 0.5 }}
                            >
                              원
                            </Typography>
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          📅{" "}
                          {ticket.eventDate
                            ? new Date(ticket.eventDate).toLocaleDateString("ko-KR")
                            : "일정 미정"}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          ) : (
            <Paper sx={{ p: 8, textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary">
                등록된 티켓이 없습니다
              </Typography>
              <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate("/sell")}>
                첫 티켓 등록하기
              </Button>
            </Paper>
          )}

          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/tickets")}
              sx={{ borderRadius: "50px", px: 4 }}
            >
              모든 티켓 보기
            </Button>
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
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              gap: 3,
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary">
                © 2025 Passit. All rights reserved.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 2,
              }}
            >
              <Link href="#" underline="hover" color="text.secondary">
                이용약관
              </Link>
              <Link href="#" underline="hover" color="text.secondary">
                개인정보처리방침
              </Link>
              {isAdmin && (
                <Link
                  onClick={() => navigate("/admin")}
                  underline="hover"
                  color="text.secondary"
                  sx={{ cursor: "pointer" }}
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
