-- DEAL 테이블 생성 (AUTO_INCREMENT 속성 추가)
-- 구매자의 양도 요청 정보를 저장합니다.
USE passit_db;

CREATE TABLE deal (
    -- 기본 키 (Primary Key) 및 AUTO_INCREMENT 속성 추가
    deal_id BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,

    -- 외래 키 (Foreign Key)
    ticket_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,

    deal_at DATETIME NOT NULL,

    -- ENUM 값은 예시입니다. 실제 사용하시는 값으로 수정해야 합니다.
    deal_status ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'PAID', 'CANCELED', 'EXPIRED') NOT NULL,

    quantity INT NOT NULL,
    expire_at DATETIME NOT NULL,
    cancel_reason VARCHAR(255) NULL,

    -- user와 ticket 테이블에 대한 FK 설정
    FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_id),
    FOREIGN KEY (buyer_id) REFERENCES users(user_id),
    FOREIGN KEY (seller_id) REFERENCES users(user_id)
);