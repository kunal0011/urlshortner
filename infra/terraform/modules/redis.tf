# ─────────────────────────────────────────────────────────────────────────────
# ElastiCache Redis – Two clusters: hot-path URL cache and session/rate-limit
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.cluster_name}-${var.env}-redis-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_security_group" "redis" {
  name   = "${var.cluster_name}-${var.env}-redis-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 6379
    to_port     = 6379
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

# Cluster 1 – URL redirect hot path (3 shards × 2 replicas each)
resource "aws_elasticache_replication_group" "url_cache" {
  replication_group_id       = "${var.cluster_name}-${var.env}-url-cache"
  description                = "URL redirect hot-path cache"
  node_type                  = "cache.r7g.large"
  num_node_groups            = 3
  replicas_per_node_group    = 2
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  automatic_failover_enabled = true
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  auto_minor_version_upgrade = true
}

# Cluster 2 – Session & rate limiting (1 shard × 2 replicas)
resource "aws_elasticache_replication_group" "session" {
  replication_group_id       = "${var.cluster_name}-${var.env}-session"
  description                = "Session and rate-limit store"
  node_type                  = "cache.t4g.medium"
  num_node_groups            = 1
  replicas_per_node_group    = 2
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  automatic_failover_enabled = true
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
}

output "redis_url_cache_endpoint"  { value = aws_elasticache_replication_group.url_cache.configuration_endpoint_address }
output "redis_session_endpoint"    { value = aws_elasticache_replication_group.session.configuration_endpoint_address }
