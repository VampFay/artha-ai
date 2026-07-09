# ============================================================
# S3 Buckets — documents, backups, audit logs
# All buckets:
#   - Encrypted with KMS
#   - Versioned (recoverable)
#   - Block public access
#   - Lifecycle rules for retention
#   - Cross-region replication to DR region
# ============================================================

# Documents bucket (customer-uploaded financial docs)
resource "aws_s3_bucket" "documents" {
  bucket = "${local.prefix}-documents"

  tags = merge(local.common_tags, {
    Name         = "${local.prefix}-documents"
    DataClass    = "restricted"
    Compliance   = "RBI,DPDP,GDPR"
    Retention    = "2555 days (7 years)"
  })
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true # cost optimization
  }
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 365
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555 # 7 years (RBI)
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# Bucket policy — only allow access from app role
resource "aws_s3_bucket_policy" "documents" {
  bucket = aws_s3_bucket.documents.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowAppRoleAccess"
        Effect    = "Allow"
        Principal = { AWS = aws_iam_role.app_service_account.arn }
        Action = [
          "s3:GetObject", "s3:PutObject", "s3:DeleteObject",
          "s3:ListBucket", "s3:GetBucketLocation",
          "s3:GetObjectVersion", "s3:DeleteObjectVersion"
        ]
        Resource = [
          aws_s3_bucket.documents.arn,
          "${aws_s3_bucket.documents.arn}/*"
        ]
      },
      {
        Sid       = "DenyUnEncryptedObjectUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.documents.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource  = "${aws_s3_bucket.documents.arn}/*"
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# Backups bucket (DB snapshots, audit exports)
resource "aws_s3_bucket" "backups" {
  bucket = "${local.prefix}-backups"

  tags = merge(local.common_tags, {
    Name      = "${local.prefix}-backups"
    DataClass = "restricted"
    Retention = "2555 days (7 years)"
  })
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket = aws_s3_bucket.backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "backup-retention"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = 2555 # 7 years
    }
  }
}

# Audit logs bucket (immutable — WORM via Object Lock)
resource "aws_s3_bucket" "audit_logs" {
  bucket = "${local.prefix}-audit-logs"

  tags = merge(local.common_tags, {
    Name      = "${local.prefix}-audit-logs"
    DataClass = "restricted"
    Retention = "3650 days (10 years)"
    Immutable = "true"
  })
}

resource "aws_s3_bucket_versioning" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Object Lock — WORM (Write Once Read Many) for audit logs
resource "aws_s3_bucket_object_lock_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    default_retention {
      mode = "COMPLIANCE" # cannot be overridden even by root
      days = 3650         # 10 years
    }
  }
}

resource "aws_s3_bucket_public_access_block" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Cross-region replication for documents (DR)
resource "aws_s3_bucket" "documents_dr" {
  count  = var.enable_dr ? 1 : 0
  provider = aws.dr
  bucket = "${local.prefix}-documents-dr"

  tags = merge(local.common_tags, {
    Name = "${local.prefix}-documents-dr"
    Role = "dr-replica"
  })
}

resource "aws_s3_bucket_versioning" "documents_dr" {
  count    = var.enable_dr ? 1 : 0
  provider = aws.dr
  bucket   = aws_s3_bucket.documents_dr[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

# IAM role for S3 replication
resource "aws_iam_role" "s3_replication" {
  count = var.enable_dr ? 1 : 0
  name  = "${local.prefix}-s3-replication"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "s3.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "s3_replication" {
  count  = var.enable_dr ? 1 : 0
  name   = "${local.prefix}-s3-replication"
  role   = aws_iam_role.s3_replication[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.documents.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersion",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.documents.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.documents_dr[0].arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_replication_configuration" "documents" {
  count    = var.enable_dr ? 1 : 0
  role     = aws_iam_role.s3_replication[0].arn
  bucket   = aws_s3_bucket.documents.id

  rule {
    id     = "dr-replication"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.documents_dr[0].arn
      storage_class = "STANDARD"
    }
  }

  depends_on = [aws_s3_bucket_versioning.documents]
}

# CloudFront access log bucket
resource "aws_s3_bucket" "cloudfront_logs" {
  bucket = "${local.prefix}-cloudfront-logs"

  tags = merge(local.common_tags, {
    Name = "${local.prefix}-cloudfront-logs"
  })
}

resource "aws_s3_bucket_public_access_block" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Outputs
output "documents_bucket" {
  value = aws_s3_bucket.documents.bucket
}

output "backups_bucket" {
  value = aws_s3_bucket.backups.bucket
}

output "audit_logs_bucket" {
  value = aws_s3_bucket.audit_logs.bucket
}
