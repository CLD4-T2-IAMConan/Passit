-- Switch to passit_db
USE passit_db;

-- Create notifications table
CREATE TABLE IF NOT EXISTS `notifications` (
    -- PK
    `noti_id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '알림 ID (기본 키)',

    -- FK
    `user_id` BIGINT NOT NULL COMMENT '알림 대상 사용자 ID (FK)',

    -- 알림 유형
    `type` ENUM('deal_request', 'deal_accept', 'deal_reject', 'payment_request', 'chat', 'system')
        NOT NULL COMMENT '알림 유형 (양도 요청, 양도 수락, 양도 거절, 결제 요청, 채팅, 시스템 메시지)',

    -- 알림 내용
    `message` TEXT NULL COMMENT '알림 메시지 내용',

    -- 읽음 여부
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '알림 읽음 여부',

    -- 생성일
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '알림 생성일',

    -- 필요 시 FK 추가 가능
    -- FOREIGN KEY (user_id) REFERENCES users(id)

    -- 인덱스 추가
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_type` (`type`),
    INDEX `idx_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 알림 테이블';
