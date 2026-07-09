# ============================================================
# KMS Keys — encryption keys for data at rest
# ============================================================

# Master KMS key for envelope encryption (field-level)
resource "aws_kms_key" "field_encryption" {
  description             = "${local.prefix} — field-level encryption master key"
  deletion_window_in_days = 30
  enable_key_rotation     = true # auto-rotate annually (bank-grade)

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM user permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow application to encrypt/decrypt"
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/${module.eks.oidc_provider_arn}"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_kms_alias" "field_encryption" {
  name          = "alias/${local.prefix}-field-encryption"
  target_key_id = aws_kms_key.field_encryption.key_id
}

# KMS key for PDF report signing (HSM-backed via CloudHSM in prod)
resource "aws_kms_key" "pdf_signing" {
  description             = "${local.prefix} — PDF report digital signing"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  customer_master_key_spec = "RSA_2048"
  key_usage               = "SIGN_VERIFY"

  tags = local.common_tags
}

resource "aws_kms_alias" "pdf_signing" {
  name          = "alias/${local.prefix}-pdf-signing"
  target_key_id = aws_kms_key.pdf_signing.key_id
}

# KMS key for audit chain integrity signing
resource "aws_kms_key" "audit_chain" {
  description             = "${local.prefix} — audit chain integrity signing"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  customer_master_key_spec = "RSA_2048"
  key_usage               = "SIGN_VERIFY"

  tags = local.common_tags
}

resource "aws_kms_alias" "audit_chain" {
  name          = "alias/${local.prefix}-audit-chain"
  target_key_id = aws_kms_key.audit_chain.key_id
}

# KMS key for S3 bucket encryption
resource "aws_kms_key" "s3" {
  description             = "${local.prefix} — S3 bucket encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_kms_alias" "s3" {
  name          = "alias/${local.prefix}-s3"
  target_key_id = aws_kms_key.s3.key_id
}

# KMS key for RDS encryption
resource "aws_kms_key" "rds" {
  description             = "${local.prefix} — RDS encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${local.prefix}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

# KMS key for EKS secrets encryption
resource "aws_kms_key" "eks" {
  description             = "${local.prefix} — EKS secret encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_kms_alias" "eks" {
  name          = "alias/${local.prefix}-eks"
  target_key_id = aws_kms_key.eks.key_id
}

# Outputs
output "kms_key_arns" {
  value = {
    field_encryption = aws_kms_key.field_encryption.arn
    pdf_signing      = aws_kms_key.pdf_signing.arn
    audit_chain      = aws_kms_key.audit_chain.arn
    s3               = aws_kms_key.s3.arn
    rds              = aws_kms_key.rds.arn
    eks              = aws_kms_key.eks.arn
  }
  sensitive = true
}
