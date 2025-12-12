-- Switch to passit_db
USE passit_db;

CREATE TABLE chat_members (
    -- PK
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '채팅방 사용자 관계 ID (PK)',

    -- FK
    `user_id` BIGINT NOT NULL COMMENT '사용자 ID (FK: users.id)',
    `chatroom_id` BIGINT NOT NULL COMMENT '채팅방 ID (FK: chat_rooms.chatroom_id)',

    -- 상태 및 기록 정보
    `last_read_message_id` BIGINT NULL COMMENT '마지막으로 읽은 메시지 ID (FK: chat_messages.message_id). NULL 가능',
    `is_deleted` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '채팅방 삭제(숨김) 여부',

    -- 복합 유니크 키 (한 사용자가 한 방에 중복해서 들어갈 수 없도록 함)
    UNIQUE KEY `uk_user_chatroom` (user_id, chatroom_id)

    -- 필요에 따라 외래 키 제약 조건 추가
    -- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    -- FOREIGN KEY (chatroom_id) REFERENCES chat_rooms(chatroom_id) ON DELETE CASCADE,
    -- FOREIGN KEY (last_read_message_id) REFERENCES chat_messages(id)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci
COMMENT='채팅방 사용자 관계 테이블';