import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const [csAnchorEl, setCsAnchorEl] = React.useState(null);
  const csOpen = Boolean(csAnchorEl);

  const go = (path) => {
    navigate(path);
    setCsAnchorEl(null);
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <AppBar position="sticky" elevation={0} color="default">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* 로고 */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography
            variant="h6"
            sx={{ cursor: "pointer", fontWeight: 800 }}
            onClick={() => navigate("/")}
          >
            Passit
          </Typography>

          {/* 상단 메뉴(기존 있으면 너 프로젝트 메뉴로 바꿔도 됨) */}
          <Button
            onClick={() => navigate("/mypage")}
            variant={isActive("/mypage") ? "contained" : "text"}
          >
            마이페이지
          </Button>
          <Button
            onClick={() => navigate("/sell")}
            variant={isActive("/sell") ? "contained" : "text"}
          >
            판매등록
          </Button>
          <Button
            onClick={() => navigate("/guide")}
            variant={isActive("/guide") ? "contained" : "text"}
          >
            안내
          </Button>

          {/* 고객센터 드롭다운 */}
          <Button
            onClick={(e) => setCsAnchorEl(e.currentTarget)}
            variant={isActive("/cs") ? "contained" : "text"}
          >
            고객센터
          </Button>

          <Menu anchorEl={csAnchorEl} open={csOpen} onClose={() => setCsAnchorEl(null)}>
            <MenuItem onClick={() => go("/cs/notices")}>공지</MenuItem>
            <MenuItem onClick={() => go("/cs/inquiries")}>문의</MenuItem>
            <MenuItem onClick={() => go("/cs/faqs")}>FAQ</MenuItem>
          </Menu>
        </Box>

        {/* 우측 버튼들(있으면 그대로 유지/없으면 삭제 가능) */}
        <Box>
          <Button variant="contained" onClick={() => navigate("/login")}>
            로그인
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}