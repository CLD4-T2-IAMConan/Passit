# SNS Topic ARNs
output "user_events_topic_arn" {
  description = "ARN of the user events SNS topic"
  value       = aws_sns_topic.user_events.arn
}

output "ticket_events_topic_arn" {
  description = "ARN of the ticket events SNS topic"
  value       = aws_sns_topic.ticket_events.arn
}

output "deal_events_topic_arn" {
  description = "ARN of the deal events SNS topic"
  value       = aws_sns_topic.deal_events.arn
}

output "payment_events_topic_arn" {
  description = "ARN of the payment events SNS topic"
  value       = aws_sns_topic.payment_events.arn
}

output "chat_events_topic_arn" {
  description = "ARN of the chat events SNS topic"
  value       = aws_sns_topic.chat_events.arn
}

# SQS Queue URLs
output "chat_deal_events_queue_url" {
  description = "URL of the chat service deal events queue"
  value       = aws_sqs_queue.chat_deal_events.url
}

output "ticket_deal_events_queue_url" {
  description = "URL of the ticket service deal events queue"
  value       = aws_sqs_queue.ticket_deal_events.url
}

output "trade_ticket_events_queue_url" {
  description = "URL of the trade service ticket events queue"
  value       = aws_sqs_queue.trade_ticket_events.url
}

# SQS Queue ARNs
output "chat_deal_events_queue_arn" {
  description = "ARN of the chat service deal events queue"
  value       = aws_sqs_queue.chat_deal_events.arn
}

output "ticket_deal_events_queue_arn" {
  description = "ARN of the ticket service deal events queue"
  value       = aws_sqs_queue.ticket_deal_events.arn
}

output "trade_ticket_events_queue_arn" {
  description = "ARN of the trade service ticket events queue"
  value       = aws_sqs_queue.trade_ticket_events.arn
}

