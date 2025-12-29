import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import reportService from "../../services/reportService";

const STATUS_OPTIONS = ["RECEIVED", "IN_PROGRESS", "RESOLVED", "REJECTED"];

export default function AdminReportDetailPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState("RECEIVED");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const idNum = useMemo(() => {
    const n = Number(reportId);
    return Number.isNaN(n) ? reportId : n;
  }, [reportId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await reportService.getAdminReportDetail(idNum);
      const data = res.data?.data ?? res.data;
      setDetail(data || null);

      const currentStatus = data?.status;
      if (currentStatus && STATUS_OPTIONS.includes(currentStatus)) {
        setStatus(currentStatus);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("신고 상세 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idNum]);

  const handleUpdateStatus = async () => {
    try {
      setSaving(true);
      setErrorMsg("");
      await reportService.updateReportStatus(idNum, status);
      await fetchDetail();
      alert("상태 변경 완료");
    } catch (e) {
      console.error(e);
      setErrorMsg("상태 변경 실패");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 16 }}>로딩 중...</div>;
  if (errorMsg) return <div style={{ padding: 16, color: "crimson" }}>{errorMsg}</div>;
  if (!detail) return <div style={{ padding: 16 }}>데이터 없음</div>;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => navigate(-1)}>뒤로</button>
        <button onClick={() => navigate("/admin/reports")}>목록</button>
      </div>

      <h2>신고 상세 (관리자)</h2>

      <div style={{ marginTop: 12, lineHeight: 1.8 }}>
        <div>
          <b>ID</b>: {detail.reportId ?? detail.id}
        </div>
        <div>
          <b>상태</b>: {detail.status}
        </div>
        <div>
          <b>신고자</b>: {detail.reporterId ?? detail.userId}
        </div>
        <div>
          <b>대상 타입</b>: {detail.targetType}
        </div>
        <div>
          <b>대상 ID</b>: {detail.targetId}
        </div>
        <div>
          <b>사유</b>: {detail.reason}
        </div>
        {detail.createdAt && (
          <div>
            <b>생성일</b>: {detail.createdAt}
          </div>
        )}
      </div>

      <hr style={{ margin: "16px 0" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <label htmlFor="status">
          <b>상태 변경</b>
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={saving}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button onClick={handleUpdateStatus} disabled={saving}>
          {saving ? "저장 중..." : "변경"}
        </button>
      </div>
    </div>
  );
}
