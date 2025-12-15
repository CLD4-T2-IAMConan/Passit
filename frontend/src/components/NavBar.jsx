import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Typography,
  Container,
  Menu,
  MenuItem,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../contexts/AuthContext";

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const [csAnchorEl, setCsAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const csOpen = Boolean(csAnchorEl);

  const go = (path) => {
    navigate(path);
    setCsAnchorEl(null);
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate("/auth");
    setMobileMenuOpen(false);
  };

  const menuItems = [
    { label: "마이페이지", path: "/mypage" },
    { label: "판매등록", path: "/sell" },
    { label: "티켓", path: "/tickets" },
    { label: "안내", path: "/guide" },
  ];

  return (
    <>
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

            {/* Menu */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: { md: 2, lg: 3 },
                flex: 1,
                justifyContent: "center",
              }}
            >
              {menuItems.map((item) => (
                <Button
                  key={item.label}
                  color="inherit"
                  onClick={() => navigate(item.path)}
                  sx={{
                    fontSize: "0.938rem",
                    fontWeight: 500,
                    color: isActive(item.path) ? "primary.main" : "text.primary",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  {item.label}
                </Button>
              ))}

              {/* 고객센터 드롭다운 */}
              <Button
                onClick={(e) => setCsAnchorEl(e.currentTarget)}
                sx={{
                  fontSize: "0.938rem",
                  fontWeight: 500,
                  color: isActive("/cs") ? "primary.main" : "text.primary",
                  "&:hover": { color: "primary.main" },
                }}
              >
                고객센터
              </Button>

              <Menu anchorEl={csAnchorEl} open={csOpen} onClose={() => setCsAnchorEl(null)}>
                <MenuItem onClick={() => go("/cs/notices")}>공지</MenuItem>
                <MenuItem onClick={() => go("/cs/inquiries")}>문의</MenuItem>
                <MenuItem onClick={() => go("/cs/faqs")}>FAQ</MenuItem>
              </Menu>
            </Box>

            {/* Mobile Menu Button */}
            {isMobile && (
              <IconButton
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                sx={{ ml: 1 }}
              >
                {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </IconButton>
            )}

            {/* Login/Logout Button */}
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

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          display: { md: "none" },
        }}
      >
        <Box sx={{ width: 250, pt: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.label} disablePadding>
                <ListItemButton onClick={() => go(item.path)}>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem disablePadding>
              <ListItemButton onClick={() => go("/cs/notices")}>
                <ListItemText primary="공지" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => go("/cs/inquiries")}>
                <ListItemText primary="문의" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => go("/cs/faqs")}>
                <ListItemText primary="FAQ" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  if (isAuthenticated) {
                    handleLogout();
                  } else {
                    navigate("/auth");
                  }
                }}
                sx={{ mt: 2 }}
              >
                <ListItemText
                  primary={isAuthenticated ? "로그아웃" : "로그인"}
                  primaryTypographyProps={{
                    color: "primary",
                    fontWeight: 600,
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}
