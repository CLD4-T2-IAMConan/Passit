/**
 * 거래 목록 페이지
 * useTrade 훅 사용 예시
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  Pagination,
  CircularProgress,
  Alert,
} from "@mui/material";
import useTrade from "../../hooks/useTrade";
import { useAuth } from "../../contexts/AuthContext";

const DealListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0); // 0: 구매내역, 1: 판매내역

  const { deals, pagination, loading, error, fetchPurchaseHistory, fetchSalesHistory, changePage } =
    useTrade();

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === 0) {
      fetchPurchaseHistory();
    } else {
      fetchSalesHistory();
    }
  }, [activeTab, fetchPurchaseHistory, fetchSalesHistory]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handlePageChange = (event, page) => {
    changePage(page - 1); // MUI Pagination은 1부터 시작
  };

  const handleDealClick = (dealId) => {
    navigate(`/deals/${dealId}/detail`);
  };

  /**
   * 거래 상태에 따른 색상 반환
   */
  const getStatusColor = (status) => {
    const statusColors = {
      REQUESTED: "info",
      ACCEPTED: "success",
      REJECTED: "error",
      PAID: "primary",
      CANCELLED: "default",
      CONFIRMED: "success",
      COMPLETED: "success",
    };
    return statusColors[status] || "default";
  };

  /**
   * 거래 상태 한글 변환
   */
  const getStatusLabel = (status) => {
    const statusLabels = {
      REQUESTED: "요청됨",
      ACCEPTED: "수락됨",
      REJECTED: "거절됨",
      PAID: "결제완료",
      CANCELLED: "취소됨",
      CONFIRMED: "확정됨",
      COMPLETED: "완료",
    };
    return statusLabels[status] || status;
  };

  /**
   * 거래 카드 렌더링
   */
  const renderDealCard = (deal) => {
    const isBuyer = deal.buyerId === user?.userId;

    return (
      <Grid item xs={12} key={deal.id}>
        <Card
          sx={{
            borderRadius: 3,
            transition: "all 0.3s",
            "&:hover": {
              borderColor: "primary.main",
              bgcolor: "grey.50",
            },
          }}
        >
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box flex={1}>
                <Typography variant="h6" gutterBottom>
                  {deal.ticketTitle || "티켓 정보 없음"}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {isBuyer ? `판매자: ${deal.sellerName}` : `구매자: ${deal.buyerName}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  거래 일시: {new Date(deal.createdAt).toLocaleString("ko-KR")}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Chip
                  label={getStatusLabel(deal.status)}
                  color={getStatusColor(deal.status)}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Typography variant="h6" color="primary">
                  {deal.price?.toLocaleString()}원
                </Typography>
              </Box>
            </Box>

            {deal.buyerMessage && (
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  메시지: {deal.buyerMessage}
                </Typography>
              </Box>
            )}
          </CardContent>
          <CardActions>
            <Button size="small" onClick={() => handleDealClick(deal.id)}>
              상세보기
            </Button>
            {deal.status === "ACCEPTED" && isBuyer && (
              <Button size="small" color="primary" variant="contained">
                결제하기
              </Button>
            )}
            {deal.status === "PAID" && isBuyer && (
              <Button size="small" color="success" variant="contained">
                거래확정
              </Button>
            )}
          </CardActions>
        </Card>
      </Grid>
    );
  };

  if (loading && deals.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        거래 내역
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="구매 내역" />
          <Tab label="판매 내역" />
        </Tabs>
      </Paper>

      {deals.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            {activeTab === 0 ? "구매 내역이 없습니다." : "판매 내역이 없습니다."}
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {deals.map((deal) => renderDealCard(deal))}
          </Grid>

          {pagination.totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={pagination.totalPages}
                page={pagination.page + 1}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default DealListPage;
