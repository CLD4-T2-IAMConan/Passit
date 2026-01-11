############################################
# CloudWatch Logs - Retention Policy
############################################

locals {
  log_retention_days = {
    prod = 30
    dev  = 7
    dr   = 7
  }
}

############################################
# CloudWatch Logs - Log Group (Application)
############################################

resource "aws_cloudwatch_log_group" "eks_application" {
  name              = "/eks/${var.project_name}/${var.environment}/application"
  retention_in_days = local.log_retention_days[var.environment]

  tags = merge(
    var.tags,
    {
      Project     = var.project_name
      Environment = var.environment
      Component   = "application-logs"
      ManagedBy   = "terraform"
    }
  )
}

#############################################
# CloudWatch Logs - Metric Filters
#############################################

# 1️⃣ ERROR / Exception 로그 발생
resource "aws_cloudwatch_log_metric_filter" "error_exception_logs" {
  name           = "error-exception-log-filter-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.eks_application.name

  pattern = "?ERROR ?Error ?Exception ?EXCEPTION ?RuntimeException"

  metric_transformation {
    name      = "ErrorExceptionCount"
    namespace = "Passit/Logs"
    value     = "1"
  }
}

# 2️⃣ Crash / Fail / OOM 탐지
resource "aws_cloudwatch_log_metric_filter" "crash_fail_logs" {
  name           = "crash-fail-log-filter-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.eks_application.name

  pattern = "?Crash ?CRASH ?Fail ?FAIL ?Failed ?FAILED ?Killed ?KILLED ?OOM ?OutOfMemory"

  metric_transformation {
    name      = "CrashFailCount"
    namespace = "Passit/Logs"
    value     = "1"
  }
}

# 3️⃣ 특정 서비스 에러 로그 폭증
resource "aws_cloudwatch_log_metric_filter" "service_account_errors" {
  name           = "service-account-error-filter-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.eks_application.name

  pattern = "\"service-account\" ?ERROR ?Error ?Exception"

  metric_transformation {
    name      = "ServiceAccountErrorCount"
    namespace = "Passit/Logs"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "service_chat_errors" {
  name           = "service-chat-error-filter-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.eks_application.name

  pattern = "\"service_chat-service\" ?ERROR ?Error ?Exception"

  metric_transformation {
    name      = "ServiceChatErrorCount"
    namespace = "Passit/Logs"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "trade_service_errors" {
  name           = "trade-service-error-filter-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.eks_application.name

  pattern = "\"trade-service\" ?ERROR ?Error ?Exception"

  metric_transformation {
    name      = "TradeServiceErrorCount"
    namespace = "Passit/Logs"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "ticket_service_errors" {
  name           = "ticket-service-error-filter-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.eks_application.name

  pattern = "\"ticketservice-service\" ?ERROR ?Error ?Exception"

  metric_transformation {
    name      = "TicketServiceErrorCount"
    namespace = "Passit/Logs"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "cs_service_errors" {
  name           = "cs-service-error-filter-${var.environment}"
  log_group_name = aws_cloudwatch_log_group.eks_application.name

  pattern = "\"cs-service\" ?ERROR ?Error ?Exception"

  metric_transformation {
    name      = "CsServiceErrorCount"
    namespace = "Passit/Logs"
    value     = "1"
  }
}


#############################################
# CloudWatch Alarms
#############################################

# ERROR / Exception 알람
resource "aws_cloudwatch_metric_alarm" "error_exception_alarm" {
  alarm_name          = "passit-${var.environment}-log-error-exception"
  alarm_description   = "ERROR / Exception logs detected"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1

  namespace   = "Passit/Logs"
  metric_name = "ErrorExceptionCount"
  period      = 60
  statistic   = "Sum"
  threshold   = 5

  treat_missing_data = "notBreaching"
  alarm_actions = [aws_sns_topic.alertmanager.arn]
}

# Crash / Fail 즉시 알람
resource "aws_cloudwatch_metric_alarm" "crash_fail_alarm" {
  alarm_name          = "passit-${var.environment}-log-crash-fail"
  alarm_description   = "Crash / Fail / OOM detected"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1

  namespace   = "Passit/Logs"
  metric_name = "CrashFailCount"
  period      = 60
  statistic   = "Sum"
  threshold   = 1

  treat_missing_data = "notBreaching"
  alarm_actions = [aws_sns_topic.alertmanager.arn]
}

# 특정 서비스 에러 폭증 알람
resource "aws_cloudwatch_metric_alarm" "service_account_error_alarm" {
  alarm_name          = "passit-${var.environment}-service-account-error-spike"
  alarm_description   = "Service-account ERROR spike"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1

  namespace   = "Passit/Logs"
  metric_name = "ServiceAccountErrorCount"
  period      = 60
  statistic   = "Sum"
  threshold   = 3

  treat_missing_data = "notBreaching"
  alarm_actions = [aws_sns_topic.alertmanager.arn]
}

resource "aws_cloudwatch_metric_alarm" "service_chat_error_alarm" {
  alarm_name          = "passit-${var.environment}-service-chat-error-spike"
  alarm_description   = "Service-chat ERROR spike"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1

  namespace   = "Passit/Logs"
  metric_name = "ServiceChatErrorCount"
  period      = 60
  statistic   = "Sum"
  threshold   = 3

  treat_missing_data = "notBreaching"
  alarm_actions = [aws_sns_topic.alertmanager.arn]
}

resource "aws_cloudwatch_metric_alarm" "trade_service_error_alarm" {
  alarm_name          = "passit-${var.environment}-trade-service-error-spike"
  alarm_description   = "Trade-service ERROR spike"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1

  namespace   = "Passit/Logs"
  metric_name = "TradeServiceErrorCount"
  period      = 60
  statistic   = "Sum"
  threshold   = 3

  treat_missing_data = "notBreaching"
  alarm_actions = [aws_sns_topic.alertmanager.arn]
}

resource "aws_cloudwatch_metric_alarm" "ticket_service_error_alarm" {
  alarm_name          = "passit-${var.environment}-ticket-service-error-spike"
  alarm_description   = "Ticket service ERROR spike"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1

  namespace   = "Passit/Logs"
  metric_name = "TicketServiceErrorCount"
  period      = 60
  statistic   = "Sum"
  threshold   = 3

  treat_missing_data = "notBreaching"
  alarm_actions = [aws_sns_topic.alertmanager.arn]
}

resource "aws_cloudwatch_metric_alarm" "cs_service_error_alarm" {
  alarm_name          = "passit-${var.environment}-cs-service-error-spike"
  alarm_description   = "CS-service ERROR spike"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1

  namespace   = "Passit/Logs"
  metric_name = "CsServiceErrorCount"
  period      = 60
  statistic   = "Sum"
  threshold   = 3

  treat_missing_data = "notBreaching"
  alarm_actions = [aws_sns_topic.alertmanager.arn]
}


# 4️⃣ 로그 발생량 급증 (CloudWatch 기본 메트릭)
resource "aws_cloudwatch_metric_alarm" "log_volume_spike_alarm" {
  alarm_name          = "passit-${var.environment}-log-volume-spike"
  alarm_description   = "Log volume spike detected"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1

  namespace   = "AWS/Logs"
  metric_name = "IncomingLogEvents"
  period      = 60
  statistic   = "Sum"
  threshold   = 10000

  dimensions = {
    LogGroupName = aws_cloudwatch_log_group.eks_application.name
  }

  treat_missing_data = "notBreaching"
  alarm_actions = [aws_sns_topic.alertmanager.arn]
}
