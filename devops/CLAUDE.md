# DevOps

## Structure

```
devops/
  docker/      # Dockerfiles and docker-compose
  ci/          # CI/CD pipeline configs (GitHub Actions)
  infra/       # Infrastructure as Code (Terraform / Bicep)
  k8s/
    base/      # Shared Kustomize manifests (deployments, services, configmaps)
    overlays/
      dev/     # Dev overrides (lower replicas, debug settings)
      staging/ # Staging overrides
      prod/    # Production overrides (resource limits, autoscaling)
```

## Current State

All directories are empty placeholders — nothing is deployed yet.

## Intended Setup

**Docker**
- One Dockerfile per service (`frontend`, `backend`)
- `docker-compose.yml` for local full-stack development

**CI/CD** (GitHub Actions)
- On PR: lint, test, build
- On merge to `main`: build images, push to registry, deploy to dev

**Kubernetes**
- Kustomize pattern: `base/` holds shared config, `overlays/` patches per environment
- Each overlay only overrides what differs (replica count, env vars, ingress host)

**Infrastructure**
- Provision cloud resources (cluster, database, storage) via IaC
