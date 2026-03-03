.PHONY: help dev-up dev-down dev-logs build-all test-all lint clean generate-openapi db-migrate

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─────────────────────────────────────────
# Local Dev Environment
# ─────────────────────────────────────────
dev-up: ## Start all local infrastructure and services
	cp -n .env.example .env 2>/dev/null || true
	docker compose up -d postgres redis redis-session clickhouse zookeeper kafka keycloak temporal temporal-ui
	@echo "✅ Infrastructure is up. Run 'make dev-services' to start application services."

dev-services: ## Start all application services
	docker compose up -d redirect-svc url-api-svc analytics-ingest-svc analytics-query-svc user-org-svc qr-svc notification-svc admin-svc

dev-down: ## Stop all local services
	docker compose down

dev-clean: ## Stop all services and remove volumes
	docker compose down -v --remove-orphans

dev-logs: ## Tail logs for all services
	docker compose logs -f

dev-logs-svc: ## Tail logs for a specific service (SVC=redirect-svc)
	docker compose logs -f $(SVC)

dev-ps: ## Show running containers
	docker compose ps

# ─────────────────────────────────────────
# Build
# ─────────────────────────────────────────
build-all: build-go build-node build-python ## Build all services

build-go: ## Build all Go services
	@for svc in services/redirect-svc services/url-api-svc services/analytics-ingest-svc; do \
		echo "Building $$svc..."; \
		cd $$svc && go build ./... && cd -; \
	done

build-node: ## Install deps for all Node.js services
	@for svc in services/analytics-query-svc services/user-org-svc services/notification-svc services/admin-svc; do \
		echo "Installing deps for $$svc..."; \
		cd $$svc && npm install && cd -; \
	done

build-python: ## Install deps for Python services
	cd services/qr-svc && pip install -r requirements.txt

build-docker: ## Build all Docker images
	@for svc in redirect-svc url-api-svc analytics-ingest-svc analytics-query-svc user-org-svc qr-svc notification-svc admin-svc; do \
		echo "Building Docker image for $$svc..."; \
		docker build -t urlshortner/$$svc:dev services/$$svc; \
	done

# ─────────────────────────────────────────
# Testing
# ─────────────────────────────────────────
test-all: test-go test-node test-python ## Run all tests

test-go: ## Run Go tests
	@for svc in services/redirect-svc services/url-api-svc services/analytics-ingest-svc; do \
		echo "Testing $$svc..."; \
		cd $$svc && go test ./... -v && cd -; \
	done

test-node: ## Run Node.js tests
	@for svc in services/analytics-query-svc services/user-org-svc services/notification-svc services/admin-svc; do \
		echo "Testing $$svc..."; \
		cd $$svc && npm test && cd -; \
	done

test-python: ## Run Python tests
	cd services/qr-svc && python -m pytest tests/ -v

test-e2e: ## Run Playwright E2E tests
	cd apps/admin-dashboard && npx playwright test

# ─────────────────────────────────────────
# Linting
# ─────────────────────────────────────────
lint: lint-go lint-node lint-python ## Lint all code

lint-go: ## Lint Go services
	@for svc in services/redirect-svc services/url-api-svc services/analytics-ingest-svc; do \
		echo "Linting $$svc..."; \
		cd $$svc && golangci-lint run ./... && cd -; \
	done

lint-node: ## Lint Node.js services
	@for svc in services/analytics-query-svc services/user-org-svc services/notification-svc services/admin-svc; do \
		echo "Linting $$svc..."; \
		cd $$svc && npx eslint src/ && cd -; \
	done

lint-python: ## Lint Python services
	cd services/qr-svc && flake8 app/ && black --check app/

# ─────────────────────────────────────────
# Security
# ─────────────────────────────────────────
scan: ## Scan Docker images with Trivy
	@for svc in redirect-svc url-api-svc analytics-ingest-svc analytics-query-svc user-org-svc qr-svc notification-svc admin-svc; do \
		echo "Scanning urlshortner/$$svc:dev..."; \
		trivy image --severity HIGH,CRITICAL urlshortner/$$svc:dev; \
	done

# ─────────────────────────────────────────
# Database
# ─────────────────────────────────────────
db-migrate: ## Run Prisma migrations
	npx prisma migrate dev

db-seed: ## Seed the database
	npx prisma db seed

db-reset: ## Reset the database (destructive!)
	npx prisma migrate reset --force

db-studio: ## Open Prisma Studio
	npx prisma studio

# ─────────────────────────────────────────
# Infrastructure
# ─────────────────────────────────────────
tf-init: ## Initialize Terraform for an environment (ENV=dev)
	cd infra/terraform/environments/$(ENV) && terraform init

tf-plan: ## Plan Terraform changes (ENV=dev)
	cd infra/terraform/environments/$(ENV) && terraform plan

tf-apply: ## Apply Terraform changes (ENV=dev)
	cd infra/terraform/environments/$(ENV) && terraform apply -auto-approve

tf-validate: ## Validate Terraform in modules directory
	cd infra/terraform/modules && terraform init -backend=false && terraform validate

helm-lint: ## Lint all Helm charts
	@for chart in deploy/helm/*/; do \
		echo "Linting $$chart..."; \
		helm lint $$chart; \
	done

# ─────────────────────────────────────────
# API Contracts
# ─────────────────────────────────────────
generate-openapi: ## Validate and display OpenAPI spec info
	@which swagger-cli >/dev/null 2>&1 || npm install -g @apidevtools/swagger-cli
	swagger-cli validate contracts/openapi.yaml

# ─────────────────────────────────────────
# Utilities
# ─────────────────────────────────────────
clean: ## Remove build artifacts
	@for svc in services/redirect-svc services/url-api-svc services/analytics-ingest-svc; do \
		rm -f $$svc/main; \
	done
	@for svc in services/analytics-query-svc services/user-org-svc services/notification-svc services/admin-svc; do \
		rm -rf $$svc/node_modules; \
	done

env: ## Copy .env.example to .env (non-destructive)
	cp -n .env.example .env && echo "✅ .env created" || echo "ℹ️  .env already exists"
