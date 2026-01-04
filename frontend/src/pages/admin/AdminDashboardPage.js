import React from "react";
import { Box, Container, Typography, Grid, Paper, Card, CardContent } from "@mui/material";
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";

const AdminDashboardPage = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "회원 관리",
      description: "회원 조회, 검색, 수정, 삭제",
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      path: "/admin/users",
      color: "#4A90E2",
    },
    {
      title: "시스템 설정",
      description: "시스템 설정 및 관리",
      icon: <SettingsIcon sx={{ fontSize: 40 }} />,
      path: "/admin/settings",
      color: "#F0AD4E",
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
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  },
                }}
                onClick={() => navigate(item.path)}
              >
                <CardContent sx={{ p: 3 }}>
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
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 통계 정보 (추후 구현) */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            시스템 통계
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  총 회원 수
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  -
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  활성 회원
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  -
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  정지된 회원
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  -
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  오늘 가입
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  -
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
