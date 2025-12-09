-- Switch to passit_db
USE passit_db;

-- Create users table for account service
CREATE TABLE IF NOT EXISTS `users` (
    `user_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '유저 고유 ID(AUTO_INCREMENT)',
    `email` VARCHAR(255) NOT NULL COMMENT '이메일 (UNIQUE)',
    `password` VARCHAR(255) NOT NULL COMMENT '해시된 비밀번호',
    `name` VARCHAR(50) NOT NULL COMMENT '실명',
    `role` ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER' COMMENT '유저 / 관리자',
    `status` ENUM('ACTIVE','SUSPENDED','DELETED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '회원 정보 최종 수정일',
    `deleted_at` DATETIME NULL COMMENT '탈퇴일 / 회원 탈퇴 시 기록',
    `nickname` VARCHAR(50) NULL COMMENT '프로필 닉네임(UNIQUE)',
    `profile_image_url` VARCHAR(255) NULL COMMENT '추후 S3 Key 넣기',
    `provider` ENUM('KAKAO','NAVER','GOOGLE') NULL COMMENT '소셜 로그인 사용 시',
    `refresh_token` VARCHAR(255) NULL COMMENT '자동 로그인 가능하도록',
    `last_login_at` DATETIME NULL COMMENT '마지막 로그인 시간',
    PRIMARY KEY (`user_id`),
    UNIQUE KEY `unique_email` (`email`),
    UNIQUE KEY `unique_nickname` (`nickname`),
    INDEX `idx_email` (`email`),
    INDEX `idx_status` (`status`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 정보 테이블';
