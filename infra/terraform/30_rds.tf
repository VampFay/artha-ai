# ============================================================
# RDS PostgreSQL — Multi-AZ, encrypted, automated backups
# Bank-grade: 99.95% availability SLA, 30-day backup retention
# ============================================================

# DB Subnet Group (private data subnets only)
resource "aws_db_subnet_group" "main" {
  name        = local.prefix
  description = "${local.prefix} RDS subnet group"
  subnet_ids  = [for s in aws_subnet.private_data : s.id]

  tags = local.common_tags
}

# Random password for master user (stored in Secrets Manager)
resource "random_password" "db_master" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Secrets Manager secret for DB credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${local.prefix}/db/credentials"
  description = "RDS PostgreSQL master credentials"

  kms_key_id = aws_kms_key.field_encryption.id

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id

  secret_string = jsonencode({
    username = "artha_admin"
    password = random_password.db_master.result
    engine   = "postgres"
    host     = aws_db_instance.main.address
    port     = 5432
    dbname   = "artha"
  })
}

# RDS Parameter Group (bank-grade tuning)
resource "aws_db_parameter_group" "main" {
  family = "postgres16"

  name        = "${local.prefix}-pg"
  description = "${local.prefix} PostgreSQL parameter group"

  parameter {
    name  = "log_connections"
    value = "1" # audit: log all connections
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "ddl" # log DDL for audit
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # log slow queries (>1s)
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pgaudit"
  }

  parameter {
    name  = "pgaudit.log"
    value = "write,ddl"
  }

  parameter {
    name  = "max_connections"
    value = "200"
  }

  tags = local.common_tags
}

# RDS Instance — Multi-AZ, encrypted, with backups
resource "aws_db_instance" "main" {
  identifier = "${local.prefix}-postgres"

  engine         = "postgres"
  engine_version = "16.4"
  instance_class = var.db_instance_class

  allocated_storage     = 500
  max_allocated_storage = 2000
  storage_type          = "io2" # provisioned IOPS for bank-grade performance
  iops                  = 3000
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds.arn

  db_name  = "artha"
  username = "artha_admin"
  password = random_password.db_master.result

  multi_az               = true # HA across 2 AZs
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.main.name
  publicly_accessible    = false # NEVER expose RDS to internet

  backup_retention_period = 30 # 30-day backups (bank requirement)
  backup_window           = "02:00-03:00"
  maintenance_window      = "sun:04:00-sun:05:00"
  copy_tags_to_snapshot   = true

  deletion_protection      = true # prevent accidental deletion
  skip_final_snapshot      = false
  final_snapshot_identifier = "${local.prefix}-final-snapshot"

  enabled_cloudwatch_logs_exports = [
    "postgresql",
    "upgrade",
  ]

  tags = local.common_tags
}

# Cross-region read replica for DR (in DR region)
resource "aws_db_instance" "dr_replica" {
  count                  = var.enable_dr ? 1 : 0
  provider               = aws.dr
  identifier             = "${local.prefix}-postgres-dr"
  replicate_source_db    = aws_db_instance.main.id
  instance_class         = var.db_instance_class
  subnet_group_name      = aws_db_subnet_group.dr[0].name
  vpc_security_group_ids = [aws_security_group.rds_dr[0].id]
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.rds_dr[0].arn

  backup_retention_period = 7
  deletion_protection     = true

  tags = merge(local.common_tags, { Role = "dr-replica" })

  depends_on = [aws_db_instance.main]
}

# DR region subnet group
resource "aws_db_subnet_group" "dr" {
  count       = var.enable_dr ? 1 : 0
  provider    = aws.dr
  name        = "${local.prefix}-dr"
  description = "${local.prefix} DR subnet group"
  subnet_ids  = [for s in aws_subnet.private_data_dr : s.id]

  tags = local.common_tags
}

# Outputs
output "rds_endpoint" {
  value     = aws_db_instance.main.endpoint
  sensitive = true
}

output "rds_arn" {
  value = aws_db_instance.main.arn
}

output "db_credentials_secret_arn" {
  value     = aws_secretsmanager_secret.db_credentials.arn
  sensitive = true
}
