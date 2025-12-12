-- Switch to passit_db
USE passit_db;

CREATE TABLE chat_messages (
    -- PK
    `message_id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '메시지 ID (PK)',

    -- FK
    `chatroom_id` BIGINT NOT NULL COMMENT '채팅방 ID (FK: chat_rooms.chatroom_id)',
    `sender_id` BIGINT NOT NULL COMMENT '메시지 발신자 ID (FK: users.id)',

    -- 메시지 내용 및 타입
    `type` ENUM('TEXT', 'SYSTEM_ACTION_MESSAGE', 'SYSTEM_INFO_MESSAGE') NOT NULL COMMENT '메시지 타입 (TEXT, SYSTEM_ACTION_MESSAGE, SYSTEM_INFO_MESSAGE)',
    `content` TEXT NOT NULL COMMENT '메시지 내용 (TEXT 타입으로 길게 저장)',

    -- 시간 및 시스템 정보
    `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '메시지 전송 시각',
    `metadata` JSON NULL COMMENT '시스템 메시지 정보 및 기타 메타데이터 (NULL 가능)',

    -- 인덱스 추가 (채팅방별 메시지 조회 성능 향상)
    INDEX `idx_chatroom_sent_at` (`chatroom_id`, `sent_at`),
    INDEX `idx_sender_id` (`sender_id`)

    -- 필요에 따라 외래 키 제약 조건 추가
    -- FOREIGN KEY (chatroom_id) REFERENCES chat_rooms(chatroom_id) ON DELETE CASCADE,
    -- FOREIGN KEY (sender_id) REFERENCES users(id)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci
COMMENT='채팅 메시지 테이블';