-- CATEGORIES 테이블 생성
-- 티켓 카테고리 정보를 계층형 구조로 저장합니다.
USE passit_db;

-- 기존 테이블이 있다면 삭제
DROP TABLE IF EXISTS categories;

CREATE TABLE categories (
    id BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '카테고리 ID',
    name VARCHAR(100) NOT NULL COMMENT '카테고리 이름',
    depth INT NOT NULL COMMENT '깊이 (1:대분류, 2:중분류, 3:소분류)',
    parent_id BIGINT NULL COMMENT '부모 카테고리 ID',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_parent_id (parent_id),
    INDEX idx_depth (depth)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='티켓 카테고리 테이블 (계층형 구조)';
