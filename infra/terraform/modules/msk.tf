# ─────────────────────────────────────────────────────────────────────────────
# Amazon MSK – Apache Kafka 3.7 – 3-broker cluster
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_security_group" "msk" {
  name   = "${var.cluster_name}-${var.env}-msk-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 9092
    to_port     = 9098
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

resource "aws_msk_cluster" "kafka" {
  cluster_name           = "${var.cluster_name}-${var.env}-kafka"
  kafka_version          = "3.7.x"
  number_of_broker_nodes = 3

  broker_node_group_info {
    instance_type   = "kafka.m5.xlarge"
    client_subnets  = aws_subnet.private[*].id
    security_groups = [aws_security_group.msk.id]

    storage_info {
      ebs_storage_info {
        volume_size = 1000  # GB per broker
      }
    }
  }

  encryption_info {
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }

  configuration_info {
    arn      = aws_msk_configuration.kafka.arn
    revision = aws_msk_configuration.kafka.latest_revision
  }
}

resource "aws_msk_configuration" "kafka" {
  name              = "${var.cluster_name}-${var.env}-kafka-config"
  kafka_versions    = ["3.7.x"]
  server_properties = <<-EOF
    auto.create.topics.enable=false
    default.replication.factor=3
    min.insync.replicas=2
    log.retention.hours=168
    num.partitions=12
  EOF
}

output "kafka_bootstrap_brokers_tls" { value = aws_msk_cluster.kafka.bootstrap_brokers_tls }
