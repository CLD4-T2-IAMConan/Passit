import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getNoticeDetail } from "../../services/noticeService";

export default function NoticePage() {
  const { noticeId } = useParams();
  const navigate = useNavigate();

  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const res = await getNoticeDetail(noticeId);

        // 백엔드 응답: { success: true, data: {...} }
        const data = res?.data?.data ?? null;
        setNotice(data);
      } catch (e) {
        console.error(e);
        setErrorMsg("공지 상세 조회 실패");
      } finally {
        setLoading(false);
      }
    };

    if (noticeId) fetchDetail();
  }, [noticeId]);

  if (loading) return <div style={{ padding: 16 }}>로딩중...</div>;
  if (errorMsg) return <div style={{ padding: 16 }}>{errorMsg}</div>;

  return (
    <div style={{ padding: 16 }}>
      <button type="button" onClick={() => navigate("/cs/notices")}>
        ← 목록
      </button>

      <h2 style={{ marginTop: 12 }}>{notice?.title ?? "(제목 없음)"}</h2>
      <div style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>
        {notice?.content ?? "(내용 없음)"}
      </div>
    </div>
  );
}