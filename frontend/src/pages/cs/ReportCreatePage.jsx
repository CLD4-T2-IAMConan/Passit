import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import reportService from "../../services/reportService";

export default function ReportCreatePage() {
  const navigate = useNavigate();

  const [targetType, setTargetType] = useState("USER"); // USER | TICKET 등 너희 백엔드 enum에 맞추기
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!targetType) return setErrorMsg("대상 타입을 선택해 주세요.");
    if (!targetId) return setErrorMsg("대상 ID를 입력해 주세요.");
    if (!reason.trim()) return setErrorMsg("신고 사유를 입력해 주세요.");

    try {
      setSubmitting(true);

      const payload = {
        // userId는 백엔드가 토큰에서 뽑아쓰면 제거해야 함.
        // (필요 없으면 삭제)
        userId: undefined,
        targetType,
        targetId: Number(targetId),
        reason: reason.trim(),
      };

      // userId가 필요 없으면 undefined 키 뺌
      if (payload.userId === undefined) delete payload.userId;

      await reportService.createReport(payload);

      alert("신고가 등록되었습니다.");
      navigate(-1);
    } catch (err) {
      console.error(err);
      setErrorMsg("신고 등록 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 520 }}>
      <h2>신고 등록</h2>

      {errorMsg && (
        <div style={{ marginTop: 12, color: "crimson" }}>{errorMsg}</div>
      )}

      <form onSubmit={onSubmit} style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>대상 타입</label>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            style={{ width: "100%", padding: 10 }}
          >
            <option value="USER">USER</option>
            <option value="TICKET">TICKET</option>
          </select>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
            백엔드 enum에 맞게 값 수정
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>대상 ID</label>
          <input
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="예: 123"
            inputMode="numeric"
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>신고 사유</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="신고 사유를 입력하세요"
            rows={5}
            style={{ width: "100%", padding: 10, resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => navigate(-1)}>
            취소
          </button>
          <button type="submit" disabled={submitting}>
            {submitting ? "등록 중..." : "신고 등록"}
          </button>
        </div>
      </form>
    </div>
  );
}