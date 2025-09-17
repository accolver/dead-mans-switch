# Google Cloud Scheduler Jobs for KeyFate Dead Man's Switch
# These jobs replace the manual trigger-reminders.sh script

locals {
  # Ensure Supabase URL starts with https:// for Cloud Scheduler compatibility
  base_supabase_url = var.next_public_supabase_url != "" ? (
    startswith(var.next_public_supabase_url, "https://") ? var.next_public_supabase_url :
    startswith(var.next_public_supabase_url, "http://") ? replace(var.next_public_supabase_url, "http://", "https://") :
    "https://${var.next_public_supabase_url}"
  ) : "https://placeholder.supabase.co"

  # Construct the Supabase functions URL with validated HTTPS
  supabase_functions_url = "${local.base_supabase_url}/functions/v1"

  # Common headers for all requests
  common_headers = {
    "Authorization" = "Bearer ${var.supabase_service_role_key}"
    "Content-Type"  = "application/json"
  }
}

# Cloud Scheduler job to check and send reminders every 5 minutes
resource "google_cloud_scheduler_job" "process_reminders" {
  name        = "keyfate-process-reminders-${var.env}"
  description = "Check and send reminders for KeyFate dead man's switch"
  schedule    = "*/5 * * * *" # Every 5 minutes
  project     = module.project.id

  http_target {
    http_method = "POST"
    uri         = "${local.supabase_functions_url}/process-reminders"

    headers = local.common_headers

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
    uri         = "${local.supabase_functions_url}/check-secrets"

    headers = local.common_headers

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
