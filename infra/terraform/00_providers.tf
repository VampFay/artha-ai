# ============================================================
# Artha AI — Bank-Grade Infrastructure (Terraform)
# ============================================================
# Production VPC with private subnets, KMS, RDS PostgreSQL,
# EKS Kubernetes, WAF, CloudFront, S3 with data residency.
#
# All resources are deployed in ap-south-1 (Mumbai) for RBI/DPDP
# data localization compliance.
# ============================================================

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Production: configure remote state with locking
  # backend "s3" {
  #   bucket         = "artha-tfstate-prod"
  #   key            = "infra/terraform.tfstate"
  #   region         = "ap-south-1"
  #   encrypt        = true
  #   dynamodb_table = "artha-tfstate-locks"
  # }
}

# ============================================================
# Variables
# ============================================================

variable "aws_region" {
  description = "AWS region for all resources (ap-south-1 = Mumbai for RBI compliance)"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Environment name (staging | production)"
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "artha-ai"
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "artha.ai"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.xlarge" # bank-grade: 4 vCPU, 32 GB RAM
}

variable "eks_node_instance_type" {
  description = "EKS worker node instance type"
  type        = string
  default     = "m6i.xlarge"
}

variable "eks_node_count" {
  description = "Number of EKS worker nodes (minimum for HA)"
  type        = number
  default     = 3
}

variable "enable_dr" {
  description = "Enable Disaster Recovery (cross-region replication)"
  type        = bool
  default     = true
}

variable "dr_region" {
  description = "DR region"
  type        = string
  default     = "ap-south-2" # Hyderabad
}

# ============================================================
# Provider Configuration
# ============================================================

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.app_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Compliance  = "RBI,DPDP,GDPR,ISO27001,SOC2"
      Owner       = "platform-team@artha.ai"
    }
  }
}

# DR region provider (for cross-region replication)
provider "aws" {
  alias  = "dr"
  region = var.dr_region

  default_tags {
    tags = {
      Project     = var.app_name
      Environment = "${var.environment}-dr"
      ManagedBy   = "terraform"
      Compliance  = "RBI,DPDP,GDPR"
      Owner       = "platform-team@artha.ai"
    }
  }
}

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# ============================================================
# Locals
# ============================================================

locals {
  azs    = slice(data.aws_availability_zones.available.names, 0, 3)
  prefix = "${var.app_name}-${var.environment}"

  common_tags = {
    Project     = var.app_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
