CREATE TABLE ticket (
    ticket_id BIGINT AUTO_INCREMENT PRIMARY KEY,         -- 고유 ID
    user_id BIGINT NOT NULL,                             -- 판매자 ID
    ticket_category_id BIGINT NOT NULL,                  -- 티켓 카테고리 ID

    event_name VARCHAR(255) NOT NULL,                    -- 공연명
    event_date DATETIME NOT NULL,                        -- 공연 일시

    seat_grade VARCHAR(50),                              -- 등급
    seat_section VARCHAR(100),                           -- 구역
    seat_num VARCHAR(50),                                -- 좌석
    entry_num VARCHAR(50),                               -- 입장 번호

    price INT NOT NULL,                                  -- 가격

    image1 VARCHAR(255),                                 -- 이미지1
    image2 VARCHAR(255),                                 -- 이미지2

    trade_type ENUM('DELIVERY', 'ONSITE', 'OTHER') NOT NULL,   -- 거래 방식
    description TEXT,                                    -- 상세 설명

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,       -- 등록 시간
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- 수정 시간

    status ENUM('ON_SALE', 'SOLD_OUT', 'EXPIRED') NOT NULL -- 티켓 상태
);
