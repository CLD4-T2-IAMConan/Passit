-- Switch to passit_db
USE passit_db;

-- Create users table for account service
CREATE TABLE IF NOT EXISTS `chat_rooms`(
    -- PK
    `chatroom_id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '채팅방 ID (기본 키)',

    -- FK
    `ticket_id` BIGINT NOT NULL COMMENT '티켓 ID (FK)',
    `buyer_id` BIGINT NOT NULL COMMENT '구매자 ID (FK)',
    `last_message_id` BIGINT NOT NULL COMMENT '마지막 메시지 ID (FK)',

    -- 시간 정보
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '채팅방 생성일',
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 메시지 수신 시간',

    -- 상태 정보 (ENUM 타입)
    `room_status` ENUM('OPEN', 'LOCK') NOT NULL COMMENT '채팅방 상태 (OPEN, LOCK 등)',
    `deal_status` ENUM('PENDING', 'REQUESTED', 'REJECTED', 'ACCEPTED') NOT NULL COMMENT '거래 진행 상태 (PENDING, REQUESTED 등)',

    -- 필요에 따라 외래 키 제약 조건 추가
    -- Foreign Key constraints (주석 처리됨. 실제 참조할 테이블이 필요함)
    -- FOREIGN KEY (ticket_id) REFERENCES ticket(id),
    -- FOREIGN KEY (buyer_id) REFERENCES users(id),
    -- FOREIGN KEY (last_message_id) REFERENCES chat_messages(id)

    -- 인덱스 추가
    INDEX `idx_ticket_id` (`ticket_id``),
    INDEX `idx_buyer_id` (`buyer_id``)
); ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='채팅방 메인 정보 테이블';