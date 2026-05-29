# ELK Logging Stack (DO-6)

Centralized log aggregation: **E**lasticsearch + **L**ogstash + **K**ibana, fed by
**Filebeat**. Runs as the on-demand `elk` Compose profile — it's heavy (~3 GB RAM),
so it is **not** part of the `full` profile.

```
all containers ──> filebeat ──> logstash:5044 ──> elasticsearch:9200 <── kibana:5601
  stdout/stderr    (collect)     (parse/route)      (store+search)        (UI)
```

This is a parallel pipeline to the existing Promtail → Loki → Grafana stack. Loki
stays for DO-1; ELK satisfies DO-6.

## Files

| Path | What |
|------|------|
| `filebeat/filebeat.yml` | tails `/var/lib/docker/containers`, adds container metadata, ships to Logstash |
| `logstash/pipeline/logstash.conf` | `input(beats) → filter → output(elasticsearch)`; daily index `dashtab-logs-*` |
| `logstash/config/logstash.yml` | Logstash node settings (monitoring off for dev) |

## One-time host prerequisite

Elasticsearch refuses to start without a large mmap limit:

```bash
sudo sysctl -w vm.max_map_count=262144      # persist in /etc/sysctl.conf to survive reboot
```

## Run

```bash
make up-elk            # or: docker compose --profile elk up -d
# Elasticsearch ~60s to go healthy; Kibana a bit after.
make down-elk
```

## First look in Kibana

1. Open http://localhost:5601
2. **Stack Management → Data Views → Create data view**
3. Index pattern: `dashtab-logs-*`, time field: `@timestamp`
4. **Discover** → filter by `service` (e.g. `service: backend`) and search log content.

## Notes / dev caveats

- **No security** — `xpack.security.enabled=false`, no TLS. Dev only.
- **Heap pinned to 512m** per ES (`ES_JAVA_OPTS`); raise for heavier use.
- **No index lifecycle / retention** — daily indices grow forever; add ILM before
  any long-running use.
- Filebeat runs as `root` to read the Docker log files + socket (read-only mounts).
