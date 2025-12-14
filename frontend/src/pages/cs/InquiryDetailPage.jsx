import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getInquiryDetail } from "../../api/services/inquiryService";

const InquiryDetailPage = () => {
  const { inquiryId } = useParams();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInquiryDetail = async () => {
      try {
        const res = await getInquiryDetail(inquiryId);
        setInquiry(res.data);
      } catch (err) {
        setError("문의 상세 조회 실패");
      } finally {
        setLoading(false);
      }
    };

    fetchInquiryDetail();
  }, [inquiryId]);

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;
  if (!inquiry) return <div>문의 데이터가 없습니다.</div>;

  return (
    <div>
      <h2>문의 상세</h2>
      <p><strong>제목:</strong> {inquiry.title}</p>
      <p><strong>내용:</strong></p>
      <p>{inquiry.content}</p>
      <p><strong>상태:</strong> {inquiry.status}</p>

      {inquiry.answer && (
        <>
          <hr />
          <h3>답변</h3>
          <p>{inquiry.answer}</p>
        </>
      )}
    </div>
  );
};

export default InquiryDetailPage;