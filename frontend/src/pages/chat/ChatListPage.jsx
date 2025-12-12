import React, { useEffect, useState } from "react";
import ChatRoomList from "../../components/chat/ChatRoomList";
import { getChatRooms, createChatRoom } from "../../api/services/chat/chat.api";
import { useLocation, useNavigate } from "react-router-dom";



const ChatListPage = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    const userId = 1;
    // 티켓 상세 페이지에서 받을 값
    // location.state 를 사용할 준비는 해두고 fallback 값은 임시 하드코딩
    const ticketId = location.state?.ticketId ?? 33;
    const buyerId = location.state?.buyerId ?? 101;  // 로그인 사용자

    const loadChatRooms = async () => {
        try {
            setLoading(true);
            const response = await getChatRooms(userId);
            setRooms(response.data);
        } catch (err) {
            console.error("채팅방 목록 조회 실패:", err);
        } finally {
            setLoading(false);
        }
    };

    /** 채팅방 생성 */ // 완료
    const handleCreateRoom = async () => {
        try {
            const newRoom = await createChatRoom({
                ticketId: ticketId,
                buyerId: buyerId
            });
            console.log("📌 채팅방 생성 성공:", newRoom);
            // 생성 직후 채팅방으로 이동시키기
            navigate(`/chat/rooms/${newRoom.chatroomId}`);
        } catch (e) {
            console.error("채팅방 생성 실패", e);
        }
    };

    useEffect(() => {
        loadChatRooms();
    }, [userId]); // userId가 바뀌면 다시 호출

    const handleSelectRoom = (roomId) => {
        window.location.href = `/chat/${roomId}`; // 라우팅 방식에 따라 변경 가능
    };

    return (
        <div style={{ padding: "24px" }}>
            <h2>채팅 목록</h2>
            {loading ? (
                <div>로딩 중...</div>
            ) : (
            <ChatRoomList rooms={rooms} onSelectRoom={handleSelectRoom} />
            )}
            {/* 개발용: 채팅방 수동 생성 버튼 */}
            <button onClick={handleCreateRoom} style={{ marginBottom: "12px" }}>
                채팅방 생성
            </button>
        </div>
    );
};

export default ChatListPage;
