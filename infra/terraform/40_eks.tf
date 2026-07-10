# ============================================================
# EKS — Kubernetes for bank-grade orchestration
# Features:
#   - Private cluster (no public endpoint in prod)
#   - Secrets encryption via KMS
#   - IRSA (IAM Roles for Service Accounts)
#   - Managed node groups across 3 AZs
#   - Pod security standards (restricted)
#   - Network policies (Calico)
# ============================================================

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "${local.prefix}-cluster"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.30"

  vpc_config {
    subnet_ids              = [for s in aws_subnet.private_app : s.id]
    endpoint_private_access = true
    endpoint_public_access  = false # bank-grade: no public API server
    security_group_ids      = [aws_security_group.eks_workers.id]
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"] # encrypt Kubernetes secrets at rest
  }

  enabled_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy.eks_cluster,
  ]
}

# IAM Role for EKS cluster
resource "aws_iam_role" "eks_cluster" {
  name = "${local.prefix}-eks-cluster"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "eks.amazonaws.com" }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "eks_cluster" {
  name = "${local.prefix}-eks-cluster"
  role = aws_iam_role.eks_cluster.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:Describe*",
          "elasticloadbalancing:Describe*",
          "elasticloadbalancing:Create*",
          "elasticloadbalancing:Delete*",
          "elasticloadbalancing:Modify*",
          "elasticloadbalancing:RegisterTargets",
          "elasticloadbalancing:DeregisterTargets",
          "elasticloadbalancing:Set*",
          "iam:CreateServiceLinkedRole",
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Role for EKS worker nodes
resource "aws_iam_role" "eks_nodes" {
  name = "${local.prefix}-eks-nodes"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "eks_nodes" {
  for_each = toset([
    "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
    "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
    "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
    "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore", # for SSM access
  ])

  role       = aws_iam_role.eks_nodes.name
  policy_arn = each.value
}

# Allow worker nodes to use KMS
resource "aws_iam_role_policy" "eks_nodes_kms" {
  name = "${local.prefix}-eks-nodes-kms"
  role = aws_iam_role.eks_nodes.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "kms:Decrypt",
        "kms:DescribeKey",
        "kms:Encrypt",
        "kms:GenerateDataKey*",
        "kms:Sign",
        "kms:Verify"
      ]
      Resource = [
        aws_kms_key.field_encryption.arn,
        aws_kms_key.pdf_signing.arn,
        aws_kms_key.audit_chain.arn,
        aws_kms_key.s3.arn,
        aws_kms_key.eks.arn,
      ]
    }]
  })
}

# EKS Managed Node Group
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${local.prefix}-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = [for s in aws_subnet.private_app : s.id]

  instance_types = [var.eks_node_instance_type]
  capacity_type  = "ON_DEMAND" # bank-grade: no spot instances
  disk_size      = 100
  disk_encrypted = true

  scaling_config {
    desired_size = var.eks_node_count
    min_size     = var.eks_node_count
    max_size     = var.eks_node_count * 2
  }

  update_config {
    max_unavailable = 1
  }

  # Ensure latest AMI release
  release_version = "1.30.4-20240916"

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy_attachment.eks_nodes,
    aws_iam_role_policy.eks_nodes_kms,
  ]
}

# IRSA — IAM Role for Service Account (app pod)
# Allows the Artha app to access KMS, S3, Secrets Manager without static credentials
resource "aws_iam_role" "app_service_account" {
  name = "${local.prefix}-app-sa"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/${replace(aws_eks_cluster.main.identity[0].oidc[0].issuer, "https://", "")}"
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${replace(aws_eks_cluster.main.identity[0].oidc[0].issuer, "https://", "")}:sub" = "system:serviceaccount:default:artha-app"
        }
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "app_service_account" {
  name = "${local.prefix}-app-sa"
  role = aws_iam_role.app_service_account.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt", "kms:Encrypt", "kms:DescribeKey",
          "kms:GenerateDataKey*", "kms:Sign", "kms:Verify"
        ]
        Resource = [
          aws_kms_key.field_encryption.arn,
          aws_kms_key.pdf_signing.arn,
          aws_kms_key.audit_chain.arn,
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject", "s3:PutObject", "s3:DeleteObject",
          "s3:ListBucket", "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.documents.arn,
          "${aws_s3_bucket.documents.arn}/*",
          aws_s3_bucket.backups.arn,
          "${aws_s3_bucket.backups.arn}/*",
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.db_credentials.arn,
          "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${local.prefix}/*"
        ]
      }
    ]
  })
}

# OIDC Provider for IRSA
resource "aws_iam_openid_connect_provider" "eks" {
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.aws_eks_cluster.main.certificate_authority[0].data]

  tags = local.common_tags
}

data "aws_eks_cluster" "main" {
  name = aws_eks_cluster.main.name
}

# Outputs
output "eks_cluster_name" {
  value = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  value     = aws_eks_cluster.main.endpoint
  sensitive = true
}

output "app_service_account_role_arn" {
  value = aws_iam_role.app_service_account.arn
}
