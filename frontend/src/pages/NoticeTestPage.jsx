import React from "react";
import { getNotices, createAdminNotice } from "../services/noticeService";

export default function NoticeTestPage() {
  const handleGet = async () => {
    const res = await getNotices();
    console.log("GET /api/notices:", res.data);
  };

  const handleCreate = async () => {
    const payload = {
      title: "공지사항 제목",
      content: "공지사항 내용입니다",
      categoryId: 1,
      visible: true,
      pinned: false,
    };

    const res = await createAdminNotice(payload);
    console.log("POST /api/admin/notices:", res.data);
  };

  return (
    <div style={{ padding: 20 }}>
      <button onClick={handleGet}>공지 목록 GET</button>
      <button onClick={handleCreate} style={{ marginLeft: 10 }}>
        공지 생성 POST(관리자)
      </button>
    </div>
  );
}