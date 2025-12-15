-- CATEGORIES 테이블 생성
-- 티켓 카테고리 정보를 저장합니다.
USE passit_db;

CREATE TABLE IF NOT EXISTS categories (
    ticket_category_id BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '티켓 카테고리 ID',
    large_name VARCHAR(50) NOT NULL COMMENT '대분류',
    middle_name VARCHAR(50) NULL COMMENT '중분류',
    small_name VARCHAR(50) NULL COMMENT '소분류',
    is_visible CHAR(1) NOT NULL DEFAULT 'Y' COMMENT '노출여부',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='티켓 카테고리 테이블';
