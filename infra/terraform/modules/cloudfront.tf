# ─────────────────────────────────────────────────────────────────────────────
# CloudFront – CDN for QR code images and static assets
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_cloudfront_origin_access_control" "s3" {
  name                              = "${var.cluster_name}-${var.env}-s3-oac"
  description                       = "OAC for QR code S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "qr_cdn" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "${var.cluster_name} ${var.env} QR CDN"
  price_class     = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.qr_codes.bucket_regional_domain_name
    origin_id                = "S3-QRCodes"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-QRCodes"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    min_ttl     = 86400
    default_ttl = 604800
    max_ttl     = 31536000
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = { Environment = var.env }
}

output "cloudfront_domain" { value = aws_cloudfront_distribution.qr_cdn.domain_name }
