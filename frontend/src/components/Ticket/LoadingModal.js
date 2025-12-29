// src/components/Ticket/LoadingModal.js (새로 생성)

import React from "react";
import { Backdrop, CircularProgress, Typography, Box } from "@mui/material";

const LoadingModal = ({ open }) => {
  return (
    // 'open' prop이 true일 때만 배경을 덮고 나타납니다.
    <Backdrop
      open={open}
      sx={{
        color: "#fff",
        // zIndex를 높게 설정하여 다른 UI 위에 표시
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Box textAlign="center">
        <CircularProgress color="inherit" />
        <Typography sx={{ mt: 2 }}>양도 요청을 처리 중입니다... 잠시만 기다려주세요.</Typography>
      </Box>
    </Backdrop>
  );
};

export default LoadingModal;
