import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AdminLayout from "../../layouts/AdminLayout";
import { getAdminFaqs, deleteFaq } from "../../api/services/faqService";

export default function AdminFaqListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await getAdminFaqs();
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setItems(list);
    } catch (e) {
      setError("관리자 FAQ 목록 조회 실패");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id) => {
    if (!window.confirm("삭제할까요?")) return;
    try {
      await deleteFaq(id);
      await load();
    } catch (e) {
      alert("삭제 실패");
    }
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              FAQ 관리
            </Typography>
            <Button variant="contained" onClick={() => navigate("/admin/faqs/new")}>
              FAQ 등록
            </Button>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {items.length === 0 ? (
            <Typography>FAQ가 없습니다.</Typography>
          ) : (
            <List>
              {items.map((faq) => {
                const id = faq.id ?? faq.faqId;
                return (
                  <ListItem
                    key={id}
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          edge="end"
                          onClick={() => navigate(`/admin/faqs/${id}/edit`)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" onClick={() => onDelete(id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    }
                  >
                    <ListItemText
                      primary={faq.question ?? faq.title ?? `FAQ #${id}`}
                      secondary={faq.answer ?? faq.content}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      </Container>
    </AdminLayout>
  );
}
