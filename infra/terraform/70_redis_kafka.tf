# ============================================================
# ElastiCache Redis — for rate limiting, sessions, job queues
# Bank-grade: encrypted at rest + in transit, multi-AZ
# ============================================================

resource "aws_elasticache_subnet_group" "main" {
  name        = local.prefix
  description = "${local.prefix} Redis subnet group"
  subnet_ids  = [for s in aws_subnet.private_data : s.id]

  tags = local.common_tags
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${local.prefix}-redis"
  description          = "${local.prefix} Redis — rate limit + sessions"

  engine               = "redis"
  engine_version       = "7.1"
  node_type            = "cache.r6g.large"
  num_cache_clusters   = 2 # Multi-AZ HA

  parameter_group_name = "default.redis7"

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  kms_key_id                 = aws_kms_key.field_encryption.arn
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth.result

  automatic_failover_enabled = true
  multi_az_enabled           = true

  snapshot_retention_limit = 7
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "sun:06:00-sun:07:00"

  notification_topic_arn = aws_sns_topic.alerts.arn

  tags = local.common_tags
}

resource "random_password" "redis_auth" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "redis_auth" {
  name        = "${local.prefix}/redis/auth"
  description = "Redis AUTH token"
  kms_key_id  = aws_kms_key.field_encryption.id

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "redis_auth" {
  secret_id = aws_secretsmanager_secret.redis_auth.id
  secret_string = jsonencode({
    auth_token = random_password.redis_auth.result
    host       = aws_elasticache_replication_group.main.primary_endpoint_address
    port       = 6379
  })
}

# MSK (Managed Kafka) — for event streaming, bulk job queues
# Bank-grade: encrypted, multi-AZ, IAM auth
resource "aws_msk_cluster" "main" {
  cluster_name           = "${local.prefix}-kafka"
  kafka_version          = "3.6.0"
  number_of_broker_nodes = 3

  broker_node_group_info {
    instance_type   = "kafka.m5.large"
    client_subnets  = [for s in aws_subnet.private_data : s.id]
    security_groups = [aws_security_group.eks_workers.id]

    storage_info {
      ebs_storage_info {
        volume_size = 100
        provisioned_throughput {
          enabled           = true
          volume_throughput = 250
        }
      }
    }
  }

  encryption_info {
    encryption_at_rest_kms_key_arn = aws_kms_key.field_encryption.arn

    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }

  client_authentication {
    sasl {
      iam {
        enabled = true
      }
    }
    tls {
      certificate_authority_arns = [aws_acmpca_certificate_authority.kafka.arn]
    }
  }

  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled   = true
        log_group = aws_cloudwatch_log_group.kafka.arn
      }
      s3 {
        enabled = true
        bucket  = aws_s3_bucket.audit_logs.id
        prefix  = "kafka/"
      }
    }
  }

  enhanced_monitoring = "PER_TOPIC_PER_BROKER"

  tags = local.common_tags
}

# Private CA for Kafka mTLS
resource "aws_acmpca_certificate_authority" "kafka" {
  type              = "ROOT"
  permanent_deletion_time_in_days = 30

  certificate_authority_configuration {
    key_algorithm     = "RSA_4096"
    signing_algorithm = "SHA512WITHRSA"

    subject {
      common_name = "${local.prefix}-kafka-ca"
    }
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "kafka" {
  name              = "/${local.prefix}/kafka"
  retention_in_days = 365

  tags = local.common_tags
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name              = "${local.prefix}-alerts"
  kms_master_key_id = aws_kms_key.field_encryption.id

  tags = local.common_tags
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${local.prefix}-rds-cpu-high"
  alarm_description   = "RDS CPU > 80% for 5 min"
  namespace           = "AWS/RDS"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 1
  threshold           = 80
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "${local.prefix}-rds-storage-low"
  alarm_description   = "RDS free storage < 50GB"
  namespace           = "AWS/RDS"
  metric_name         = "FreeStorageSpace"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 1
  threshold           = 50 * 1024 * 1024 * 1024 # 50 GB
  comparison_operator = "LessThanThreshold"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "waf_blocked_high" {
  alarm_name          = "${local.prefix}-waf-blocked-high"
  alarm_description   = "WAF blocked > 1000 requests in 5 min (potential attack)"
  namespace           = "AWS/WAFV2"
  metric_name         = "BlockedRequests"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1000
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    WebACL = aws_wafv2_web_acl.main.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

# Outputs
output "redis_endpoint" {
  value     = aws_elasticache_replication_group.main.primary_endpoint_address
  sensitive = true
}

output "kafka_arn" {
  value = aws_msk_cluster.main.arn
}
