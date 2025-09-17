# Test for Cloud Scheduler URL validation
# This demonstrates that the URLs will be properly formatted as HTTPS

variable "test_supabase_url_1" {
  default = "https://example.supabase.co"
}

variable "test_supabase_url_2" {
  default = "http://example.supabase.co"
}

variable "test_supabase_url_3" {
  default = "example.supabase.co"
}

variable "test_supabase_url_4" {
  default = ""
}

# Test the URL validation logic from cron.tf
locals {
  test_urls = {
    test1 = var.test_supabase_url_1 != "" ? (
      startswith(var.test_supabase_url_1, "https://") ? var.test_supabase_url_1 :
      startswith(var.test_supabase_url_1, "http://") ? replace(var.test_supabase_url_1, "http://", "https://") :
      "https://${var.test_supabase_url_1}"
    ) : "https://placeholder.supabase.co"

    test2 = var.test_supabase_url_2 != "" ? (
      startswith(var.test_supabase_url_2, "https://") ? var.test_supabase_url_2 :
      startswith(var.test_supabase_url_2, "http://") ? replace(var.test_supabase_url_2, "http://", "https://") :
      "https://${var.test_supabase_url_2}"
    ) : "https://placeholder.supabase.co"

    test3 = var.test_supabase_url_3 != "" ? (
      startswith(var.test_supabase_url_3, "https://") ? var.test_supabase_url_3 :
      startswith(var.test_supabase_url_3, "http://") ? replace(var.test_supabase_url_3, "http://", "https://") :
      "https://${var.test_supabase_url_3}"
    ) : "https://placeholder.supabase.co"

    test4 = var.test_supabase_url_4 != "" ? (
      startswith(var.test_supabase_url_4, "https://") ? var.test_supabase_url_4 :
      startswith(var.test_supabase_url_4, "http://") ? replace(var.test_supabase_url_4, "http://", "https://") :
      "https://${var.test_supabase_url_4}"
    ) : "https://placeholder.supabase.co"
  }
}

# Output the test results
output "url_validation_tests" {
  value = {
    "https_url_stays_https" = local.test_urls.test1   # Should be: https://example.supabase.co
    "http_becomes_https"    = local.test_urls.test2   # Should be: https://example.supabase.co
    "plain_gets_https"      = local.test_urls.test3   # Should be: https://example.supabase.co
    "empty_gets_placeholder" = local.test_urls.test4  # Should be: https://placeholder.supabase.co
  }
}

# Validation assertions - these should always be true
output "validation_checks" {
  value = {
    all_urls_start_with_https = alltrue([
      for url in values(local.test_urls) : startswith(url, "https://")
    ])
    no_http_urls = alltrue([
      for url in values(local.test_urls) : !startswith(url, "http://")
    ])
  }
}