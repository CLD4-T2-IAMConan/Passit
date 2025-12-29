import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createFaq } from "../../api/services/faqService";

export default function AdminFaqCreatePage() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    await createFaq({ question, answer });
    navigate("/admin/faqs");
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>FAQ 등록</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 720 }}>
        <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="질문" />
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="답변"
          rows={8}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" style={{ cursor: "pointer" }}>
            저장
          </button>
          <button type="button" onClick={() => navigate(-1)} style={{ cursor: "pointer" }}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
