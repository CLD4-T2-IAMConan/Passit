import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import reportService from "../../services/reportService";

export default function ReportDetailPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await reportService.getMyReportDetail(reportId);
        const data = res.data?.data ?? res.data;
        setReport(data);
      } catch (e) {
        console.error(e);
        setErrorMsg("신고 상세 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [reportId]);

  if (loading) return <div style={{ padding: 16 }}>로딩 중...</div>;
  if (errorMsg) return <div style={{ padding: 16, color: "crimson" }}>{errorMsg}</div>;
  if (!report) return <div style={{ padding: 16 }}>데이터 없음</div>;

  return (
    <div style={{ padding: 16, maxWidth: 600 }}>
      <h2>신고 상세</h2>

      <div style={{ marginTop: 12 }}>
        <div><strong>상태</strong> : {report.status}</div>
        <div><strong>대상 타입</strong> : {report.targetType}</div>
        <div><strong>대상 ID</strong> : {report.targetId}</div>
        <div style={{ marginTop: 8 }}>
          <strong>신고 사유</strong>
          <div style={{ marginTop: 4 }}>{report.reason}</div>
        </div>
        {report.createdAt && (
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
            등록일 : {report.createdAt}
          </div>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => navigate(-1)}>목록으로</button>
      </div>
    </div>
  );
}