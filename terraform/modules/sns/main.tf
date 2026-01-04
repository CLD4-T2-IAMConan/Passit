# SNS Module - Amazon SNS Topics and SQS Queues for Event-Driven Architecture

# ============================================
# SNS Topics
# ============================================

# User Events Topic
resource "aws_sns_topic" "user_events" {
  name              = "${var.project_name}-${var.environment}-user-events"
  display_name      = "Passit User Events"
  kms_master_key_id = var.kms_key_id

  tags = {
    Name        = "${var.project_name}-${var.environment}-user-events"
    Project     = var.project_name
    Environment = var.environment
    Team        = var.team
    Owner       = var.owner
  }
}

# Ticket Events Topic
resource "aws_sns_topic" "ticket_events" {
  name              = "${var.project_name}-${var.environment}-ticket-events"
  display_name      = "Passit Ticket Events"
  kms_master_key_id = var.kms_key_id

  tags = {
    Name        = "${var.project_name}-${var.environment}-ticket-events"
    Project     = var.project_name
    Environment = var.environment
    Team        = var.team
    Owner       = var.owner
  }
}

# Deal Events Topic
resource "aws_sns_topic" "deal_events" {
  name              = "${var.project_name}-${var.environment}-deal-events"
  display_name      = "Passit Deal Events"
  kms_master_key_id = var.kms_key_id

  tags = {
    Name        = "${var.project_name}-${var.environment}-deal-events"
    Project     = var.project_name
    Environment = var.environment
    Team        = var.team
    Owner       = var.owner
  }
}

# Payment Events Topic
resource "aws_sns_topic" "payment_events" {
  name              = "${var.project_name}-${var.environment}-payment-events"
  display_name      = "Passit Payment Events"
  kms_master_key_id = var.kms_key_id

  tags = {
    Name        = "${var.project_name}-${var.environment}-payment-events"
    Project     = var.project_name
    Environment = var.environment
    Team        = var.team
    Owner       = var.owner
  }
}

# Chat Events Topic
resource "aws_sns_topic" "chat_events" {
  name              = "${var.project_name}-${var.environment}-chat-events"
  display_name      = "Passit Chat Events"
  kms_master_key_id = var.kms_key_id

  tags = {
    Name        = "${var.project_name}-${var.environment}-chat-events"
    Project     = var.project_name
    Environment = var.environment
    Team        = var.team
    Owner       = var.owner
  }
}

# ============================================
# SQS Queues for Subscribers
# ============================================

# Service Chat Queue (subscribes to deal-events)
resource "aws_sqs_queue" "chat_deal_events" {
  name                       = "${var.project_name}-${var.environment}-chat-deal-events"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 1209600 # 14 days
  receive_wait_time_seconds  = 20      # Long polling

  tags = {
    Name        = "${var.project_name}-${var.environment}-chat-deal-events"
    Project     = var.project_name
    Environment = var.environment
    Team        = var.team
    Owner       = var.owner
  }
}

# Dead Letter Queue for Chat
resource "aws_sqs_queue" "chat_deal_events_dlq" {
  name                      = "${var.project_name}-${var.environment}-chat-deal-events-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name        = "${var.project_name}-${var.environment}-chat-deal-events-dlq"
    Project     = var.project_name
    Environment = var.environment
    Team        = var.team
    Owner       = var.owner
  }
}

# Redrive policy for Chat Queue
resource "aws_sqs_queue_redrive_policy" "chat_deal_events" {
  queue_url = aws_sqs_queue.chat_deal_events.id
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.chat_deal_events_dlq.arn
    maxReceiveCount     = 3
  })
}

# Service Ticket Queue (subscribes to deal-events)
resource "aws_sqs_queue" "ticket_deal_events" {
  name                       = "${var.project_name}-${var.environment}-ticket-deal-events"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 1209600
  receive_wait_time_seconds  = 20

  tags = {
    Name        = "${var.project_name}-${var.environment}-ticket-deal-events"
    Project     = var.project_name
    Environment = var.environment
    Team        = var.team
    Owner       = var.owner
  }
}

# Dead Letter Queue for Ticket
resource "aws_sqs_queue" "ticket_deal_events_dlq" {
  name                      = "${var.project_name}-${var.environment}-ticket-deal-events-dlq"
  message_retention_seconds = 1209600

  tags = {
    Name        = "${var.project_name}-${var.environment}-ticket-deal-events-dlq"
    Project     = var.project_name
    Environment = var.environment
    Team        = var.team
    Owner       = var.owner
  }
}

# Redrive policy for Ticket Queue
resource "aws_sqs_queue_redrive_policy" "ticket_deal_events" {
  queue_url = aws_sqs_queue.ticket_deal_events.id
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.ticket_deal_events_dlq.arn
    maxReceiveCount     = 3
  })
}

# Service Trade Queue (subscribes to ticket-events)
resource "aws_sqs_queue" "trade_ticket_events" {
  name                       = "${var.project_name}-${var.environment}-trade-ticket-events"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 1209600
  receive_wait_time_seconds  = 20

  tags = {
    Name        = "${var.project_name}-${var.environment}-trade-ticket-events"
    Project     = var.project_name
    Environment = var.environment
    Team        = var.team
    Owner       = var.owner
  }
}

# Dead Letter Queue for Trade
resource "aws_sqs_queue" "trade_ticket_events_dlq" {
  name                      = "${var.project_name}-${var.environment}-trade-ticket-events-dlq"
  message_retention_seconds = 1209600

  tags = {
    Name        = "${var.project_name}-${var.environment}-trade-ticket-events-dlq"
    Project     = var.project_name
    Environment = var.environment
    Team        = var.team
    Owner       = var.owner
  }
}

# Redrive policy for Trade Queue
resource "aws_sqs_queue_redrive_policy" "trade_ticket_events" {
  queue_url = aws_sqs_queue.trade_ticket_events.id
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.trade_ticket_events_dlq.arn
    maxReceiveCount     = 3
  })
}

# ============================================
# SNS Topic Subscriptions
# ============================================

# Chat service subscribes to deal-events
resource "aws_sns_topic_subscription" "chat_deal_events" {
  topic_arn = aws_sns_topic.deal_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.chat_deal_events.arn
}

# Ticket service subscribes to deal-events
resource "aws_sns_topic_subscription" "ticket_deal_events" {
  topic_arn = aws_sns_topic.deal_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.ticket_deal_events.arn
}

# Trade service subscribes to ticket-events
resource "aws_sns_topic_subscription" "trade_ticket_events" {
  topic_arn = aws_sns_topic.ticket_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.trade_ticket_events.arn
}

# ============================================
# SQS Queue Policies (Allow SNS to send messages)
# ============================================

resource "aws_sqs_queue_policy" "chat_deal_events" {
  queue_url = aws_sqs_queue.chat_deal_events.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.chat_deal_events.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.deal_events.arn
          }
        }
      }
    ]
  })
}

resource "aws_sqs_queue_policy" "ticket_deal_events" {
  queue_url = aws_sqs_queue.ticket_deal_events.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.ticket_deal_events.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.deal_events.arn
          }
        }
      }
    ]
  })
}

resource "aws_sqs_queue_policy" "trade_ticket_events" {
  queue_url = aws_sqs_queue.trade_ticket_events.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.trade_ticket_events.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.ticket_events.arn
          }
        }
      }
    ]
  })
}

