import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  TextField,
  InputAdornment,
  Grid,
  Link,
  Divider,
  Card,
  CardContent,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import GitHubIcon from "@mui/icons-material/GitHub";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SecurityIcon from "@mui/icons-material/Security";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { useAuth } from "../contexts/AuthContext";

const HomePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user: currentUser, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: 검색 기능 구현
    console.log("검색:", searchQuery);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const menuItems = [
    { label: "마이페이지", path: "/mypage" },
    { label: "판매등록", path: "/sell" },
    { label: "안내", path: "/guide" },
    { label: "고객센터", path: "/support" },
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
      {/* Header */}
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
                    color: "text.primary",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>

            {/* Mobile Menu Button */}
            {isMobile && (
              <IconButton
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={handleMobileMenuToggle}
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
        onClose={handleMobileMenuToggle}
        sx={{
          display: { md: "none" },
        }}
      >
        <Box sx={{ width: 250, pt: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.label} disablePadding>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  if (isAuthenticated) {
                    handleLogout();
                  } else {
                    navigate("/auth");
                  }
                  setMobileMenuOpen(false);
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
