# ─────────────────────────────────────────────────────────────────────────────
# WAF – AWS WAF v2 WebACL with rate limiting and managed rule groups
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_wafv2_web_acl" "main" {
  name  = "${var.cluster_name}-${var.env}-waf"
  scope = "REGIONAL"  # use CLOUDFRONT for CloudFront-attached WAF

  default_action { allow {} }

  # Rule 1: AWS Managed – Core Rule Set (XSS, SQLi, etc.)
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 10

    override_action { none {} }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # Rule 2: AWS Managed – Known Bad Inputs (log4j, SSRF, etc.)
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 20

    override_action { none {} }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "KnownBadInputs"
      sampled_requests_enabled   = true
    }
  }

  # Rule 3: Rate limit – 1000 req/5min per IP on redirect endpoint
  rule {
    name     = "RateLimitRedirectEndpoint"
    priority = 30

    action { block {} }

    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
        scope_down_statement {
          byte_match_statement {
            field_to_match { uri_path {} }
            positional_constraint = "STARTS_WITH"
            search_string         = "/"
            text_transformation {
              priority = 1
              type     = "URL_DECODE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRedirect"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.cluster_name}-waf"
    sampled_requests_enabled   = true
  }

  tags = { Environment = var.env }
}

output "waf_web_acl_arn" { value = aws_wafv2_web_acl.main.arn }
