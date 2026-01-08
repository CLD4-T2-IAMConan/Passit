resource "aws_sns_topic" "alertmanager" {
  name = "${var.project_name}-${var.environment}-alerts"

  tags = var.tags
}
