# ─────────────────────────────────────────────────────────────────────────────
# S3 – QR code image storage with lifecycle and versioning
# ─────────────────────────────────────────────────────────────────────────────
variable "qr_bucket_name" { default = "urlshortner-qr-codes" }

resource "aws_s3_bucket" "qr_codes" {
  bucket        = "${var.qr_bucket_name}-${var.env}"
  force_destroy = false

  tags = {
    Name        = "${var.qr_bucket_name}-${var.env}"
    Environment = var.env
  }
}

resource "aws_s3_bucket_versioning" "qr_codes" {
  bucket = aws_s3_bucket.qr_codes.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "qr_codes" {
  bucket = aws_s3_bucket.qr_codes.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "qr_codes" {
  bucket                  = aws_s3_bucket.qr_codes.id
  block_public_acls       = false   # QR images are public-read
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_lifecycle_configuration" "qr_codes" {
  bucket = aws_s3_bucket.qr_codes.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"
    filter { prefix = "qr/" }

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 365
      storage_class = "GLACIER"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "qr_codes" {
  bucket = aws_s3_bucket.qr_codes.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    max_age_seconds = 86400
  }
}

output "qr_bucket_name" { value = aws_s3_bucket.qr_codes.id }
output "qr_bucket_arn"  { value = aws_s3_bucket.qr_codes.arn }
