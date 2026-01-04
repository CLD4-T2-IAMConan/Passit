import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminFaqs, deleteFaq } from "../../api/services/faqService";

export default function AdminFaqListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await getAdminFaqs();
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setItems(list);
    } catch (e) {
      setError("관리자 FAQ 목록 조회 실패");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async (id) => {
    if (!window.confirm("삭제할까요?")) return;
    try {
      await deleteFaq(id);
      await load();
    } catch (e) {
      alert("삭제 실패");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>관리자 FAQ</h2>
      {error && <p>{error}</p>}

      <button
        onClick={() => navigate("/admin/faqs/new")}
        style={{ cursor: "pointer", marginBottom: 12 }}
      >
        + FAQ 등록
      </button>

      <ul style={{ lineHeight: "2" }}>
        {items.map((faq) => {
          const id = faq.id ?? faq.faqId;
          return (
            <li key={id}>
              <span style={{ marginRight: 8 }}>{faq.question ?? faq.title ?? `FAQ #${id}`}</span>
              <button
                onClick={() => navigate(`/admin/faqs/${id}/edit`)}
                style={{ cursor: "pointer", marginRight: 6 }}
              >
                수정
              </button>
              <button onClick={() => onDelete(id)} style={{ cursor: "pointer" }}>
                삭제
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
