/**
 * 상용화 수준 티켓 목록 페이지 - Modern Card Layout
 */
import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Pagination,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  Stack,
  Paper,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useTickets } from "../hooks/useTickets";

const TicketListPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get("keyword") || "");
  const [filterType, setFilterType] = useState("keyword");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [sortBy, setSortBy] = useState("eventDate"); // 정렬 기준
  const [sortDirection, setSortDirection] = useState("ASC"); // 정렬 방향

  const {
    tickets,
    pagination,
    loading,
    error,
    updateKeyword,
    updateFilters,
    changePage,
    fetchTickets,
    changeSorting,
    filters,
  } = useTickets({
    status: "AVAILABLE",
    keyword: searchParams.get("keyword") || "",
    category: searchParams.get("category") || "",
    sortBy: "eventDate",
    sortDirection: "ASC",
  });

  // 정렬 상태를 필터와 동기화
  useEffect(() => {
    if (filters.sortBy && filters.sortBy !== sortBy) {
      setSortBy(filters.sortBy);
      setSortDirection(filters.sortDirection || "ASC");
    }
  }, [filters.sortBy, filters.sortDirection]);

  useEffect(() => {
    const keyword = searchParams.get("keyword");
    const category = searchParams.get("category");
    if (keyword) {
      setSearchKeyword(keyword);
      updateKeyword(keyword);
    }
    if (category) {
      updateFilters({ category });
    }
  }, [searchParams, updateKeyword, updateFilters]);

  const handleSearch = () => {
    switch (filterType) {
      case "keyword":
        updateKeyword(searchKeyword);
        break;
      case "category":
        updateFilters({ category: searchKeyword });
        break;
      case "region":
        updateFilters({ region: searchKeyword });
        break;
      case "status":
        updateFilters({ status: searchKeyword });
        break;
      default:
        break;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handlePageChange = (event, page) => {
    changePage(page - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTicketClick = (ticket) => {
    const ticketId = ticket.ticketId || ticket.id;
    navigate(`/tickets/${ticketId}/detail`);
  };

  const handleQuickFilter = (category) => {
    updateFilters({ category });
    setSearchKeyword("");
  };

  const getStatusColor = (status) => {
    const colors = {
      AVAILABLE: "success",
      RESERVED: "warning",
      SOLD: "default",
      EXPIRED: "error",
    };
    return colors[status] || "default";
  };

  const getStatusLabel = (status) => {
    const labels = {
      AVAILABLE: "판매중",
      RESERVED: "예약중",
      SOLD: "판매완료",
      EXPIRED: "만료",
    };
    return labels[status] || status;
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

  const getTicketTitle = (ticket) => {
    return ticket.eventName || ticket.title || "티켓";
  };

  const getTicketPrice = (ticket) => {
    return ticket.sellingPrice || ticket.price || 0;
  };

  return (
    <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", pt: "64px" }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            티켓 마켓플레이스
          </Typography>
          <Typography variant="body1" color="text.secondary">
            원하는 공연, 스포츠 티켓을 찾아보세요
          </Typography>
        </Box>

        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack spacing={3}>
            {/* Search Bar */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>검색 유형</InputLabel>
                <Select
                  value={filterType}
                  label="검색 유형"
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setSearchKeyword("");
                  }}
                  native
                >
                  <option value="keyword">키워드</option>
                  <option value="category">카테고리</option>
                  <option value="region">지역</option>
                  <option value="status">상태</option>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                placeholder={
                  filterType === "keyword"
                    ? "티켓 제목 검색..."
                    : filterType === "category"
                      ? "예: 콘서트, 뮤지컬, 스포츠"
                      : filterType === "region"
                        ? "예: 서울, 부산, 대구"
                        : "AVAILABLE, RESERVED, SOLD"
                }
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={loading}
                sx={{ minWidth: 100 }}
              >
                검색
              </Button>
            </Box>

            {/* Quick Category Filters */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
                인기 카테고리
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {["콘서트", "뮤지컬", "스포츠", "전시", "클래식"].map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    onClick={() => handleQuickFilter(category)}
                    clickable
                    sx={{
                      "&:hover": {
                        bgcolor: "primary.light",
                        color: "white",
                      },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {/* View Mode Toggle, Sort, and Results Count */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            총 <strong>{pagination.totalElements || 0}</strong>개의 티켓
          </Typography>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            {/* 정렬 옵션 */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>정렬</InputLabel>
              <Select
                value={sortBy === "sellingPrice" ? (sortDirection === "DESC" ? "priceDesc" : "price") : sortBy}
                label="정렬"
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  let actualSortBy = selectedValue;
                  let newSortDirection = "ASC";
                  
                  // 정렬 기준에 따라 기본 방향 설정
                  if (selectedValue === "createdAt") {
                    newSortDirection = "DESC"; // 최신순은 내림차순
                  } else if (selectedValue === "priceDesc") {
                    actualSortBy = "sellingPrice";
                    newSortDirection = "DESC"; // 가격 높은순은 내림차순
                  } else if (selectedValue === "price") {
                    actualSortBy = "sellingPrice";
                    newSortDirection = "ASC"; // 가격 낮은순은 오름차순
                  } else {
                    newSortDirection = "ASC"; // 이벤트 날짜순은 오름차순
                  }
                  
                  setSortBy(actualSortBy);
                  setSortDirection(newSortDirection);
                  changeSorting(actualSortBy, newSortDirection);
                }}
                native
              >
                <option value="eventDate">이벤트 날짜순</option>
                <option value="createdAt">최신순</option>
                <option value="price">가격 낮은순</option>
                <option value="priceDesc">가격 높은순</option>
              </Select>
            </FormControl>

            {/* 보기 모드 */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="grid">
                <GridViewIcon />
              </ToggleButton>
              <ToggleButton value="list">
                <ViewListIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && tickets.length === 0 ? (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress />
          </Box>
        ) : tickets.length === 0 ? (
          /* Empty State */
          <Paper sx={{ p: 8, textAlign: "center" }}>
            <ConfirmationNumberIcon sx={{ fontSize: 80, color: "grey.300", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              검색 결과가 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              다른 검색어로 시도해보세요
            </Typography>
            <Button variant="contained" onClick={() => navigate("/sell")}>
              티켓 판매하기
            </Button>
          </Paper>
        ) : (
          /* Tickets Grid/List */
          <>
            {viewMode === "grid" ? (
              <Box
                sx={{
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(4, 1fr)",
                  },
                  gap: 3,
                }}
              >
                {tickets.map((ticket) => (
                  <Box
                    key={ticket.ticketId || ticket.id}
                    sx={{
                      display: "flex",
                      minWidth: 0,
                      height: "100%",
                    }}
                  >
                    <Card
                      sx={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: 3,
                        transition: "all 0.3s",
                        "&:hover": {
                          borderColor: "primary.main",
                          bgcolor: "grey.50",
                        },
                      }}
                    >
                      <CardActionArea onClick={() => handleTicketClick(ticket)}>
                        <CardMedia
                          component="div"
                          sx={{
                            height: 200,
                            bgcolor: "grey.300",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            flexShrink: 0, // 이미지 영역 크기 고정
                          }}
                        >
                          <ConfirmationNumberIcon sx={{ fontSize: 60, color: "grey.400" }} />
                          <Chip
                            label={getStatusLabel(ticket.ticketStatus || ticket.status)}
                            color={getStatusColor(ticket.ticketStatus || ticket.status)}
                            size="small"
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
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 600, 
                              mb: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              minHeight: "3em", // 최소 높이 설정으로 일정한 간격 유지
                            }}
                          >
                            {getTicketTitle(ticket)}
                          </Typography>

                          <Stack direction="row" spacing={0.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                            {ticket.categoryId && (
                              <Chip label={getCategoryName(ticket.categoryId)} size="small" />
                            )}
                            {ticket.eventLocation && (
                              <Chip label={ticket.eventLocation} size="small" variant="outlined" />
                            )}
                          </Stack>

                          <Box sx={{ mt: "auto" }}>
                            <Typography variant="h5" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                              {getTicketPrice(ticket).toLocaleString()}원
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                              {ticket.eventDate
                                ? new Date(ticket.eventDate).toLocaleDateString("ko-KR")
                                : "일정 미정"}
                            </Typography>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Box>
                ))}
              </Box>
            ) : (
              /* List View */
              <Stack spacing={2}>
                {tickets.map((ticket) => (
                  <Card
                    key={ticket.ticketId || ticket.id}
                    sx={{
                      borderRadius: 3,
                      transition: "all 0.3s",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: "grey.50",
                      },
                    }}
                  >
                    <CardActionArea onClick={() => handleTicketClick(ticket)}>
                      <Box sx={{ display: "flex", p: 2 }}>
                        <Box
                          sx={{
                            width: 120,
                            height: 120,
                            bgcolor: "grey.300",
                            borderRadius: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            mr: 2,
                          }}
                        >
                          <ConfirmationNumberIcon sx={{ fontSize: 40, color: "grey.400" }} />
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {getTicketTitle(ticket)}
                            </Typography>
                            <Chip
                              label={getStatusLabel(ticket.ticketStatus || ticket.status)}
                              color={getStatusColor(ticket.ticketStatus || ticket.status)}
                              size="small"
                            />
                          </Box>

                          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                            {ticket.categoryId && (
                              <Chip label={getCategoryName(ticket.categoryId)} size="small" />
                            )}
                            {ticket.eventLocation && (
                              <Chip label={ticket.eventLocation} size="small" variant="outlined" />
                            )}
                          </Stack>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {ticket.eventDate
                              ? new Date(ticket.eventDate).toLocaleDateString("ko-KR")
                              : "일정 미정"}
                          </Typography>

                          <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                            {getTicketPrice(ticket).toLocaleString()}원
                          </Typography>
                        </Box>
                      </Box>
                    </CardActionArea>
                  </Card>
                ))}
              </Stack>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.page + 1}
                  onChange={handlePageChange}
                  color="primary"
                  disabled={loading}
                  size="large"
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default TicketListPage;
