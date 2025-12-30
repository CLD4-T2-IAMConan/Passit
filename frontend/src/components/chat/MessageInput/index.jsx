import React, { useState, useRef } from "react";
import { Box, TextField, IconButton, InputAdornment } from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";

const MessageInput = ({ onSend }) => {
  const [text, setText] = useState("");
  const isSubmitting = useRef(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    // Prevent double submission
    if (isSubmitting.current) {
      console.log("⚠️ 중복 전송 방지");
      return;
    }

    isSubmitting.current = true;
    console.log("📤 메시지 전송:", text);

    onSend(text);
    setText("");

    // Reset after a short delay
    setTimeout(() => {
      isSubmitting.current = false;
    }, 300);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        gap: 1.5,
        alignItems: "center",
        px: 2,
        py: 1.5,
      }}
    >
      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="메시지를 입력하세요"
        variant="outlined"
        sx={{
          "& .MuiOutlinedInput-root": {
            bgcolor: "background.paper",
            borderRadius: "24px",
            "& fieldset": {
              borderColor: "divider",
            },
            "&:hover fieldset": {
              borderColor: "primary.main",
            },
            "&.Mui-focused fieldset": {
              borderColor: "primary.main",
              borderWidth: 1.5,
            },
          },
          "& .MuiOutlinedInput-input": {
            py: 1,
            px: 2,
            fontSize: "0.95rem",
            lineHeight: 1.5,
          },
        }}
      />
      <IconButton
        type="submit"
        disabled={!text.trim()}
        sx={{
          bgcolor: text.trim() ? "primary.main" : "action.disabledBackground",
          color: text.trim() ? "white" : "text.disabled",
          width: 48,
          height: 48,
          borderRadius: "50%",
          boxShadow: text.trim() ? "0 2px 8px rgba(25, 118, 210, 0.3)" : "none",
          "&:hover": {
            bgcolor: text.trim() ? "primary.dark" : "action.disabledBackground",
            boxShadow: text.trim() ? "0 4px 12px rgba(25, 118, 210, 0.4)" : "none",
            transform: text.trim() ? "scale(1.05)" : "none",
          },
          "&.Mui-disabled": {
            bgcolor: "action.disabledBackground",
            color: "text.disabled",
          },
          transition: "all 0.2s ease",
          flexShrink: 0,
        }}
      >
        <SendIcon sx={{ fontSize: 24 }} />
      </IconButton>
    </Box>
  );
};

export default MessageInput;
