import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFaqDetail } from "../../api/services/faqService";

export default function FaqPage() {
  const { faqId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getFaqDetail(faqId);
        const dto = data?.data ?? data;
        setItem(dto);
      } catch (e) {
        setError("FAQ 상세 조회 실패");
      }
    })();
  }, [faqId]);

  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => navigate(-1)} style={{ cursor: "pointer" }}>
        ← 뒤로
      </button>

      <h2 style={{ marginTop: 16 }}>FAQ 상세</h2>
      {error && <p>{error}</p>}

      {item && (
        <>
          <h3>{item.question ?? item.title ?? `FAQ #${faqId}`}</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{item.answer ?? item.content ?? ""}</p>
        </>
      )}
    </div>
  );
}
