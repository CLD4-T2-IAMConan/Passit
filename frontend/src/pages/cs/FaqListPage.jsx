import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFaqs } from "../../api/services/faqService";

export default function FaqListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getFaqs();
        // 백엔드 응답 형태가 { data: [...] } or [...] 일 수 있어서 방어
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        setItems(list);
      } catch (e) {
        setError("FAQ 목록 조회 실패");
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>FAQ</h2>
      {error && <p>{error}</p>}

      <ul style={{ lineHeight: "2" }}>
        {items.map((faq) => (
          <li key={faq.id ?? faq.faqId}>
            <button
              onClick={() => navigate(`/cs/faqs/${faq.id ?? faq.faqId}`)}
              style={{ cursor: "pointer" }}
            >
              {faq.question ?? faq.title ?? `FAQ #${faq.id ?? faq.faqId}`}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}