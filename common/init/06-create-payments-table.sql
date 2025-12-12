-- PAYMENTS 테이블 생성
-- 거래의 결제 및 환불 정보를 저장합니다.
USE passit_db;

CREATE TABLE payments (
    -- 기본 키 (Primary Key) 및 AUTO_INCREMENT 속성 추가
    payment_id BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,

    -- 외래 키 (Foreign Key)
    deal_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,

    -- 거래 금액 (DECIMAL(10, 0) 또는 DECIMAL(10, 2)를 사용합니다.
    -- ERD에 따라 DECIMAL(10, 0)으로 명시)
    price DECIMAL(10, 0) NOT NULL,

    payment_status VARCHAR(50) NOT NULL COMMENT '(WAIT_PAY, PAID, CANCELLED)',
    payment_date DATETIME NOT NULL,

    completion_date DATETIME NULL,

    payment_method VARCHAR(50) NOT NULL,

    refund_amount DECIMAL(10, 0) NULL,
    refund_reason VARCHAR(255) NULL,
    refund_date DATETIME NULL,

    cancel_payment_reason VARCHAR(255) NULL,

    pg_tid VARCHAR(100) NULL,
    pg_status VARCHAR(50) NULL,

    -- deal 및 user 테이블에 대한 FK 설정
    FOREIGN KEY (deal_id) REFERENCES deal(deal_id),
    FOREIGN KEY (buyer_id) REFERENCES users(user_id),
    FOREIGN KEY (seller_id) REFERENCES users(user_id)
);