-- Switch to passit_db
USE passit_db;

-- Create activities table for user activity history
CREATE TABLE IF NOT EXISTS `activities` (
    `activity_id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '기본키(AUTO_INCREMENT)',
    `user_id` BIGINT NOT NULL COMMENT '유저 고유 ID',
    `related_user_id` BIGINT NULL COMMENT '후기 작성자/상대 판매자 등',
    `activity_type` ENUM('PURCHASE', 'SALE', 'LIKE', 'REVIEW') NOT NULL COMMENT '활동 유형',
    `rating` INT NULL COMMENT '평점 (1-5)',
    `comment` TEXT NULL COMMENT '후기 내용',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    
    -- 인덱스
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_related_user_id` (`related_user_id`),
    INDEX `idx_activity_type` (`activity_type`),
    INDEX `idx_created_at` (`created_at`),
    
    -- 외래 키 (선택적)
    -- FOREIGN KEY (user_id) REFERENCES users(user_id),
    -- FOREIGN KEY (related_user_id) REFERENCES users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 활동 내역 테이블';
