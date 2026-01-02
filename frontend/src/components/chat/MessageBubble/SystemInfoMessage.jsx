import React from "react";
import { Box, Typography } from "@mui/material";

const SystemInfoMessage = ({ message }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        my: 1.5,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          px: 2.5,
          py: 0.8,
          bgcolor: "rgba(0,0,0,0.05)",
          color: "text.secondary",
          borderRadius: "12px",
          fontSize: "0.75rem",
          fontWeight: 500,
        }}
      >
        {message.content}
      </Typography>
    </Box>
  );
};

export default SystemInfoMessage;
