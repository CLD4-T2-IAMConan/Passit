-- Switch to passit_db
USE passit_db;

-- Create email_verifications table for account service
CREATE TABLE IF NOT EXISTS `email_verifications` (
    `verification_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '인증 ID',
    `email` VARCHAR(255) NOT NULL COMMENT '이메일',
    `verification_code` VARCHAR(6) NOT NULL COMMENT '인증 코드 (6자리)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
    `expires_at` DATETIME NOT NULL COMMENT '만료 일시',
    `verified` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '인증 완료 여부',
    `verified_at` DATETIME NULL COMMENT '인증 완료 일시',
    PRIMARY KEY (`verification_id`),
    INDEX `idx_email` (`email`),
    INDEX `idx_verification_code` (`verification_code`),
    INDEX `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='이메일 인증 코드';
