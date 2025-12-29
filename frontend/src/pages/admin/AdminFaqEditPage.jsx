import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getFaqDetail, updateFaq } from "../../api/services/faqService";

export default function AdminFaqEditPage() {
  const { faqId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    (async () => {
      const data = await getFaqDetail(faqId);
      const dto = data?.data ?? data;
      setQuestion(dto?.question ?? dto?.title ?? "");
      setAnswer(dto?.answer ?? dto?.content ?? "");
    })();
  }, [faqId]);

  const onSubmit = async (e) => {
    e.preventDefault();
    await updateFaq(faqId, { question, answer });
    navigate("/admin/faqs");
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>FAQ 수정</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 720 }}>
        <input value={question} onChange={(e) => setQuestion(e.target.value)} />
        <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={8} />
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