import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getFaqDetail } from "../../api/services/faqService";

export default function FaqPage() {
  const { faqId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getFaqDetail(faqId);
        const dto = data?.data ?? data;
        setItem(dto);
      } catch (e) {
        setError("FAQ 상세 조회 실패");
      } finally {
        setLoading(false);
      }
    })();
  }, [faqId]);

  return (
    <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", pt: "64px" }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          뒤로
        </Button>

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

        {!loading && !error && item && (
          <Paper sx={{ p: 4 }}>
            <Stack spacing={3}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {item.question ?? item.title ?? `FAQ #${faqId}`}
              </Typography>

              <Divider />

              <Typography
                variant="body1"
                sx={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.8,
                  minHeight: 200,
                }}
              >
                {item.answer ?? item.content ?? ""}
              </Typography>
            </Stack>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
