import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";

import { getMyInquiries } from "../../api/services/inquiryService";

const InquiryListPage = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchList = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await getMyInquiries();

      // 백엔드 응답 형태가 배열이거나 { data: [...] }거나 섞여도 최대한 안전하게 처리
      const data = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];

      setItems(data);
    } catch (err) {
      console.error(err);
      setErrorMsg("문의 목록 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          문의 목록
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={fetchList}>
            새로고침
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate("/cs/inquiries/new")}
          >
            문의하기
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 2 }}>
        {loading && (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress />
          </Stack>
        )}

        {!loading && errorMsg && (
          <Typography color="error" sx={{ py: 2 }}>
            {errorMsg}
          </Typography>
        )}

        {!loading && !errorMsg && items.length === 0 && (
          <Typography sx={{ py: 2 }}>등록된 문의가 없습니다.</Typography>
        )}

        {!loading && !errorMsg && items.length > 0 && (
          <List>
            {items.map((it, idx) => {
              // id 키가 inquiryId / id 등으로 올 수 있어서 안전 처리
              const id = it?.inquiryId ?? it?.id;

              // 제목/상태도 프로젝트마다 필드명이 다를 수 있어서 fallback
              const title = it?.title ?? it?.subject ?? `문의 #${id ?? idx + 1}`;
              const status = it?.status ?? it?.answerStatus ?? "";

              return (
                <React.Fragment key={id ?? idx}>
                  <ListItem
                    button
                    onClick={() => {
                      if (!id) return;
                      navigate(`/cs/inquiries/${id}`);
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography fontWeight={700}>{title}</Typography>
                          {status && (
                            <Typography variant="body2" color="text.secondary">
                              ({status})
                            </Typography>
                          )}
                        </Stack>
                      }
                      secondary={
                        it?.createdAt
                          ? `작성일: ${it.createdAt}`
                          : it?.createdDate
                          ? `작성일: ${it.createdDate}`
                          : ""
                      }
                    />
                  </ListItem>
                  {idx !== items.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default InquiryListPage;