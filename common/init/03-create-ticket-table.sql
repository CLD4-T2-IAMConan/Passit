-- TICKET 테이블 생성
-- 티켓 정보를 저장합니다.
USE passit_db;

CREATE TABLE IF NOT EXISTS ticket (
    -- 기본 키 (Primary Key) 및 AUTO_INCREMENT 속성
    ticket_id BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,

    -- 티켓 기본 정보
    event_name VARCHAR(255) NOT NULL COMMENT '이벤트/공연 이름',
    event_date DATETIME NOT NULL COMMENT '이벤트 날짜',
    event_location VARCHAR(255) NOT NULL COMMENT '이벤트 장소',

    -- 소유자 정보
    owner_id BIGINT NOT NULL COMMENT '티켓 소유자 ID',

    -- 티켓 상태
    ticket_status ENUM('AVAILABLE', 'RESERVED', 'SOLD', 'USED', 'EXPIRED') NOT NULL DEFAULT 'AVAILABLE',

    -- 가격 정보
    original_price DECIMAL(10, 0) NOT NULL COMMENT '원래 가격',
    selling_price DECIMAL(10, 0) NULL COMMENT '판매 가격',

    -- 티켓 상세 정보
    seat_info VARCHAR(100) NULL COMMENT '좌석 정보',
    ticket_type VARCHAR(50) NULL COMMENT '티켓 종류',

    -- 카테고리
    category_id BIGINT NOT NULL COMMENT '카테고리 ID',

    -- 이미지(선택 사항)
    image1 VARCHAR(255) NULL COMMENT '이미지1 경로',
    image2 VARCHAR(255) NULL COMMENT '이미지2 경로',

    -- 상세 설명(선택 사항)
    description TEXT NULL COMMENT '티켓 상세 설명',

    -- 거래 방식 ENUM
    trade_type ENUM('DELIVERY', 'ONSITE', 'OTHER') NOT NULL COMMENT '거래 방식',


    -- 타임스탬프
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- 외래 키 설정
    FOREIGN KEY (owner_id) REFERENCES users(user_id),
    FOREIGN KEY (category_id) REFERENCES category(id),

    -- 인덱스
    INDEX idx_owner_id (owner_id),
    INDEX idx_category_id (category_id),
    INDEX idx_ticket_status (ticket_status),
    INDEX idx_event_date (event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='티켓 정보 테이블';
