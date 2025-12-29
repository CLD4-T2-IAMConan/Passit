import { useEffect, useState } from "react";
import { getNotices } from "../services/noticeService";

export default function NoticeTestPage() {
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getNotices()
      .then((res) => {
        console.log("✅ notices response:", res.data);
        setNotices(res.data.data); // 공통 응답 구조 기준
      })
      .catch((err) => {
        console.error("❌ API error:", err);
        setError("공지 목록을 불러오지 못했습니다.");
      });
  }, []);

  return (
    <div>
      <h2>공지 API 테스트 페이지</h2>

      {error && <p>{error}</p>}

      <ul>
        {notices.map((notice) => (
          <li key={notice.id}>{notice.title}</li>
        ))}
      </ul>
    </div>
  );
}