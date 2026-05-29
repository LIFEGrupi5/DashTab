COMPOSE = docker compose -f devops/docker/docker-compose.yml

.PHONY: help up-backend up-observability up-elk down-elk up down logs ps build

help:
	@printf "\n"
	@printf "  ┌───────────────────────────────────────────┬──────────────────────────┐\n"
	@printf "  │                  Command                  │       What starts        │\n"
	@printf "  ├───────────────────────────────────────────┼──────────────────────────┤\n"
	@printf "  │ docker compose --profile backend up       │ postgres, redis, backend │\n"
	@printf "  ├───────────────────────────────────────────┼──────────────────────────┤\n"
	@printf "  │ docker compose --profile observability up │ loki, grafana            │\n"
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
