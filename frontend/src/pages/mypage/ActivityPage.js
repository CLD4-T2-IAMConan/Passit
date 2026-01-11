import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Chip,
  Pagination,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Stack,
  Avatar,
  Divider,
  Rating,
} from "@mui/material";
import {
  ShoppingCart as PurchaseIcon,
  Sell as SaleIcon,
  Favorite as LikeIcon,
  RateReview as ReviewIcon,
} from "@mui/icons-material";
import { activityService } from "../../api/services/activityService";
import { accountAPI, ticketAPI } from "../../lib/api/client";
import { ENDPOINTS } from "../../api/endpoints";

const ActivityPage = () => {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedType, setSelectedType] = useState(null);
  const [ticketInfoMap, setTicketInfoMap] = useState({});

  // 활동 타입별 탭
  const activityTypes = [
    { value: null, label: "전체", icon: null, count: stats?.totalCount || 0 },
    {
      value: "PURCHASE",
      label: "구매",
      icon: <PurchaseIcon />,
      count: stats?.purchaseCount || 0,
    },
    {
      value: "SALE",
      label: "판매",
      icon: <SaleIcon />,
      count: stats?.saleCount || 0,
    },
    {
      value: "LIKE",
      label: "좋아요",
      icon: <LikeIcon />,
      count: stats?.likeCount || 0,
    },
    {
      value: "REVIEW",
      label: "후기",
      icon: <ReviewIcon />,
      count: stats?.reviewCount || 0,
    },
  ];

  // 활동 내역 조회
  const fetchActivities = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await activityService.getMyActivities({
        page,
        size,
        type: selectedType,
      });

      if (response.success) {
        const activitiesData = response.data.content || [];
        setActivities(activitiesData);
        setTotalPages(response.data.totalPages || 0);

        // 좋아요 및 판매 활동의 경우 티켓 정보 가져오기
        const ticketActivities = activitiesData.filter(
          (a) => (a.activityType === "LIKE" || a.activityType === "SALE") && a.relatedUserId
        );
        if (ticketActivities.length > 0) {
          fetchTicketInfo(ticketActivities);
        }
      }
    } catch (err) {
      console.error("활동 내역 조회 에러:", err);
      setError(err.response?.data?.error || "활동 내역을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 통계 조회
  const fetchStats = async () => {
    try {
      const response = await activityService.getActivityStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("통계 조회 에러:", err);
    }
  };

  // 티켓 정보 조회 (좋아요 및 판매용)
  const fetchTicketInfo = async (ticketActivities) => {
    const ticketIds = ticketActivities
      .map((a) => a.relatedUserId)
      .filter((id) => id && !ticketInfoMap[id]);

    if (ticketIds.length === 0) return;

    const ticketMap = { ...ticketInfoMap };
    for (const ticketId of ticketIds) {
      try {
        const response = await ticketAPI.get(ENDPOINTS.TICKETS.DETAIL(ticketId));
        if (response.data) {
          ticketMap[ticketId] = response.data;
        }
      } catch (err) {
        console.error(`티켓 ${ticketId} 조회 에러:`, err);
        // 실패해도 티켓 ID는 표시할 수 있도록
      }
    }
    setTicketInfoMap(ticketMap);
  };

  useEffect(() => {
    fetchActivities();
    fetchStats();
  }, [page, selectedType]);

  // 페이지 변경
  const handlePageChange = (event, newPage) => {
    setPage(newPage - 1); // MUI Pagination은 1부터 시작
  };

  // 탭 변경
  const handleTabChange = (event, newValue) => {
    setSelectedType(newValue);
    setPage(0); // 탭 변경 시 첫 페이지로
  };

  // 활동 타입별 색상 및 아이콘
  const getActivityTypeInfo = (type) => {
    switch (type) {
      case "PURCHASE":
        return { color: "primary", label: "구매", icon: <PurchaseIcon /> };
      case "SALE":
        return { color: "success", label: "판매", icon: <SaleIcon /> };
      case "LIKE":
        return { color: "error", label: "좋아요", icon: <LikeIcon /> };
      case "REVIEW":
        return { color: "warning", label: "후기", icon: <ReviewIcon /> };
      default:
        return { color: "default", label: type, icon: null };
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        활동 내역
      </Typography>

      {/* 탭 */}
      <Tabs
        value={selectedType}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        {activityTypes.map((type) => (
          <Tab
            key={type.value || "all"}
            value={type.value}
            label={
              <Box display="flex" alignItems="center" gap={0.5}>
                {type.label}
                {type.count > 0 && (
                  <Chip
                    label={type.count}
                    size="small"
                    sx={{
                      height: 20,
                      minWidth: 20,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>
            }
            icon={type.icon || undefined}
            iconPosition="start"
          />
        ))}
      </Tabs>

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 로딩 */}
      {loading && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={8}
        >
          <CircularProgress size={48} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            활동 내역을 불러오는 중...
          </Typography>
        </Box>
      )}

      {/* 활동 내역 목록 */}
      {!loading && !error && (
        <>
          {activities.length === 0 ? (
            <Paper
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: 1,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              <Typography variant="body1" color="text.secondary">
                활동 내역이 없습니다
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {activities.map((activity) => {
                const typeInfo = getActivityTypeInfo(activity.activityType);
                const typeColors = {
                  PURCHASE: { bg: "#e3f2fd", icon: "#1976d2" },
                  SALE: { bg: "#e8f5e9", icon: "#388e3c" },
                  LIKE: { bg: "#fce4ec", icon: "#c2185b" },
                  REVIEW: { bg: "#fff3e0", icon: "#f57c00" },
                };
                const colors = typeColors[activity.activityType] || {
                  bg: "#f5f5f5",
                  icon: "#757575",
                };

                const ticketInfo = ticketInfoMap[activity.relatedUserId];

                return (
                  <Paper
                    key={activity.activityId}
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      transition: "box-shadow 0.2s",
                      border: "1px solid",
                      borderColor: "divider",
                      "&:hover": {
                        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                      },
                    }}
                  >
                    <Box display="flex" gap={2}>
                      {/* 아이콘 영역 */}
                      <Avatar
                        sx={{
                          bgcolor: "grey.100",
                          color: "text.secondary",
                          width: 36,
                          height: 36,
                        }}
                      >
                        {typeInfo.icon}
                      </Avatar>

                      {/* 내용 영역 */}
                      <Box flex={1}>
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          mb={1}
                        >
                          <Chip
                            label={typeInfo.label}
                            size="small"
                            color={typeInfo.color}
                            sx={{
                              fontWeight: 500,
                              height: 22,
                              fontSize: "0.75rem",
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(activity.createdAt).toLocaleString("ko-KR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Typography>
                        </Box>

                        {/* 좋아요 및 판매의 경우 티켓 정보 표시 */}
                        {(activity.activityType === "LIKE" || activity.activityType === "SALE") &&
                          activity.relatedUserId && (
                            <Box mb={1}>
                              <Typography variant="body2" color="text.secondary">
                                {ticketInfo?.eventName ? (
                                  <>
                                    티켓: <strong>{ticketInfo.eventName}</strong>
                                  </>
                                ) : (
                                  <>티켓 ID: {activity.relatedUserId}</>
                                )}
                              </Typography>
                            </Box>
                          )}

                        {activity.rating && (
                          <Box mb={1}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" color="text.secondary">
                                평점:
                              </Typography>
                              <Rating value={activity.rating} readOnly size="small" />
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                                ({activity.rating}/5)
                              </Typography>
                            </Box>
                          </Box>
                        )}

                        {activity.comment && (
                          <>
                            {(activity.rating ||
                              activity.activityType === "LIKE" ||
                              activity.activityType === "SALE") && <Divider sx={{ my: 1 }} />}
                            <Typography
                              variant="body1"
                              sx={{
                                color: "text.primary",
                                lineHeight: 1.6,
                              }}
                            >
                              {activity.comment}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page + 1}
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

export default ActivityPage;
