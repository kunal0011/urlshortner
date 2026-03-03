# URL Shortener Service

> Production-grade URL Shortener capable of handling **1 billion+ redirects/month**.  
> Sub-50ms redirect latency · 99.99% SLA · Multi-region active-active on AWS

---

## Architecture Overview

```
User → Route 53 (latency routing) → Global Accelerator → CloudFront/WAF
     → EKS Nginx Ingress → Istio mTLS → redirect-svc (Go/Fiber)
                                       → Redis (cache miss) → PostgreSQL
                                       → async → analytics-ingest-svc → Kafka
                                                              → ClickHouse
```

## Monorepo Structure

```
urlshortner/
├── apps/
│   ├── admin-dashboard/       # React 18 + Vite admin UI
│   └── public-ui/             # Next.js 14 public shortening UI
│
├── services/
│   ├── redirect-svc/          # Go – hot-path 301/302 redirect (Fiber, Redis, singleflight)
│   ├── url-api-svc/           # Go – link CRUD, bulk create, expiry, alias (Fiber, Postgres)
│   ├── analytics-ingest-svc/  # Go – click event receiver → Kafka producer
│   ├── analytics-query-svc/   # Node.js – ClickHouse queries (summary, timeseries, org)
│   ├── user-org-svc/          # Node.js – user/org CRUD, member management
│   ├── notification-svc/      # Node.js – SMTP email + Slack webhook notifications
│   ├── admin-svc/             # Node.js – super-admin endpoints, platform stats
│   └── qr-svc/                # Python – QR PNG generation (qrcode) + S3 upload
│
├── contracts/
│   └── openapi.yaml           # Full OpenAPI 3.0.3 spec (all endpoints + schemas)
│
├── deploy/
│   ├── helm/redirect-svc/     # Helm chart (Chart.yaml, values.yaml, templates/)
│   └── argocd/                # ArgoCD Application manifests
│
├── infra/
│   ├── terraform/modules/     # 9 Terraform modules (vpc, eks, rds, redis, msk, s3, …)
│   └── observability/
│       └── prometheus/        # Prometheus scrape config (all 8 services + exporters)
│
├── scripts/
│   └── db/
│       ├── postgres/001_init.sql   # Full Postgres schema (6 tables, enums, indexes)
│       └── clickhouse/001_init.sql # ClickHouse clicks table + 2 materialised views
│
├── sdks/
│   ├── node/                  # Node.js SDK (URLShortenerClient)
│   └── python/urlshortener/   # Python SDK (URLShortenerClient)
│
├── prisma/schema.prisma        # Prisma schema (6 models, enums, relations)
├── docker-compose.yml          # Full local stack (postgres, redis×2, kafka, clickhouse, keycloak, temporal)
├── .env.example                # All environment variables documented
└── Makefile                    # 25+ targets: dev-up, build-all, test-all, tf-*, helm-*
```

## Quick Start (Local Dev)

```bash
# 1. Clone and set up env
git clone https://github.com/kunal/urlshortner.git && cd urlshortner
make env          # copies .env.example → .env

# 2. Start infrastructure (postgres, redis, kafka, clickhouse, keycloak, temporal)
make dev-up

# 3. Build all services
make build-all

# 4. Start all application services
make dev-services

# 5. Test the core flow
curl -X POST http://localhost:8081/api/v1/links \
  -H 'Content-Type: application/json' \
  -d '{"long_url":"https://example.com"}'
# → {"short_code":"abc1234","short_url":"http://localhost:8080/abc1234",...}

curl -L http://localhost:8080/abc1234
# → 302 redirect to https://example.com
```

## Technology Stack

| Layer | Technology |
|---|---|
| Redirect service | Go 1.22 + Fiber (fasthttp) |
| API services | Go + Fiber, Node.js 20 + Fastify |
| Auth | Keycloak 24 (OIDC/OAuth2) |
| Primary DB | PostgreSQL 16 (Aurora Global) |
| Cache | Redis 7.2 (ElastiCache Cluster) |
| Analytics | ClickHouse 24 (MergeTree + materialised views) |
| Messaging | Apache Kafka 3.7 (MSK) |
| QR service | Python 3.11 + FastAPI + qrcode |
| CDN / Storage | CloudFront + S3 |
| Orchestration | Kubernetes 1.30 (EKS) |
| Service mesh | Istio 1.21 (mTLS) |
| CD | ArgoCD 2.11 (GitOps) |
| Observability | Prometheus + Grafana + Jaeger + Sentry |

## Service Ports (local)

| Service | Port |
|---|---|
| redirect-svc | 8080 |
| url-api-svc | 8081 |
| analytics-ingest-svc | 8082 |
| analytics-query-svc | 8083 |
| user-org-svc | 8084 |
| qr-svc | 8085 |
| notification-svc | 8086 |
| admin-svc | 8087 |

## Key Makefile Targets

```bash
make dev-up         # start infrastructure containers
make dev-services   # start all app service containers
make build-all      # build Go, Node.js, Python services
make test-all       # run all tests
make lint           # lint all code (golangci-lint, eslint, flake8)
make scan           # Trivy container scan
make db-migrate     # run Prisma migrations
make tf-plan ENV=staging    # Terraform plan for staging
make helm-lint      # lint all Helm charts
make generate-openapi       # validate OpenAPI spec
```

## SDK Usage

### Node.js
```js
const { URLShortenerClient } = require('./sdks/node');
const client = new URLShortenerClient({ apiKey: 'your-key' });
const link = await client.links.create({ long_url: 'https://example.com' });
```

### Python
```python
from urlshortener import URLShortenerClient
client = URLShortenerClient(api_key='your-key')
link = client.links.create('https://example.com')
```

## Documentation

- [OpenAPI Spec](contracts/openapi.yaml)
- [Prisma Schema](prisma/schema.prisma)
- [Implementation Plan](.gemini/antigravity/brain/ce9c3e62-b92a-4976-b027-86621a446c44/implementation_plan.md)

---

*Document Version 1.0 · March 2026 · Internal Use Only*

### Managing Node.js Projects (Monorepo)

The Node.js applications (Next.js, Vite React) and services (Fastify) are organized as an **NPM Workspace** managed by **Turborepo**. From the root directory, you can orchestrate tasks across all JavaScript/TypeScript projects:

```bash
# Install all dependencies (hoisted to root)
npm install

# Run all Node.js dev servers concurrently
npm run dev

# Build all Node.js projects (caches output via Turbo)
npm run build

# Lint all Node.js projects
npm run lint
```
