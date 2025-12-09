-- Create single shared database for all services
CREATE DATABASE IF NOT EXISTS passit_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant privileges to passit_user
GRANT ALL PRIVILEGES ON passit_db.* TO 'passit_user'@'%';

FLUSH PRIVILEGES;

-- Table naming convention:
-- Each service should use a prefix for their tables:
-- - account_*   (e.g., account_users, account_sessions)
-- - chat_*      (e.g., chat_messages, chat_rooms)
-- - cs_*        (e.g., cs_tickets, cs_responses)
-- - ticket_*    (e.g., ticket_events, ticket_purchases)
-- - trade_*     (e.g., trade_orders, trade_transactions)
