import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotices } from "../../services/noticeService";

export default function NoticeListPage() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const res = await getNotices();

        // 백엔드 응답: { success: true, data: [...] }
        const list = res?.data?.data ?? [];
        setNotices(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        setErrorMsg("공지 목록 조회 실패");
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  if (loading) return <div style={{ padding: 16 }}>로딩중...</div>;
  if (errorMsg) return <div style={{ padding: 16 }}>{errorMsg}</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>공지사항</h2>

      {notices.length === 0 ? (
        <div>공지 없음</div>
      ) : (
        <ul style={{ paddingLeft: 18 }}>
          {notices.map((n) => (
            <li key={n.id ?? n.noticeId ?? JSON.stringify(n)}>
              <button
                type="button"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/cs/notices/${n.id ?? n.noticeId}`)}
              >
                {n.title ?? "(제목 없음)"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}