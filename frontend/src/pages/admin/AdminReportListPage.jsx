import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import reportService from "../../services/reportService";

export default function AdminReportListPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await reportService.getAdminReports();
        const data = res.data?.data ?? res.data;
        setReports(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setErrorMsg("신고 목록 조회 실패");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div style={{ padding: 16 }}>로딩 중...</div>;
  if (errorMsg) return <div style={{ padding: 16, color: "crimson" }}>{errorMsg}</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>신고 관리</h2>

      {reports.length === 0 ? (
        <div style={{ marginTop: 12 }}>신고 데이터 없음</div>
      ) : (
        <table width="100%" style={{ marginTop: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>상태</th>
              <th>대상</th>
              <th>사유</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr
                key={r.reportId ?? r.id}
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/admin/reports/${r.reportId ?? r.id}`)}
              >
                <td>{r.reportId ?? r.id}</td>
                <td>{r.status}</td>
                <td>
                  {r.targetType} #{r.targetId}
                </td>
                <td>{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
