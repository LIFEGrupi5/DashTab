# Changelog

## [0.4.0](https://github.com/LIFEGrupi5/DashTab/compare/v0.3.0...v0.4.0) (2026-06-14)


### Features

* add empty states to orders, menu, and staff pages ([ca748de](https://github.com/LIFEGrupi5/DashTab/commit/ca748dec833ff9db2812cb8dc72543ae3ace7206))
* **ai:** Phase 1B customer menu recommendation (RAG + pgvector + OpenAI) + project docs ([#165](https://github.com/LIFEGrupi5/DashTab/issues/165)) ([7949a4d](https://github.com/LIFEGrupi5/DashTab/commit/7949a4df2ec17ec4886ae05d892f657d5a356cb3))
* **analytics:** define and track North Star Metric (M6.2) ([c449549](https://github.com/LIFEGrupi5/DashTab/commit/c4495498c0874592d6adb463ad3f94e41fc02375))
* **analytics:** M6.4 A/B test design — pricing page experiment + restaurant group identification ([#154](https://github.com/LIFEGrupi5/DashTab/issues/154)) ([9559daa](https://github.com/LIFEGrupi5/DashTab/commit/9559daa285779ce9966a9780e60f50896d10bbfa))
* **analytics:** track subscription_checkout_completed to close onboarding funnel ([6e5f5f4](https://github.com/LIFEGrupi5/DashTab/commit/6e5f5f4c2414ea41523f16ae11fd81857f9a0527))
* **authz:** let managers manage staff, except the Owner role ([a416231](https://github.com/LIFEGrupi5/DashTab/commit/a41623107eb8a00ee83dd63a8f603ad6f8c3cc4e))
* **authz:** managers manage staff (except Owner) + frontend Trivy fix ([a269597](https://github.com/LIFEGrupi5/DashTab/commit/a2695978fe1a2fba54a338e6be74b610d77ed8b6))
* **backend:** add pagination (?skip=&take=) to menu-items, orders, and users endpoints (BE-2) ([#103](https://github.com/LIFEGrupi5/DashTab/issues/103)) ([db72787](https://github.com/LIFEGrupi5/DashTab/commit/db72787e04cd415aff49e368dc093ab46729e2ac))
* **backend:** wire MediatR + FluentValidation pipeline behavior ([50953e7](https://github.com/LIFEGrupi5/DashTab/commit/50953e76a65a91ceb8f5c614ed4a1c4ee49b547a))
* **branding:** add chef-hat favicon ([4ee676b](https://github.com/LIFEGrupi5/DashTab/commit/4ee676b0d4e119eb5889459c3c6114879bb9096b))
* **cd:** bake NEXT_PUBLIC_POSTHOG_KEY into frontend image at build time ([7670c7c](https://github.com/LIFEGrupi5/DashTab/commit/7670c7c29c1b2cce99f03c6c34cff21ff6988892))
* **devops:** add Trivy image scanning as a CI gate (DO-9) ([807ae8e](https://github.com/LIFEGrupi5/DashTab/commit/807ae8eb31ae5a902e6a62ac60f3d59c5034351a))
* **devops:** add Trivy image scanning as a CI gate (DO-9) ([6a54eec](https://github.com/LIFEGrupi5/DashTab/commit/6a54eec5c7102dba751105ebab53dcf554671606))
* **devops:** add uptime-kuma helm chart for project-05 (DO-7) ([a215d9d](https://github.com/LIFEGrupi5/DashTab/commit/a215d9df5a5d8162746809b5b94a8f7a1645c22a))
* **devops:** add uptime-kuma to observability compose profile (DO-7) ([ba45d0f](https://github.com/LIFEGrupi5/DashTab/commit/ba45d0f2c580d1c471d6278ddc1923571571574b))
* **devops:** fetch backend secrets from Azure Key Vault at deploy; scrub plaintext (DO-9) ([af35be4](https://github.com/LIFEGrupi5/DashTab/commit/af35be485471179b6a4ae1642b6898d813b26353))
* **devops:** observability + security hardening ([f0fec4c](https://github.com/LIFEGrupi5/DashTab/commit/f0fec4c505593a7e378f6bafbaada36079243845))
* dynamic menu categories, owner/manager add-category button, middleware perf fix ([#96](https://github.com/LIFEGrupi5/DashTab/issues/96)) ([5d2b472](https://github.com/LIFEGrupi5/DashTab/commit/5d2b47225dcde056986f0c48ef8417f4aee707b7))
* **frontend:** integrate PostHog analytics ([0e03aa2](https://github.com/LIFEGrupi5/DashTab/commit/0e03aa2f7ec5e4aa23e43cd4064c93a645d468b7))
* **marketing:** add AI recommendation section with scan-to-try QR code ([#173](https://github.com/LIFEGrupi5/DashTab/issues/173)) ([7ab73c5](https://github.com/LIFEGrupi5/DashTab/commit/7ab73c5fd3f57cdd7f82ca83180984a6c3652427))
* ML revenue forecast (per-restaurant) ([63b5f9a](https://github.com/LIFEGrupi5/DashTab/commit/63b5f9abb8e6f9b49f8b12431061dfd3d420ff89))
* move auth tokens from localStorage to httpOnly cookies ([#99](https://github.com/LIFEGrupi5/DashTab/issues/99)) ([5eae4df](https://github.com/LIFEGrupi5/DashTab/commit/5eae4df1b80e9d7cff79ae8b4843deaea0f17f81))
* multi-tenancy foundation — Restaurant entity, tenant isolation, scoped caches and SignalR ([332bf86](https://github.com/LIFEGrupi5/DashTab/commit/332bf86029cc929d1697d8cf86e5038e0a92ce45))
* multi-tenancy foundation — Restaurant entity, tenant isolation,… ([264f58d](https://github.com/LIFEGrupi5/DashTab/commit/264f58d547911d70365063ddb0e2479528662c75))
* redesign login page and add restaurant registration page ([2c723f2](https://github.com/LIFEGrupi5/DashTab/commit/2c723f24f779cf4ea0906752080e449e5967bfd6))
* refactor Button className with twMerge and add full-form validation on MultiStepForm submit ([18df915](https://github.com/LIFEGrupi5/DashTab/commit/18df915f2c41447242c8071d2017a3a6e2ca0f86))
* restaurant onboarding endpoint — POST /api/restaurants/register ([2a006fd](https://github.com/LIFEGrupi5/DashTab/commit/2a006fdeed9493d66aa0e25fb5b3aab3d005a5d5))
* restaurant settings page + onboarding checklist ([224ac31](https://github.com/LIFEGrupi5/DashTab/commit/224ac31976a74ce8409d82dcd69d98bb9b7f9f4a))
* restaurant settings page + onboarding checklist ([877b75e](https://github.com/LIFEGrupi5/DashTab/commit/877b75e631201240534eafee8692092d1bbc0c8c))
* staff Keycloak integration + empty states ([9f431b1](https://github.com/LIFEGrupi5/DashTab/commit/9f431b1ea3c1ccb7c35fabd37a5009906b641449))
* subscription plans with Stripe checkout + staff-limit gating ([e48e1ed](https://github.com/LIFEGrupi5/DashTab/commit/e48e1ed7a49af72f58e109954c73f3d88adcb6c7))
* subscription plans with Stripe checkout + staff-limit gating ([04a7eff](https://github.com/LIFEGrupi5/DashTab/commit/04a7effd3b57daf7b25a221795c969d5b9bdeb5a))
* wire staff creation/deactivation through Keycloak — extract KeycloakAdminService, add temporary password to staff form ([fc28bc0](https://github.com/LIFEGrupi5/DashTab/commit/fc28bc096d91835f1b51ea3eb310cadecc1ffd74))


### Bug Fixes

* add /v1 prefix to restaurants controller route ([0fc3108](https://github.com/LIFEGrupi5/DashTab/commit/0fc310867335b4ac6ff8c6d2410b7dcf2dc9cd0f))
* add /v1 prefix to restaurants controller route ([e50b5c3](https://github.com/LIFEGrupi5/DashTab/commit/e50b5c3b4b1e35140cf157322a54b4541aa5da13))
* add Password arg to CreateStaffRequest in UserMapperTests ([25548e2](https://github.com/LIFEGrupi5/DashTab/commit/25548e202536bd5583ff06c7352ef7e38cf12efe))
* add Password arg to CreateStaffRequest in UserMapperTests ([276e1dd](https://github.com/LIFEGrupi5/DashTab/commit/276e1dd7d9b61ef33ab234a4648d1c5637c658ab))
* **analytics:** guard PostHog init and calls when key is absent ([fb38f12](https://github.com/LIFEGrupi5/DashTab/commit/fb38f12adf043ff89d3af085ecaf98b4bd3ff541))
* **auth:** link the brand logo to the landing page ([c3bd315](https://github.com/LIFEGrupi5/DashTab/commit/c3bd315ca1d6ddad89d8d211084fd7d12fe28289))
* **auth:** read roles from the Keycloak "roles" claim ([c12dac8](https://github.com/LIFEGrupi5/DashTab/commit/c12dac8835169893afe460d69b23f46fbc5ff012))
* **backend:** fail-fast Redis so a misconfigured cache can't stall every request ([e02c4fd](https://github.com/LIFEGrupi5/DashTab/commit/e02c4fd5b3b62b04ef03c11956a81e577af8cd42))
* **backend:** fail-fast Redis so a misconfigured cache can't stall every request ([5c82f97](https://github.com/LIFEGrupi5/DashTab/commit/5c82f974f70467bafc3b561e649e37f3f3fc253f))
* **backend:** forward Keycloak admin creds to backend in compose for local registration parity ([f79c555](https://github.com/LIFEGrupi5/DashTab/commit/f79c555c6f55d7e8fee16292b5cd3b830c3710d1))
* **cd:** escape commas in Redis connection string for helm --set ([#172](https://github.com/LIFEGrupi5/DashTab/issues/172)) ([3751abd](https://github.com/LIFEGrupi5/DashTab/commit/3751abd75ba6126aad940e35ac602bd8d6fc51b3))
* **ci:** bust stale frontend build cache (Trivy gate failure) ([7be9843](https://github.com/LIFEGrupi5/DashTab/commit/7be9843f67da3c092270d84b74e993dcb07f3b53))
* **ci:** drop npm from frontend runtime image (Trivy gate) ([2eb126d](https://github.com/LIFEGrupi5/DashTab/commit/2eb126d39e8682d3565ae4b1ca0ca4636f6f0309))
* clear MessagePack CVE and clean up marketing copy ([61278cb](https://github.com/LIFEGrupi5/DashTab/commit/61278cb01a23c806b7dd0ebe38e592908229a4a1))
* clear MessagePack CVE and clean up marketing copy ([3aa29bf](https://github.com/LIFEGrupi5/DashTab/commit/3aa29bf5e9f8d78c67f61f22b58d3aa32d972432))
* clear query cache on account switch + restore GHCR pull secret ([4aae9df](https://github.com/LIFEGrupi5/DashTab/commit/4aae9df7c1fe61c4fe5c209e990caddbb51ca678))
* close more multi-tenancy holes (FindAsync bypass, global category index, auth lookup) ([ad5dfea](https://github.com/LIFEGrupi5/DashTab/commit/ad5dfeabb5bcdb2378d57a4f848f8baa728987c9))
* construct StripeService lazily so the gate middleware resolves without a Stripe key ([69c747f](https://github.com/LIFEGrupi5/DashTab/commit/69c747f794dc36b5196c33e991bcf4ccb2a64df3))
* **devops:** post-review hardening — helm/security, aiops, docs, IaC ([6238a41](https://github.com/LIFEGrupi5/DashTab/commit/6238a41527a908351245e4ea7d9f8766461c95dd))
* **devops:** restore GHCR pull secret on project-05 pods ([d31e9b5](https://github.com/LIFEGrupi5/DashTab/commit/d31e9b5bed4b52da64833cf2f9a1f6bd7cc17909))
* **devops:** skip npm internal modules in frontend Trivy scan ([2516e96](https://github.com/LIFEGrupi5/DashTab/commit/2516e968ae9eb192eb84f4d5afdf28acff5ba0bd))
* **devops:** skip npm internal modules in frontend Trivy scan ([654aa4f](https://github.com/LIFEGrupi5/DashTab/commit/654aa4f94b22dc17f58b866aa12cc8628e5c24e7))
* **devops:** update trivy-action to v0.36.0 (0.28.0 does not exist) ([f5c04aa](https://github.com/LIFEGrupi5/DashTab/commit/f5c04aa14fd1ffae354487eea91659e69a18b236))
* **devops:** update trivy-action to v0.36.0 (0.28.0 does not exist) ([70df643](https://github.com/LIFEGrupi5/DashTab/commit/70df64384faf98a7d6a007dbb1a98c80af1833cd))
* **docker:** declare ARG NEXT_PUBLIC_POSTHOG_KEY in Dockerfile so ([9355527](https://github.com/LIFEGrupi5/DashTab/commit/93555274988c8c6f4526dd6ff53e777d25397f96))
* **docker:** declare ARG NEXT_PUBLIC_POSTHOG_KEY in Dockerfile so ([3c94670](https://github.com/LIFEGrupi5/DashTab/commit/3c9467031c28670896e9ffadf6520a89a1d53245))
* enforce strict tenant isolation (close cross-restaurant data leak) ([fb5ccb1](https://github.com/LIFEGrupi5/DashTab/commit/fb5ccb1a482744885948062a5dc20e6ae9d19b9f))
* **fonts:** self-host Space Grotesk and JetBrains Mono to fix CI build ([7f55ef7](https://github.com/LIFEGrupi5/DashTab/commit/7f55ef7f98c1a7c05ad4ec0eda71515116c2a18f))
* frontend build-cache (Trivy) + block waiter/kitchen from manager pages ([6676f7b](https://github.com/LIFEGrupi5/DashTab/commit/6676f7b90db32d1bfe78d1d2f5c6d66a3b304b66))
* **frontend:** harden security headers ([728de11](https://github.com/LIFEGrupi5/DashTab/commit/728de114fd677d3a814af209a65fac4a008c9acf))
* **frontend:** harden security headers ([4e31d52](https://github.com/LIFEGrupi5/DashTab/commit/4e31d52f16012e8624c03f456acc6fce47de123f))
* **frontend:** patch base-image OpenSSL CVE failing the Trivy gate ([8acc6ec](https://github.com/LIFEGrupi5/DashTab/commit/8acc6ece9b4989e0aca0e43a80871ff018c35b14))
* **frontend:** re-derive user role from new token on refresh so Keycloak role changes propagate without re-login ([#98](https://github.com/LIFEGrupi5/DashTab/issues/98)) ([a4e637f](https://github.com/LIFEGrupi5/DashTab/commit/a4e637f4b7031b1be3443579f93ef494d623f5a6))
* **frontend:** remove minimatch override — breaks eslint default import ([17d8c9a](https://github.com/LIFEGrupi5/DashTab/commit/17d8c9ada89ffbe54beab051657eff1a8b14afb1))
* **frontend:** restore pre-filled demo credentials and show emails in demo buttons to fix E2E tests ([c8ecd21](https://github.com/LIFEGrupi5/DashTab/commit/c8ecd2126d55b4dee69ab75737934657c6df9084))
* **frontend:** upgrade next to 15.5.19 and override vulnerable transitive deps ([dc02d7b](https://github.com/LIFEGrupi5/DashTab/commit/dc02d7ba5d179bdfee67a7a1017dd6f29a4188c7))
* **kds:** probe Redis before enabling SignalR backplane ([9044e27](https://github.com/LIFEGrupi5/DashTab/commit/9044e2751f3e23498a5e8aebf9a3c2f7849af8f6))
* **kds:** stop SignalR 1011 reconnect storm ([6f0f298](https://github.com/LIFEGrupi5/DashTab/commit/6f0f2981bd67ba01586dee5c3acbd67570408390))
* **orders:** derive new-order category chips from real categories ([4268107](https://github.com/LIFEGrupi5/DashTab/commit/426810724e9ec567f87e2a5d321cb7dd75bb30c0))
* read Keycloak admin password from cluster secret instead of values.yaml ([0b145b0](https://github.com/LIFEGrupi5/DashTab/commit/0b145b083608fc8a64870d9fbcaff7413c11fdeb))
* remove duplicate recommend page from marketing route group ([5232968](https://github.com/LIFEGrupi5/DashTab/commit/5232968db8d577f1099ce5eb04101762fa8b6d30))
* **security:** clear query cache on account switch (cross-tenant leak) ([656f633](https://github.com/LIFEGrupi5/DashTab/commit/656f633c06e346e73e4e81075b403d6b2540c0df))
* **security:** confine each role to its own pages (route allow-list) ([2ea052b](https://github.com/LIFEGrupi5/DashTab/commit/2ea052b9bb69646ececbb5fd00104cc3819221e7))
* set correct Keycloak admin password for registration flow ([0e5b02d](https://github.com/LIFEGrupi5/DashTab/commit/0e5b02db00670139b3f285abe33ee5a455b13a0d))
* simplify aiops CI to lint, deps, and docker build only ([61180c8](https://github.com/LIFEGrupi5/DashTab/commit/61180c8f058307304eca4703f59a68c9e35b7549))
* smoke test aiops via in-cluster curl pod instead of local container ([56c7b0a](https://github.com/LIFEGrupi5/DashTab/commit/56c7b0a313e22fed0da3ed6a6117df5932abe939))
* **subscriptions:** invalidate Redis tenant cache after Stripe payment confirms ([#171](https://github.com/LIFEGrupi5/DashTab/issues/171)) ([6b80233](https://github.com/LIFEGrupi5/DashTab/commit/6b80233641e9c3824612e51bf69f90eb7f094d86))


### Performance

* **backend:** cache per-user tenant context to skip DB lookup on eve… ([28bfdaa](https://github.com/LIFEGrupi5/DashTab/commit/28bfdaa756dacda1c16826ae64a48d9accccbe02))
* **backend:** cache per-user tenant context to skip DB lookup on every request ([368e336](https://github.com/LIFEGrupi5/DashTab/commit/368e336b8a7dc27361d2033fccc84c40b0e742b0))
* **frontend:** cut first-load JS 30-36% by lazy-loading PostHog & framer-motion ([5d1070d](https://github.com/LIFEGrupi5/DashTab/commit/5d1070d6e6d987d468187c4945f44da25ef56c1f))


### CI/CD

* add AIOps CI pipeline (lint, deps, docker build + smoke test) ([57c7f98](https://github.com/LIFEGrupi5/DashTab/commit/57c7f98996ef690225896bbc53b06c730c7cf94b))
* add CI Gate aggregator (single required check) ([6bc8181](https://github.com/LIFEGrupi5/DashTab/commit/6bc818149d4273453341593ec75340703e39d889))
* add gitleaks secret scanning ([cbf0a5a](https://github.com/LIFEGrupi5/DashTab/commit/cbf0a5aa576d86c68edc6cef72fa3bdc6f98b2e6))
* add scheduled OWASP ZAP baseline DAST ([38a03c5](https://github.com/LIFEGrupi5/DashTab/commit/38a03c51787ad6bef2444cf59ac7cd55309cdacb))
* add Trivy filesystem scan + per-image SBOMs ([55352e6](https://github.com/LIFEGrupi5/DashTab/commit/55352e61b927e7649a0f711987c8478041af7fdf))
* cancel superseded runs + cache Playwright browsers ([3c85d39](https://github.com/LIFEGrupi5/DashTab/commit/3c85d39cbccff6aaea4af9372b3d89b9411154ba))
* **cd:** atomic helm deploys with auto-rollback ([7788cfd](https://github.com/LIFEGrupi5/DashTab/commit/7788cfd276b88b6a85e35956fbe750588f7d9cdd))
* **cd:** per-image cache scopes, fix obs deploy race, add timeouts ([25f51cf](https://github.com/LIFEGrupi5/DashTab/commit/25f51cfe1acba27b074514fbd202c457c9c01228))
* move Trivy filesystem scan from cd.yml to secret-scan.yml ([98424cb](https://github.com/LIFEGrupi5/DashTab/commit/98424cb814906b60655d282a9b6a371734796f33))
* scope release to development, trim redundant scans, add timeouts ([607bbf4](https://github.com/LIFEGrupi5/DashTab/commit/607bbf49cb425ab8eae8113d67f28394b6f289b4))
* **security:** add CodeQL, secret scanning, and Dependabot (DO-9/FS-5/M5.5) ([4536396](https://github.com/LIFEGrupi5/DashTab/commit/453639699bd251e7a9d4cc1a64def344601dedc7))
* **security:** CodeQL + secret scanning + Dependabot (DO-9 / FS-5 / M5.5) ([4da76ec](https://github.com/LIFEGrupi5/DashTab/commit/4da76ec0f6db0f726cc7597e5cc8e8393da5157b))
* unify backend/frontend/aiops CI into one workflow with native ci-pass gate ([c5f8b05](https://github.com/LIFEGrupi5/DashTab/commit/c5f8b05eaf7c5a7f17371e93cf048e571f50d507))


### Refactors

* **backend:** make MediatR ValidationBehavior the sole validation path ([858e3a3](https://github.com/LIFEGrupi5/DashTab/commit/858e3a30231c3f0c5453f371edc2854085e27a9e))
* **backend:** move Analytics/Forecast to CQRS handler ([4438183](https://github.com/LIFEGrupi5/DashTab/commit/44381831ff5696163ed18bc6dc6e8fcc7c2ceebd))
* **backend:** move Auth to CQRS handlers ([e0f7822](https://github.com/LIFEGrupi5/DashTab/commit/e0f7822fcd9a00a66e080ff6cb130b61701336ca))
* **backend:** move Categories to CQRS handlers ([0548dbe](https://github.com/LIFEGrupi5/DashTab/commit/0548dbe207b55a6f4f83be2dad22ad67a0637166))
* **backend:** move MenuItems to CQRS handlers ([1051948](https://github.com/LIFEGrupi5/DashTab/commit/1051948a8105432bbfc3613837dd675813ed3395))
* **backend:** move Orders to CQRS handlers ([dbaa5fd](https://github.com/LIFEGrupi5/DashTab/commit/dbaa5fd762306c35173b228373d0ec7139902734))
* **backend:** move Restaurants to CQRS handlers ([340b7ae](https://github.com/LIFEGrupi5/DashTab/commit/340b7ae6980d0a20b2230f5afdebc000719c3e0a))
* **backend:** move Subscriptions to CQRS handlers ([3ef581b](https://github.com/LIFEGrupi5/DashTab/commit/3ef581b7642420ddc6bca5b1777bd38be9ac0d5e))
* **backend:** move Users (Staff) to CQRS handlers ([f4c9518](https://github.com/LIFEGrupi5/DashTab/commit/f4c95185994db31befa9a4cc6e199c43302f4fdc))


### Documentation

* **devops:** log pipeline optimization (ai-logs [#149](https://github.com/LIFEGrupi5/DashTab/issues/149)) ([33c64e2](https://github.com/LIFEGrupi5/DashTab/commit/33c64e2da67e7e6a8a13c79369572cad4f27db1d))
* **devops:** record security + infra hardening ([a1d28e8](https://github.com/LIFEGrupi5/DashTab/commit/a1d28e8dcfeee6c1dc08f72600638f6099763971))
* foundation (PM-1/PM-5), performance audit (FS-4), security DAST writeup (FS-5) ([#169](https://github.com/LIFEGrupi5/DashTab/issues/169)) ([eef6967](https://github.com/LIFEGrupi5/DashTab/commit/eef6967961fde49ed2032172583f6b277e2c59e2))
* session notes and AI log for Jun 14 fixes ([cca4526](https://github.com/LIFEGrupi5/DashTab/commit/cca4526d0315d954f5d777e8bbee809224421396))
* sync README + CLAUDE.md files with current state ([da9359b](https://github.com/LIFEGrupi5/DashTab/commit/da9359b9558f8185f897c340b2c9f0f54962f8d3))


### Chores

* **devops:** remove empty k8s kustomize stubs ([376ef35](https://github.com/LIFEGrupi5/DashTab/commit/376ef35158bd8734cef0d963e4d96f118ce4a68c))
* **docs:** update root CLAUDE.md with full project context ([45feca9](https://github.com/LIFEGrupi5/DashTab/commit/45feca9245fb5edde4e6db261b7a50fb5dd21e8f))
* **merge:** merge development into feat/posthog-analytics ([1063848](https://github.com/LIFEGrupi5/DashTab/commit/10638482f5d91f26b80dfc0c294b9726b68348c5))
* rewrite README and remove stale scaffolding ([feee2a0](https://github.com/LIFEGrupi5/DashTab/commit/feee2a0c0a7be744e2e62a0221c0f7bce8e765e7))

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
