# ─────────────────────────────────────────────────────────────────────────────
# Global Accelerator – low-latency global redirect routing
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_globalaccelerator_accelerator" "main" {
  name            = "${var.cluster_name}-${var.env}"
  ip_address_type = "IPV4"
  enabled         = true

  attributes {
    flow_logs_enabled   = true
    flow_logs_s3_bucket = aws_s3_bucket.qr_codes.id
    flow_logs_s3_prefix = "global-accelerator-logs/"
  }
}

resource "aws_globalaccelerator_listener" "http" {
  accelerator_arn = aws_globalaccelerator_accelerator.main.id
  protocol        = "TCP"

  port_range {
    from_port = 80
    to_port   = 80
  }
}

resource "aws_globalaccelerator_listener" "https" {
  accelerator_arn = aws_globalaccelerator_accelerator.main.id
  protocol        = "TCP"

  port_range {
    from_port = 443
    to_port   = 443
  }
}

output "global_accelerator_dns_name" { value = aws_globalaccelerator_accelerator.main.dns_name }
output "global_accelerator_ips"      { value = aws_globalaccelerator_accelerator.main.ip_sets }
