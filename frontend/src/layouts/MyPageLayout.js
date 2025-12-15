import React, { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import HistoryIcon from "@mui/icons-material/History";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../contexts/AuthContext";

const MyPageLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const menuItems = [
    {
      text: "회원정보",
      icon: <PersonIcon />,
      path: "/mypage/profile",
    },
    {
      text: "활동 내역",
      icon: <HistoryIcon />,
      path: "/mypage/activities",
    },
    {
      text: "My 티켓",
      icon: <ConfirmationNumberIcon />,
      path: "/mypage/my-tickets",
    },
  ];

  const sidebarContent = (
    <Paper
      sx={{
        height: "100%",
        borderRadius: { xs: 0, md: "12px" },
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          p: 3,
          borderBottom: "1px solid",
          borderColor: "grey.200",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          마이페이지
        </Typography>
        {isMobile && (
          <IconButton onClick={() => setMobileMenuOpen(false)} edge="end">
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      <List sx={{ px: 2, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) {
                  setMobileMenuOpen(false);
                }
              }}
              sx={{
                borderRadius: "12px",
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "white",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                  "& .MuiListItemIcon-root": {
                    color: "white",
                  },
                },
                "&:hover": {
                  bgcolor: "grey.100",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? "white" : "text.secondary",
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 500,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header - HomePage 스타일 */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: "white",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "grey.200",
          zIndex: 1000,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            sx={{
              px: { xs: 2, sm: 3 },
              justifyContent: "space-between",
            }}
          >
            {/* Logo */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
              }}
              onClick={() => navigate("/")}
            >
              <Typography
                variant="h5"
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: "primary.main",
                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                }}
              >
                Passit
              </Typography>
            </Box>

            {/* Mobile Menu Button */}
            {isMobile && (
              <IconButton
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={() => setMobileMenuOpen(true)}
                sx={{ ml: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Desktop Login/Logout Button */}
            {!isMobile && (
              <Box>
                {isAuthenticated ? (
                  <Button
                    onClick={handleLogout}
                    variant="outlined"
                    color="primary"
                    size="small"
                    sx={{
                      fontSize: { xs: "0.813rem", sm: "0.875rem" },
                      px: { xs: 2, sm: 3 },
                    }}
                  >
                    로그아웃
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate("/auth")}
                    variant="contained"
                    color="primary"
                    size="small"
                    sx={{
                      fontSize: { xs: "0.813rem", sm: "0.875rem" },
                      px: { xs: 2, sm: 3 },
                    }}
                  >
                    로그인
                  </Button>
                )}
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Sidebar Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          display: { xs: "block", md: "none" },
        }}
      >
        <Box sx={{ width: 260 }}>{sidebarContent}</Box>
      </Drawer>

      {/* Main Content Area */}
      <Container
        maxWidth="lg"
        sx={{
          mt: "64px",
          py: 4,
          px: { xs: 2, sm: 3 },
          flex: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 3,
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          {/* Desktop Sidebar */}
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              width: 260,
              flexShrink: 0,
            }}
          >
            {sidebarContent}
          </Box>

          {/* Main Content */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default MyPageLayout;
