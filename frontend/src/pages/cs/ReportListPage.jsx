import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import reportService from "../../services/reportService";
import { useAuth } from "../../contexts/AuthContext";

export default function ReportListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setErrorMsg("");
        const res = await reportService.getMyReports(user.userId);
        // 백엔드 응답이 { success, data }면 data만 사용
        const data = res.data?.data ?? res.data;
        setReports(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setErrorMsg("신고 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user.userId]);

  if (loading) return <div style={{ padding: 16 }}>로딩 중...</div>;
  if (errorMsg) return <div style={{ padding: 16, color: "crimson" }}>{errorMsg}</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>내 신고 목록</h2>

      {reports.length === 0 ? (
        <div style={{ marginTop: 12 }}>등록된 신고가 없습니다.</div>
      ) : (
        <ul style={{ marginTop: 12 }}>
          {reports.map((r) => (
            <li
              key={r.reportId ?? r.id}
              style={{ cursor: "pointer", marginBottom: 8 }}
              onClick={() => navigate(`/cs/reports/${r.reportId ?? r.id}`)}
            >
              <strong>{r.status}</strong> · {r.reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}