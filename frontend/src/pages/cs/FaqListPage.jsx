import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Alert,
  Stack,
  CircularProgress,
} from "@mui/material";
import { getFaqs } from "../../api/services/faqService";

export default function FaqListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getFaqs();
        // 백엔드 응답 형태가 { data: [...] } or [...] 일 수 있어서 방어
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        setItems(list);
      } catch (e) {
        setError("FAQ 목록 조회 실패");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", pt: "64px" }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            자주 묻는 질문 (FAQ)
          </Typography>
          <Typography variant="body1" color="text.secondary">
            궁금한 사항을 빠르게 확인하세요
          </Typography>
        </Box>

        <Paper sx={{ p: 2 }}>
          {loading && (
            <Stack alignItems="center" sx={{ py: 6 }}>
              <CircularProgress />
            </Stack>
          )}

          {!loading && error && (
            <Alert severity="error" sx={{ my: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && items.length === 0 && (
            <Typography sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
              등록된 FAQ가 없습니다.
            </Typography>
          )}

          {!loading && !error && items.length > 0 && (
            <List>
              {items.map((faq, idx) => {
                const id = faq.id ?? faq.faqId;
                const question = faq.question ?? faq.title ?? `FAQ #${id}`;

                return (
                  <React.Fragment key={id ?? idx}>
                    <ListItem disablePadding>
                      <ListItemButton onClick={() => navigate(`/cs/faqs/${id}`)}>
                        <ListItemText
                          primary={
                            <Typography fontWeight={600}>{question}</Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                    {idx !== items.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
