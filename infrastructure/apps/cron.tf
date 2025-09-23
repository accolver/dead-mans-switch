# Google Cloud Scheduler Jobs for KeyFate Dead Man's Switch
# These jobs replace the manual trigger-reminders.sh script

locals {}

# Cloud Scheduler job to check and send reminders every 5 minutes
resource "google_cloud_scheduler_job" "process_reminders" {
  name        = "keyfate-process-reminders-${var.env}"
  description = "Check and send reminders for KeyFate dead man's switch"
  schedule    = "*/5 * * * *" # Every 5 minutes
  project     = module.project.id

  http_target {
    http_method = "POST"
    uri         = "${var.next_public_site_url}/api/cron/process-reminders"

    headers = {
      "Authorization" = "Bearer ${var.cron_secret}"
      "Content-Type"  = "application/json"
    }

    # Empty body for POST request
    body = base64encode("{}")
  }

  # Retry configuration
  retry_config {
    retry_count          = 3
    max_retry_duration   = "60s"
    min_backoff_duration = "5s"
    max_backoff_duration = "30s"
    max_doublings        = 2
  }

  # Timeout configuration
  time_zone = "UTC"
}

# Cloud Scheduler job to check and trigger secrets every 5 minutes
resource "google_cloud_scheduler_job" "check_secrets" {
  name        = "keyfate-check-secrets-${var.env}"
  description = "Check and trigger secrets for KeyFate dead man's switch"
  schedule    = "*/5 * * * *" # Every 5 minutes
  project     = module.project.id

  http_target {
    http_method = "POST"
    uri         = "${var.next_public_site_url}/api/cron/check-secrets"

    headers = {
      "Authorization" = "Bearer ${var.cron_secret}"
      "Content-Type"  = "application/json"
    }

    # Empty body for POST request
    body = base64encode("{}")
  }

  # Retry configuration
  retry_config {
    retry_count          = 3
    max_retry_duration   = "60s"
    min_backoff_duration = "5s"
    max_backoff_duration = "30s"
    max_doublings        = 2
  }

  # Timeout configuration
  time_zone = "UTC"
}
