# CloudWatch Integration
############################
# CloudWatch Logs
############################

# Application Log Group
# Fluent Bit에서 사용하는 log_group_name과 반드시 일치
resource "aws_cloudwatch_log_group" "eks_application" {
  name              = "/aws/eks/${var.cluster_name}/application"
  retention_in_days = var.log_retention_days

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-eks-application-logs"
    }
  )
}

############################
# Metric Filter
# ERROR 로그 개수 카운트
############################

resource "aws_cloudwatch_log_metric_filter" "application_error_count" {
  name           = "${var.project_name}-${var.environment}-error-count"
  log_group_name = aws_cloudwatch_log_group.eks_application.name

  # JSON 로그 기준 ERROR 레벨 필터
  # (Fluent Bit / Application 로그 포맷에 맞게 조정 가능)
  pattern = "{ $.level = \"ERROR\" || $.log_level = \"ERROR\" }"

  metric_transformation {
    name      = "ApplicationErrorCount"
    namespace = "${var.project_name}/${var.environment}/Application"
    value     = "1"
  }
}

############################
# CloudWatch Alarm
############################

resource "aws_cloudwatch_metric_alarm" "application_error_alarm" {
  alarm_name          = "${var.project_name}-${var.environment}-application-error-alarm"
  alarm_description   = "Application ERROR log count exceeded threshold"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = aws_cloudwatch_log_metric_filter.application_error_count.metric_transformation[0].name
  namespace           = aws_cloudwatch_log_metric_filter.application_error_count.metric_transformation[0].namespace
  period              = 300
  statistic           = "Sum"
  threshold           = var.application_error_threshold

  treat_missing_data = "notBreaching"

  # SNS 연동
  alarm_actions = var.alarm_sns_topic_arn != null ? [var.alarm_sns_topic_arn] : []
  ok_actions    = var.alarm_sns_topic_arn != null ? [var.alarm_sns_topic_arn] : []

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-application-error-alarm"
    }
  )
}
