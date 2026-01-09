import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Divider,
  LinearProgress,
  Button,
} from "@mui/material";
import {
  People as PeopleIcon,
  Settings as SettingsIcon,
  Announcement as AnnouncementIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Report as ReportIcon,
  HelpOutline as HelpOutlineIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import AdminLayout from "../../layouts/AdminLayout";
import { adminService } from "../../api/services/adminService";
import { getAdminNotices } from "../../api/services/noticeService";
import { getAdminInquiries } from "../../api/services/inquiryService";
import reportService from "../../services/reportService";
import { getAdminFaqs } from "../../api/services/faqService";

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    todaySignups: 0,
    totalInquiries: 0,
    pendingInquiries: 0,
    totalReports: 0,
    pendingReports: 0,
    totalNotices: 0,
    totalFaqs: 0,
  });
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [inquiryStatusData, setInquiryStatusData] = useState([]);
  const [reportStatusData, setReportStatusData] = useState([]);

  const COLORS = ["#4A90E2", "#50C878", "#F0AD4E", "#E74C3C", "#9B59B6"];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 병렬로 모든 데이터 가져오기
      const [usersResponse, inquiriesResponse, reportsResponse, noticesResponse, faqsResponse] =
        await Promise.allSettled([
          adminService.searchUsers({ page: 0, size: 1000 }),
          getAdminInquiries(),
          reportService.getAdminReports(),
          getAdminNotices(),
          getAdminFaqs(),
        ]);

      // 회원 통계
      let totalUsers = 0;
      let activeUsers = 0;
      let suspendedUsers = 0;
      let todaySignups = 0;

      if (usersResponse.status === "fulfilled") {
        const users =
          usersResponse.value?.content ||
          usersResponse.value?.data?.content ||
          (Array.isArray(usersResponse.value) ? usersResponse.value : []);
        totalUsers = users.length;
        activeUsers = users.filter((u) => u.status === "ACTIVE" || !u.status).length;
        suspendedUsers = users.filter((u) => u.status === "SUSPENDED").length;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        todaySignups = users.filter((u) => {
          const createdAt = new Date(u.createdAt || u.created_at);
          return createdAt >= today;
        }).length;

        // 최근 7일 가입 추이 데이터 생성
        const growthData = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + 1);

          const count = users.filter((u) => {
            const createdAt = new Date(u.createdAt || u.created_at);
            return createdAt >= date && createdAt < nextDate;
          }).length;

          growthData.push({
            date: date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" }),
            count,
          });
        }
        setUserGrowthData(growthData);
      }

      // 문의 통계
      let totalInquiries = 0;
      let pendingInquiries = 0;
      if (inquiriesResponse.status === "fulfilled") {
        const inquiries =
          inquiriesResponse.value?.data?.data ||
          inquiriesResponse.value?.data ||
          (Array.isArray(inquiriesResponse.value) ? inquiriesResponse.value : []);
        totalInquiries = inquiries.length;
        pendingInquiries = inquiries.filter(
          (i) => (i.status || i.answerStatus) === "PENDING"
        ).length;

        // 최근 문의 5개
        const recent = inquiries
          .sort(
            (a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)
          )
          .slice(0, 5);
        setRecentInquiries(recent);

        // 문의 상태별 통계
        const answered = inquiries.filter(
          (i) => (i.status || i.answerStatus) === "ANSWERED"
        ).length;
        setInquiryStatusData([
          { name: "답변완료", value: answered },
          { name: "대기중", value: pendingInquiries },
        ]);
      }

      // 신고 통계
      let totalReports = 0;
      let pendingReports = 0;
      if (reportsResponse.status === "fulfilled") {
        const reports =
          reportsResponse.value?.data?.data ||
          reportsResponse.value?.data ||
          (Array.isArray(reportsResponse.value) ? reportsResponse.value : []);
        totalReports = reports.length;
        pendingReports = reports.filter(
          (r) => r.status === "RECEIVED" || r.status === "IN_PROGRESS"
        ).length;

        // 최근 신고 5개
        const recent = reports
          .sort(
            (a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)
          )
          .slice(0, 5);
        setRecentReports(recent);

        // 신고 상태별 통계
        const statusCounts = {};
        reports.forEach((r) => {
          const status = r.status || "RECEIVED";
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        setReportStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));
      }

      // 공지사항 통계
      let totalNotices = 0;
      if (noticesResponse.status === "fulfilled") {
        const notices =
          noticesResponse.value?.data?.data ||
          noticesResponse.value?.data ||
          (Array.isArray(noticesResponse.value) ? noticesResponse.value : []);
        totalNotices = notices.length;
      }

      // FAQ 통계
      let totalFaqs = 0;
      if (faqsResponse.status === "fulfilled") {
        const faqs =
          faqsResponse.value?.data?.data ||
          faqsResponse.value?.data ||
          (Array.isArray(faqsResponse.value) ? faqsResponse.value : []);
        totalFaqs = faqs.length;
      }

      setStats({
        totalUsers,
        activeUsers,
        suspendedUsers,
        todaySignups,
        totalInquiries,
        pendingInquiries,
        totalReports,
        pendingReports,
        totalNotices,
        totalFaqs,
      });
    } catch (error) {
      console.error("대시보드 데이터 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      title: "회원 관리",
      description: "회원 조회, 검색, 수정, 삭제",
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      path: "/admin/users",
      color: "#4A90E2",
    },
    {
      title: "카테고리 관리",
      description: "카테고리 조회, 생성, 수정, 삭제",
      icon: <SettingsIcon sx={{ fontSize: 40 }} />,
      path: "/admin/categories",
      color: "#F0AD4E",
    },
    {
      title: "공지사항 관리",
      description: "공지사항 조회, 작성, 수정, 삭제",
      icon: <AnnouncementIcon sx={{ fontSize: 40 }} />,
      path: "/admin/notices",
      color: "#50C878",
    },
    {
      title: "문의사항 관리",
      description: "문의사항 조회, 답변 작성 및 관리",
      icon: <QuestionAnswerIcon sx={{ fontSize: 40 }} />,
      path: "/admin/inquiries",
      color: "#9B59B6",
    },
    {
      title: "신고 관리",
      description: "신고 내역 조회 및 처리",
      icon: <ReportIcon sx={{ fontSize: 40 }} />,
      path: "/admin/reports",
      color: "#E74C3C",
    },
    {
      title: "FAQ 관리",
      description: "FAQ 조회, 작성, 수정, 삭제",
      icon: <HelpOutlineIcon sx={{ fontSize: 40 }} />,
      path: "/admin/faqs",
      color: "#3498DB",
    },
  ];

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
          빠른 메뉴
        </Typography>

        <Grid container spacing={3}>
          {menuItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} lg={4} key={index} sx={{ display: "flex" }}>
              <Card
                sx={{
                  cursor: "pointer",
                  transition: "all 0.2s",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  },
                }}
                onClick={() => navigate(item.path)}
              >
                <CardContent sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 2,
                        backgroundColor: `${item.color}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: item.color,
                      }}
                    >
                      {item.icon}
                    </Box>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 통계 카드 */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            시스템 통계
          </Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                  }}
                >
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                          총 회원 수
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                          {stats.totalUsers.toLocaleString()}
                        </Typography>
                      </Box>
                      <PeopleIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    color: "white",
                  }}
                >
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                          활성 회원
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                          {stats.activeUsers.toLocaleString()}
                        </Typography>
                      </Box>
                      <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                    color: "white",
                  }}
                >
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                          대기 문의
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                          {stats.pendingInquiries}
                        </Typography>
                      </Box>
                      <QuestionAnswerIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                    color: "white",
                  }}
                >
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                          처리 대기 신고
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                          {stats.pendingReports}
                        </Typography>
                      </Box>
                      <ReportIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>

        {/* 그래프 섹션 */}
        {!loading && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {/* 회원 가입 추이 */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, display: "flex", flexDirection: "column" }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  최근 7일 회원 가입 추이
                </Typography>
                <Box sx={{ flex: 1 }}>
                  {userGrowthData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={userGrowthData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#667eea"
                          strokeWidth={2}
                          name="가입자 수"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                      <Typography variant="body2" color="text.secondary">
                        데이터가 없습니다.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* 문의 상태 분포 */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, display: "flex", flexDirection: "column" }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  문의 상태 분포
                </Typography>
                <Box sx={{ flex: 1 }}>
                  {inquiryStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={inquiryStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {inquiryStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                      <Typography variant="body2" color="text.secondary">
                        데이터가 없습니다.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* 신고 상태 분포 */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, display: "flex", flexDirection: "column" }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  신고 상태 분포
                </Typography>
                <Box sx={{ flex: 1 }}>
                  {reportStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reportStatusData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#fa709a" name="신고 수" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                      <Typography variant="body2" color="text.secondary">
                        데이터가 없습니다.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* 전체 통계 요약 */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, display: "flex", flexDirection: "column" }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  전체 통계 요약
                </Typography>
                <Stack spacing={2} sx={{ mt: 2, flex: 1 }}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">공지사항</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {stats.totalNotices}개
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(
                        (stats.totalNotices / Math.max(stats.totalUsers, 1)) * 100,
                        100
                      )}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">FAQ</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {stats.totalFaqs}개
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((stats.totalFaqs / Math.max(stats.totalUsers, 1)) * 100, 100)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">전체 문의</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {stats.totalInquiries}개
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(
                        (stats.totalInquiries / Math.max(stats.totalUsers, 1)) * 100,
                        100
                      )}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">전체 신고</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {stats.totalReports}개
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(
                        (stats.totalReports / Math.max(stats.totalUsers, 1)) * 100,
                        100
                      )}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* 빠른 미리보기 테이블 */}
        {!loading && (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {/* 최근 문의 */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, display: "flex", flexDirection: "column" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    최근 문의
                  </Typography>
                  <Button size="small" onClick={() => navigate("/admin/inquiries")}>
                    전체보기
                  </Button>
                </Stack>
                <Box sx={{ flex: 1, overflow: "auto" }}>
                  {recentInquiries.length === 0 ? (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height="100%"
                      minHeight={200}
                    >
                      <Typography variant="body2" color="text.secondary">
                        최근 문의가 없습니다.
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ width: "50%" }}>제목</TableCell>
                            <TableCell sx={{ width: "25%" }}>상태</TableCell>
                            <TableCell sx={{ width: "25%" }}>작성일</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {recentInquiries.map((inquiry) => {
                            const id = inquiry.inquiryId ?? inquiry.id;
                            const status = inquiry.status ?? inquiry.answerStatus;
                            return (
                              <TableRow
                                key={id}
                                hover
                                sx={{ cursor: "pointer" }}
                                onClick={() => navigate(`/admin/inquiries/${id}`)}
                              >
                                <TableCell>
                                  <Typography variant="body2" noWrap>
                                    {inquiry.title}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={status === "ANSWERED" ? "답변완료" : "대기중"}
                                    color={status === "ANSWERED" ? "success" : "warning"}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption" color="text.secondary">
                                    {inquiry.createdAt
                                      ? new Date(inquiry.createdAt).toLocaleDateString("ko-KR")
                                      : "-"}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* 최근 신고 */}
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 3,
                  height: "100%",
                  minHeight: 400,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    최근 신고
                  </Typography>
                  <Button size="small" onClick={() => navigate("/admin/reports")}>
                    전체보기
                  </Button>
                </Stack>
                <Box sx={{ flex: 1, overflow: "auto" }}>
                  {recentReports.length === 0 ? (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      height="100%"
                      minHeight={200}
                    >
                      <Typography variant="body2" color="text.secondary">
                        최근 신고가 없습니다.
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ width: "20%" }}>ID</TableCell>
                            <TableCell sx={{ width: "30%" }}>상태</TableCell>
                            <TableCell sx={{ width: "50%" }}>사유</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {recentReports.map((report) => {
                            const id = report.reportId ?? report.id;
                            return (
                              <TableRow
                                key={id}
                                hover
                                sx={{ cursor: "pointer" }}
                                onClick={() => navigate(`/admin/reports/${id}`)}
                              >
                                <TableCell>{id}</TableCell>
                                <TableCell>
                                  <Chip label={report.status} size="small" color="default" />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" noWrap>
                                    {report.reason || "-"}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
