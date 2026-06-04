# Changelog

## [0.3.0](https://github.com/LIFEGrupi5/DashTab/compare/v0.2.0...v0.3.0) (2026-06-03)


### Features

* **devops:** add scheduled Postgres backup chart (pg_dump → MinIO) ([33e1457](https://github.com/LIFEGrupi5/DashTab/commit/33e14576b2c7d7616959253045d985fc1a40bf82))
* **devops:** add scheduled Postgres backup chart (pg_dump → MinIO) ([7f58d35](https://github.com/LIFEGrupi5/DashTab/commit/7f58d35adb83c5b0a6aa80df6ab72a8f3011d03f))
* **devops:** production-harden app helm charts ([9ecae4b](https://github.com/LIFEGrupi5/DashTab/commit/9ecae4b92f1844f8523e636dcd58730da48937a2))
* **devops:** production-harden app helm charts ([1fed982](https://github.com/LIFEGrupi5/DashTab/commit/1fed982d209620c2dce42e1734dd711917a27cf4))
* **devops:** secure Kibana/Elasticsearch and Keycloak admin (DO-9) ([32a17ad](https://github.com/LIFEGrupi5/DashTab/commit/32a17adc2fea1d95b9e712dd7b52e0d81ba0cdf8))


### Bug Fixes

* **frontend:** drop nonce from script-src to allow unsafe-inline ([36a0190](https://github.com/LIFEGrupi5/DashTab/commit/36a01900ebe94fee29a8395eba0e40d4133fb832))
* **frontend:** replace strict-dynamic with unsafe-inline in CSP ([61e3ba6](https://github.com/LIFEGrupi5/DashTab/commit/61e3ba64810c59078944d688676077526ae71915))
* **frontend:** replace strict-dynamic with unsafe-inline in CSP ([b120fb5](https://github.com/LIFEGrupi5/DashTab/commit/b120fb5e08b2235189ff05ef914712a5264d76db))

## [0.2.0](https://github.com/LIFEGrupi5/DashTab/compare/v0.1.0...v0.2.0) (2026-06-01)


### Features

* **api:** sliding-window rate limiter + redis cache benchmark doc ([f0b6bb4](https://github.com/LIFEGrupi5/DashTab/commit/f0b6bb418f03251384411bd1dc30a2be73e8e89e))
* **auth:** inject Google OAuth2 credentials via .env at Keycloak startup ([db2c131](https://github.com/LIFEGrupi5/DashTab/commit/db2c1315a32cfc8a105ca7abdf5a4163a2938d4f))
* **auth:** wire real Google OAuth2 credentials into Keycloak realm e… ([cfa65d6](https://github.com/LIFEGrupi5/DashTab/commit/cfa65d60c39c97a4f313116e449f8846d62d51ee))
* **backend:** add /health/live and /health/ready endpoints ([90e1a56](https://github.com/LIFEGrupi5/DashTab/commit/90e1a568977856eacbb90138f3f63448b51f113a))
* **backend:** add base entities, DbContext, services, and controllers ([bef403a](https://github.com/LIFEGrupi5/DashTab/commit/bef403aa0dfbadb8a3e254c6a9d9295ab8e40a56))
* **backend:** add base entities, DbContext, services, and controllers ([40f57d1](https://github.com/LIFEGrupi5/DashTab/commit/40f57d1d37b6b6acf842ac4c535756e6cbadbd3a))
* **backend:** add Redis caching layer and fix Keycloak Docker issuer mismatch ([ad8e8d8](https://github.com/LIFEGrupi5/DashTab/commit/ad8e8d84ea7fe875864debed579867bad1be4073))
* **backend:** add Redis caching layer and fix Keycloak Docker issuer… ([bbfbc06](https://github.com/LIFEGrupi5/DashTab/commit/bbfbc0664eddfc8d7a8fd67b8a59702556665f8e))
* **backend:** adopt Mapperly for entity ↔ DTO mapping ([bc7db6d](https://github.com/LIFEGrupi5/DashTab/commit/bc7db6de1dba8a8cf74094bce0ad470f6e71b743))
* **backend:** apply EF Core migrations on startup ([3f044fa](https://github.com/LIFEGrupi5/DashTab/commit/3f044fa9649a530fbb9ba16eb3b154628a34d3e9))
* **backend:** bridge RabbitMQ order events to SignalR KDS hub ([eb81d42](https://github.com/LIFEGrupi5/DashTab/commit/eb81d427967b0b24afaca580532e1833cc678b5b))
* **backend:** expose DashTab.API as an MCP server with read-only KDS, menu, and staff tools ([51266c5](https://github.com/LIFEGrupi5/DashTab/commit/51266c57e8d39b2997bb1e8d58552e84952e1bb5))
* **backend:** M3.13 Serilog + correlation IDs to Loki via promtail ([c6f0279](https://github.com/LIFEGrupi5/DashTab/commit/c6f0279c6dd92dffe2ca0c8efc70eef39e89e40d))
* **backend:** M3.4 SQL optimization — indexes + EXPLAIN ANALYZE doc ([a7e23f3](https://github.com/LIFEGrupi5/DashTab/commit/a7e23f396e627b39f2c516965f2f8b49f59631e4))
* **backend:** M3.4 SQL optimization — indexes + EXPLAIN ANALYZE doc ([9f9c96b](https://github.com/LIFEGrupi5/DashTab/commit/9f9c96bfd4ae4c13dfd2192fb736d6d70ad52fe3))
* **backend:** M3.8 RabbitMQ consumer + order event pipeline ([df7bea9](https://github.com/LIFEGrupi5/DashTab/commit/df7bea998b4a1bcc2e97716faffd9ad164b87302))
* **backend:** M3.8 RabbitMQ consumer + order event pipeline ([c64c306](https://github.com/LIFEGrupi5/DashTab/commit/c64c306bacd16511a2d9b8a1a8d58d2ec5be484c))
* **backend:** ship logs to Elasticsearch via Serilog sink ([3d82681](https://github.com/LIFEGrupi5/DashTab/commit/3d82681924424c0c678c1100d207ea15e6017ad7))
* **backend:** SignalR KDS Hub + Redis backplane skeleton ([1921e5b](https://github.com/LIFEGrupi5/DashTab/commit/1921e5bc7a79f6abc036c4df00b337a3ea38faf9))
* **backend:** wire MinIO image upload + post-review hardening ([43c8b9d](https://github.com/LIFEGrupi5/DashTab/commit/43c8b9d86827a1f456f2722a5506bd8d1703ff41))
* **backend:** wire MinIO image upload + post-review hardening ([91fcd61](https://github.com/LIFEGrupi5/DashTab/commit/91fcd6140603d261ff5b7d125d2fbfbc8d10db93))
* **devops:** add Alertmanager + Slack routing to Prometheus (DO-5 alerts) ([443e39b](https://github.com/LIFEGrupi5/DashTab/commit/443e39b81c8029bfe786e373c3af6c0573eb6999))
* **devops:** add cert-manager TLS support + project-05 deploy overlays ([5be3aa3](https://github.com/LIFEGrupi5/DashTab/commit/5be3aa3a20cf2d9a9e961e5da9d35d101badb4ef))
* **devops:** add Docker Compose stack, Dockerfiles, and infra configs ([e805b67](https://github.com/LIFEGrupi5/DashTab/commit/e805b67f7284cec3fc19154ada985fa3560e1229))
* **devops:** add ELK logging stack as on-demand compose profile (DO-6) ([73c7910](https://github.com/LIFEGrupi5/DashTab/commit/73c79104b8cc7f855fe89249d0ffef68f6612019))
* **devops:** add Grafana over Prometheus (DO-5) ([c71d83f](https://github.com/LIFEGrupi5/DashTab/commit/c71d83f6bb4e1641c259ffe44348edb634427fc5))
* **devops:** add Groq LLM provider, default DO-12 to it (DO-12) ([fb35e00](https://github.com/LIFEGrupi5/DashTab/commit/fb35e0096b9e389044b36928028e47d36d1caf12))
* **devops:** add in-cluster Prometheus (DO-5) ([f7978f8](https://github.com/LIFEGrupi5/DashTab/commit/f7978f837058e9fa1d1eb742b6fb015813bbe2cc))
* **devops:** add per-service Helm charts for Kubernetes deployment ([0e21b89](https://github.com/LIFEGrupi5/DashTab/commit/0e21b8980b395c8473c29caa68fdf4367eefd964))
* **devops:** add per-service Helm charts for Kubernetes deployment (DO-3) ([cc1e153](https://github.com/LIFEGrupi5/DashTab/commit/cc1e153fa5e15abb296d7af3a5a44675f752f6b3))
* **devops:** AIOps LLM alert triage — Alertmanager to Gemini to Slack (DO-12) ([b290264](https://github.com/LIFEGrupi5/DashTab/commit/b2902640547c8d99bdfe77594539b882aba570e2))
* **devops:** bake project-05 NEXT_PUBLIC_* into frontend image via build-args ([ea25ce0](https://github.com/LIFEGrupi5/DashTab/commit/ea25ce07a38f8026430436c9d5bfae5afd9e6739))
* **devops:** Groq LLM provider + redact API key from logs (DO-12) ([f3c6c8e](https://github.com/LIFEGrupi5/DashTab/commit/f3c6c8e434743ae3d5739b654d8e54446c7e332d))
* **devops:** harden backend image to chiseled non-root (DO-2/DO-9) ([9eeb88c](https://github.com/LIFEGrupi5/DashTab/commit/9eeb88c1d96ba37c59a2fefaea57667512cb74eb))
* **devops:** in-cluster Elasticsearch + Kibana (DO-6 on cluster) ([6e40184](https://github.com/LIFEGrupi5/DashTab/commit/6e40184c01ef075323458e8ad06048f1c815d244))
* **devops:** in-cluster Elasticsearch + Kibana (DO-6 on cluster) ([0fe19f6](https://github.com/LIFEGrupi5/DashTab/commit/0fe19f6a6d100ce71ca6942074306fa2a6cd96e7))
* **devops:** in-cluster Prometheus + Grafana + alerts (DO-5) ([0c95740](https://github.com/LIFEGrupi5/DashTab/commit/0c957403ad4b8f4f3ba6362b2133161e2a437ea4))
* **devops:** provision Grafana platform-overview dashboard (DO-5) ([26c3d42](https://github.com/LIFEGrupi5/DashTab/commit/26c3d42f9e3442520c726d992e2e385ba3863cb8))
* **frontend:** add CSP nonce middleware + security headers ([695dae7](https://github.com/LIFEGrupi5/DashTab/commit/695dae70f46bf02ab25c2bf06e8867b6a39b4ad0))
* **frontend:** add CSP nonce middleware + security headers ([dc446f9](https://github.com/LIFEGrupi5/DashTab/commit/dc446f918a9ed9418c05f015fe3cb4f189c0500c))
* **frontend:** close FE-2 (useReducer) and FE-9 (memoization) gaps ([11acb14](https://github.com/LIFEGrupi5/DashTab/commit/11acb14c81032ef8b4fb1dd0828e96f5c6a1f70c))
* **frontend:** close FE-2 (useReducer) and FE-9 (memoization) gaps ([721a67d](https://github.com/LIFEGrupi5/DashTab/commit/721a67d46fd48fc470b1e938373ec0b4766eac2a))
* **frontend:** M2.6 + M2.8 — Jest/RTL unit tests, Playwright e2e, Li… ([1784001](https://github.com/LIFEGrupi5/DashTab/commit/1784001e74fd80df462b431c8b5ae3a0d5e91136))
* **frontend:** M2.6 + M2.8 — Jest/RTL unit tests, Playwright e2e, Lighthouse CI, GitHub Actions pipelines ([9168038](https://github.com/LIFEGrupi5/DashTab/commit/91680383d2c087589bdf88a2c5f1dc5743f6eb43))
* **frontend:** M2.8 performance baseline and M2.9 cursorrules ([6cab208](https://github.com/LIFEGrupi5/DashTab/commit/6cab208390ddf6dc0f9bd425640a8b7b43c4c7c1))
* **frontend:** performance audit + FE requirements pass (Apr 28) ([4631a14](https://github.com/LIFEGrupi5/DashTab/commit/4631a14678b6084eb4cc42da4880e27fe1869556))
* **frontend:** subscribe kitchen board to SignalR KDS hub ([c693429](https://github.com/LIFEGrupi5/DashTab/commit/c6934296a2a951123c861bdcf5fc0b4f88f2c7e3))
* **frontend:** waiter-only orders, dashboard, and role-based UI ([66da8bb](https://github.com/LIFEGrupi5/DashTab/commit/66da8bbe8db9d1c8ff0bc6b77329bcbf5d5acbb6))
* **frontend:** waiter-only orders, dashboard, and role-based UI ([a8bab56](https://github.com/LIFEGrupi5/DashTab/commit/a8bab562214d664631ec0c433bce037680c9aace))
* **frontend:** wire login to real Keycloak via backend proxy ([1b2536c](https://github.com/LIFEGrupi5/DashTab/commit/1b2536cdd68b6fe8edfd611f9ef8d3674b78f539))
* **frontend:** wire login to real Keycloak via backend proxy ([52f80fa](https://github.com/LIFEGrupi5/DashTab/commit/52f80fa1aabae24f12a3c8590c622ef1482fb28a))
* **m2.7:** add jest-axe to dependencies ([47e40ad](https://github.com/LIFEGrupi5/DashTab/commit/47e40ad030cbe6bca25a14b66999a9ee0e517293))
* **m2.7:** add jest-axe to dependencies ([fe0bf7e](https://github.com/LIFEGrupi5/DashTab/commit/fe0bf7e46c6985633495fd388a60bf72c323052b))
* **overview:** dynamic analytics, revenue forecast chart with ML too… ([0665c86](https://github.com/LIFEGrupi5/DashTab/commit/0665c86ff4628ad10159e2c9ed2d1a56cbeaa097))
* **overview:** dynamic analytics, revenue forecast chart with ML tooltip, TODO(api) markers ([118d5c6](https://github.com/LIFEGrupi5/DashTab/commit/118d5c6456c07130805cf7604c89088827aee44f))
* wire frontend to real backend API + add FluentValidation ([25612eb](https://github.com/LIFEGrupi5/DashTab/commit/25612eb3f645436fbc5446ba1fd5c8ac9a84d4a3))
* wire frontend to real backend API + add FluentValidation ([b7aa8ff](https://github.com/LIFEGrupi5/DashTab/commit/b7aa8ff9c7f4810d20d6d9f9d2df94a43ef6b715))


### Bug Fixes

* **backend:** enable CORS in production (browser login on separate subdomains) ([5c69418](https://github.com/LIFEGrupi5/DashTab/commit/5c694187b26000d551f96967a554541d7617ef9c))
* **backend:** enable CORS in production for the deployed app origin ([caf0097](https://github.com/LIFEGrupi5/DashTab/commit/caf009774acb7820f41dcffd8118f3ba968f44b2))
* **backend:** gate CORS to Development and allow SignalR credentials ([4cfa53c](https://github.com/LIFEGrupi5/DashTab/commit/4cfa53c8d8ac6645be302895fb82c4ad63281b99))
* **ci:** point dotnet commands at DashTab.API.csproj ([9dc64be](https://github.com/LIFEGrupi5/DashTab/commit/9dc64beb983960d3b13c0de214baeb28bdc01cd1))
* **devops:** correct frontend API var + backend ingress routing ([4bc2aa0](https://github.com/LIFEGrupi5/DashTab/commit/4bc2aa00625ce0adef454e0062bb0ccfb906000c))
* **devops:** deployable Helm charts + real health probes (live on project-05) ([6d0e1db](https://github.com/LIFEGrupi5/DashTab/commit/6d0e1dbfc610251b3a29e5a765e618d5dbfe94b6))
* **devops:** keycloak https issuer + backend audience (project-05) ([c721d95](https://github.com/LIFEGrupi5/DashTab/commit/c721d959d975fae98daf0415512e3c08866dbae2))
* **devops:** make Helm charts deployable + HTTP health probes ([6e96133](https://github.com/LIFEGrupi5/DashTab/commit/6e96133244ddee49678cb555f600463e5f9d7f35))
* **devops:** never log the Gemini API key on error (DO-12) ([20d29cd](https://github.com/LIFEGrupi5/DashTab/commit/20d29cd8799d83e862aed51fc2b9560f89490e2c))
* **devops:** run aiops-triage as numeric uid 10001 (DO-12) ([5a0abe7](https://github.com/LIFEGrupi5/DashTab/commit/5a0abe727835f3592459e16bf7bafc80c891415c))
* **devops:** run aiops-triage as numeric uid 10001 (DO-12) ([00311fc](https://github.com/LIFEGrupi5/DashTab/commit/00311fc765afe50e5c499f22f289d325fb28687d))
* **devops:** unbreak Keycloak compose service for local dev ([8cafc7e](https://github.com/LIFEGrupi5/DashTab/commit/8cafc7e51114fee2267a45172392851753ebefbc))
* Docker stack bring-up, backend compile errors, and frontend order flow ([bfbf928](https://github.com/LIFEGrupi5/DashTab/commit/bfbf928641e3a6648aea744c84ff8888dcd3ffc3))
* **e2e:** mock API routes so tests pass without a live backend ([0ee11e0](https://github.com/LIFEGrupi5/DashTab/commit/0ee11e067f7a1e376f1bae6c8053ba0c5db4ee83))
* **e2e:** update fixtures and login spec for Keycloak auth shape ([6eafcc2](https://github.com/LIFEGrupi5/DashTab/commit/6eafcc2a67faef0c0bf36df87a0501ea07d126e2))
* **e2e:** use owner role in fixtures + rename use to apply to fix lint ([f5c5d1f](https://github.com/LIFEGrupi5/DashTab/commit/f5c5d1f194e2582a0742d1d847beae31e46714c2))
* **frontend:** dark-mode classes across pages and responsive sidebar ([183d9ce](https://github.com/LIFEGrupi5/DashTab/commit/183d9ce0cb576a1ad4343dd57f8796f8ecec41b4))
* **frontend:** dark-mode classes across pages and responsive sidebar ([0c20b36](https://github.com/LIFEGrupi5/DashTab/commit/0c20b36c7f014aa8c284460f96410403927c81a5))
* **frontend:** debounce KDS refetch with a max-wait ceiling ([ca85a33](https://github.com/LIFEGrupi5/DashTab/commit/ca85a332a3fb5c5af822868d4f9afe3c0440de50))
* **frontend:** fix flex layout for kitchen board and overview charts ([39085f2](https://github.com/LIFEGrupi5/DashTab/commit/39085f233833e76b52eb5dc0ab192f33bd01dfce))
* **frontend:** migrate to ESLint CLI and loosen Lighthouse CI assertions ([0265f31](https://github.com/LIFEGrupi5/DashTab/commit/0265f31d60c9e559b8d1228bb6faa2191a966525))
* **frontend:** migrate to ESLint CLI and loosen Lighthouse CI assertions ([cbc2918](https://github.com/LIFEGrupi5/DashTab/commit/cbc2918a0c544c89616df36ef37ae13c431f2e94))
* **frontend:** resolve lint & typecheck errors breaking CI ([c016e30](https://github.com/LIFEGrupi5/DashTab/commit/c016e306a759c0bc08b515932fcbe373b9703a1a))
* **frontend:** single-flight token refresh to stop refresh storm ([b98e790](https://github.com/LIFEGrupi5/DashTab/commit/b98e79032aed06da93d2f24b9d677cc08e58d5ee))
* **frontend:** skip double-tap home navigation on interactive elements ([2f9ba5e](https://github.com/LIFEGrupi5/DashTab/commit/2f9ba5e3a5f94248bc9e3b406cb0962517920ac4))
* **frontend:** stop auth refresh storm + debounce KDS refetch ([c72436d](https://github.com/LIFEGrupi5/DashTab/commit/c72436dcae50af5e6dbeba97ad171199e056cd1a))
* **frontend:** wire up staff and menu item creation ([0ebe726](https://github.com/LIFEGrupi5/DashTab/commit/0ebe726e65d69e11718827d476b8d1073e55d3d3))
* prod auth (issuer/audience) + apply EF migrations on startup ([edb90d7](https://github.com/LIFEGrupi5/DashTab/commit/edb90d7d7de726f4daa26511c3f37c9976fe7aed))
* **rbac+validation:** tighten UsersController role gating + menu item name min-length ([5122f6e](https://github.com/LIFEGrupi5/DashTab/commit/5122f6e56a636269691f1030d3e3bd73e048908d))
* **rbac+validation:** tighten UsersController role gating + menu item name min-length ([018a5a6](https://github.com/LIFEGrupi5/DashTab/commit/018a5a6314d0e401fee51700cb494b024184bc6b))
* resolve merge conflicts with development (Keycloak auth + RBAC) ([3282d27](https://github.com/LIFEGrupi5/DashTab/commit/3282d2796718b9de468ec6a866782b486c6ecd0b))


### CI/CD

* **devops:** add CD workflow to build & push images to GHCR (DO-4/DO-13) ([4c4f087](https://github.com/LIFEGrupi5/DashTab/commit/4c4f087454e242121ebb80a93915171740107805))
* **devops:** add gated Helm deploy to project-05 (DO-4/DO-13) ([688ba2e](https://github.com/LIFEGrupi5/DashTab/commit/688ba2ebef38c15c7f615ce46a70d7134c7c719d))
* **devops:** add gated Helm deploy to project-05 (DO-4/DO-13) ([295d77c](https://github.com/LIFEGrupi5/DashTab/commit/295d77ce0888ce8e7a347df34e560a88ba4f4d08))
* **devops:** add release-please for automated changelog + semver (DO-13) ([b4badb9](https://github.com/LIFEGrupi5/DashTab/commit/b4badb91fe170deb2e132a21c6de1c5dc8e2f665))
* **devops:** build & deploy aiops-triage image in CD (DO-12) ([40851e0](https://github.com/LIFEGrupi5/DashTab/commit/40851e0aa17b35f45a1e59224509c90943981767))
* **devops:** CD workflow — build & push images to GHCR (DO-4 phase 1) ([58b1ac2](https://github.com/LIFEGrupi5/DashTab/commit/58b1ac21b67ffe70caf136c573c7148fcaec1c9a))
* **devops:** deploy prometheus + grafana via CD with path filters (DO-4/DO-5) ([721eaac](https://github.com/LIFEGrupi5/DashTab/commit/721eaac23c1cae447e93878ec5f19673e9588271))
* **devops:** deploy prometheus + grafana via CD with path filters (DO-4/DO-5) ([fbd8de6](https://github.com/LIFEGrupi5/DashTab/commit/fbd8de679db725c9a83094656f6642d39fd9dc08))


### Documentation

* **devops:** add DevOps coursework handoff/progress notes ([b3e96bb](https://github.com/LIFEGrupi5/DashTab/commit/b3e96bb52443529682ed6eb8db298c24f580b25b))
* log Apr 28 session entries [#56](https://github.com/LIFEGrupi5/DashTab/issues/56)–[#64](https://github.com/LIFEGrupi5/DashTab/issues/64) in ai-logs.md ([4631a14](https://github.com/LIFEGrupi5/DashTab/commit/4631a14678b6084eb4cc42da4880e27fe1869556))
* refresh CLAUDE.md and README to match current state ([d1ccae6](https://github.com/LIFEGrupi5/DashTab/commit/d1ccae68dc9a75c695cb44e13fb04aebbe13d3e9))
* update AI log with M2.8 session entries ([8e65226](https://github.com/LIFEGrupi5/DashTab/commit/8e65226cc12dcbfb6ae4b0f874a2081f20b59b62))
* update ai-logs with session entries [#97](https://github.com/LIFEGrupi5/DashTab/issues/97)-[#98](https://github.com/LIFEGrupi5/DashTab/issues/98) ([158e0ce](https://github.com/LIFEGrupi5/DashTab/commit/158e0cec6114d8cb75c118c532ee044add20a115))


### Chores

* **devops:** confirm letsencrypt-prod ClusterIssuer across ingresses (DO-10) ([879c4d2](https://github.com/LIFEGrupi5/DashTab/commit/879c4d2648738a29ef95742bd1a19afcc8a45501))
* **devops:** one-command dev environment with all services ([8eaddee](https://github.com/LIFEGrupi5/DashTab/commit/8eaddee6817b1dd38281e0c036de062ab6cffb87))
* remove committed build artifacts, add .NET bin/obj to gitignore ([da3ee78](https://github.com/LIFEGrupi5/DashTab/commit/da3ee7896b1105865831cc1b054d9e7eba255bc5))
* set up project structure and README ([e58e5f4](https://github.com/LIFEGrupi5/DashTab/commit/e58e5f47d093c5204ad53d621727dc7311bce64f))
