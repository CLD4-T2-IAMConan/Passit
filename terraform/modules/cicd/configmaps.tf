# ============================================
# AWS Configuration ConfigMaps for Services
# ============================================
# 각 서비스가 사용하는 AWS 리소스 (SNS/SQS) 정보를 ConfigMap으로 제공
# Terraform이 자동으로 올바른 ARN/URL을 주입하여 하드코딩 방지

# Ticket Service AWS Configuration
resource "kubernetes_config_map_v1" "ticket_aws_config" {
  metadata {
    name      = "ticket-aws-config"
    namespace = "ticket"
  }

  data = {
    AWS_REGION                       = var.region
    SNS_TICKET_EVENTS_TOPIC_ARN      = try(var.sns_ticket_events_topic_arn, "")
    SQS_TICKET_DEAL_EVENTS_QUEUE_URL = try(var.sns_ticket_deal_events_queue_url, "")
  }

  depends_on = [kubernetes_namespace_v1.services]
}

# Chat Service AWS Configuration
resource "kubernetes_config_map_v1" "chat_aws_config" {
  metadata {
    name      = "chat-aws-config"
    namespace = "chat"
  }

  data = {
    AWS_REGION                     = var.region
    SQS_CHAT_DEAL_EVENTS_QUEUE_URL = try(var.sns_chat_deal_events_queue_url, "")
  }

  depends_on = [kubernetes_namespace_v1.services]
}

# Trade Service AWS Configuration
resource "kubernetes_config_map_v1" "trade_aws_config" {
  metadata {
    name      = "trade-aws-config"
    namespace = "trade"
  }

  data = {
    AWS_REGION                        = var.region
    SNS_DEAL_EVENTS_TOPIC_ARN         = try(var.sns_deal_events_topic_arn, "")
    SNS_TICKET_EVENTS_TOPIC_ARN       = try(var.sns_ticket_events_topic_arn, "")
    SNS_PAYMENT_EVENTS_TOPIC_ARN      = try(var.sns_payment_events_topic_arn, "")
    SQS_TRADE_TICKET_EVENTS_QUEUE_URL = try(var.sns_trade_ticket_events_queue_url, "")
  }

  depends_on = [kubernetes_namespace_v1.services]
}
