COMPOSE = docker compose -f devops/docker/docker-compose.yml

# ── Helm (Kubernetes) ─────────────────────────────────────────────────────────
HELM       = helm
HELM_NS    = dashtab
HELM_DIR   = devops/helm
# Install order matters: postgres first, pgbouncer + keycloak depend on it,
# apps go last. Release names are prefixed "dashtab-" so object names read well.
HELM_INFRA = postgresql pgbouncer redis rabbitmq minio keycloak
HELM_APPS  = backend frontend aiops-triage db-backup
HELM_OBS   = prometheus grafana elasticsearch kibana uptime-kuma

.PHONY: help up-backend up-observability up-elk down-elk up down logs ps build \
        helm-deps helm-lint helm-up helm-up-obs helm-down helm-status

help:
	@printf "\n"
	@printf "  ┌───────────────────────────────────────────┬──────────────────────────┐\n"
	@printf "  │                  Command                  │       What starts        │\n"
	@printf "  ├───────────────────────────────────────────┼──────────────────────────┤\n"
	@printf "  │ docker compose --profile backend up       │ postgres, redis, backend │\n"
	@printf "  ├───────────────────────────────────────────┼──────────────────────────┤\n"
	@printf "  │ docker compose --profile observability up │ loki, grafana, uptime-kuma│\n"
	@printf "  ├───────────────────────────────────────────┼──────────────────────────┤\n"
	@printf "  │ docker compose --profile elk up           │ ELK logging stack        │\n"
	@printf "  ├───────────────────────────────────────────┼──────────────────────────┤\n"
	@printf "  │ docker compose --profile full up          │ everything               │\n"
	@printf "  └───────────────────────────────────────────┴──────────────────────────┘\n"
	@printf "\n"

up-backend:
	$(COMPOSE) --profile backend up -d

up-observability:
	$(COMPOSE) --profile observability up -d

up-elk:
	@echo "Tip: run once per host -> sudo sysctl -w vm.max_map_count=262144"
	$(COMPOSE) --profile elk up -d

down-elk:
	$(COMPOSE) --profile elk down

up:
	$(COMPOSE) --profile full up -d

down:
	$(COMPOSE) --profile full down

logs:
	$(COMPOSE) --profile full logs -f

ps:
	$(COMPOSE) --profile full ps

build:
	$(COMPOSE) --profile full build

# ── Helm targets ──────────────────────────────────────────────────────────────

# Pull Bitnami subcharts into each wrapper chart's charts/ dir (run once / on bump).
helm-deps:
	@for c in $(HELM_INFRA); do \
	  echo "==> helm dependency update $$c"; \
	  $(HELM) dependency update $(HELM_DIR)/$$c; \
	done

helm-lint:
	@for c in $(HELM_INFRA) $(HELM_APPS) $(HELM_OBS); do $(HELM) lint $(HELM_DIR)/$$c || exit 1; done

# Install/upgrade every chart in dependency order. Idempotent (upgrade --install).
helm-up:
	@for c in $(HELM_INFRA) $(HELM_APPS); do \
	  echo "==> deploying $$c"; \
	  $(HELM) upgrade --install dashtab-$$c $(HELM_DIR)/$$c \
	    --namespace $(HELM_NS) --create-namespace --wait; \
	done

# Deploy only observability charts (prometheus, grafana, elk, uptime-kuma).
helm-up-obs:
	@for c in $(HELM_OBS); do \
	  echo "==> deploying $$c"; \
	  $(HELM) upgrade --install dashtab-$$c $(HELM_DIR)/$$c \
	    --namespace $(HELM_NS) --create-namespace --wait; \
	done

# Tear everything down in reverse order.
helm-down:
	@for c in $(HELM_OBS) $(HELM_APPS) $(HELM_INFRA); do \
	  $(HELM) uninstall dashtab-$$c --namespace $(HELM_NS) 2>/dev/null || true; \
	done

helm-status:
	$(HELM) list --namespace $(HELM_NS)
