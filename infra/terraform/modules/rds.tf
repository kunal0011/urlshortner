# ─────────────────────────────────────────────────────────────────────────────
# RDS – Aurora PostgreSQL 16 Global Database
# ─────────────────────────────────────────────────────────────────────────────
variable "db_username"    { default = "urlshortner" }
variable "db_password"    { sensitive = true }
variable "db_name"        { default = "urlshortner" }

resource "aws_rds_cluster" "postgres" {
  cluster_identifier      = "${var.cluster_name}-${var.env}-postgres"
  engine                  = "aurora-postgresql"
  engine_version          = "16.1"
  database_name           = var.db_name
  master_username         = var.db_username
  master_password         = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.rds.id]

  backup_retention_period   = 7
  preferred_backup_window   = "03:00-04:00"
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.cluster_name}-${var.env}-final"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_rds_cluster_instance" "writer" {
  identifier          = "${var.cluster_name}-${var.env}-postgres-writer"
  cluster_identifier  = aws_rds_cluster.postgres.id
  instance_class      = "db.r7g.xlarge"
  engine              = aws_rds_cluster.postgres.engine
  engine_version      = aws_rds_cluster.postgres.engine_version
  publicly_accessible = false
}

resource "aws_rds_cluster_instance" "reader" {
  count               = 2
  identifier          = "${var.cluster_name}-${var.env}-postgres-reader-${count.index}"
  cluster_identifier  = aws_rds_cluster.postgres.id
  instance_class      = "db.r7g.large"
  engine              = aws_rds_cluster.postgres.engine
  engine_version      = aws_rds_cluster.postgres.engine_version
  publicly_accessible = false
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.cluster_name}-${var.env}-db-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_security_group" "rds" {
  name   = "${var.cluster_name}-${var.env}-rds-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

output "rds_endpoint"         { value = aws_rds_cluster.postgres.endpoint }
output "rds_reader_endpoint"  { value = aws_rds_cluster.postgres.reader_endpoint }
