# Variables for Infrastructure Validation Tests

variable "project_id" {
  description = "Google Cloud Project ID for testing"
  type        = string
  default     = "test-project"
}

variable "next_public_supabase_url" {
  description = "Supabase URL for validation testing"
  type        = string
  default     = "https://test.supabase.co"
}