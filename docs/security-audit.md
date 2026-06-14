# DashTab Security Audit

> Evidence report for the security posture of DashTab.
> Satisfies **DO-9** (security hardening), **FS-5** (security audit), and **M5.5**
> (audit report) — one body of work, three tracking labels.

## 1. Posture — the five shift-left layers

DashTab scans at every layer from source code to the running application:

| Layer            | Tool                                   | Where                                  | Gate?                          |
|------------------|----------------------------------------|----------------------------------------|--------------------------------|
| Source code      | **CodeQL** (C#, JS/TS, Python)         | `.github/workflows/codeql.yml`         | Reports to Security tab (advisory) |
| Secrets          | **TruffleHog** + GitHub native scanning| `.github/workflows/secret-scan.yml` + repo settings | PR + push-protection gate |
| Dependencies     | **Dependabot**                         | `.github/dependabot.yml`               | Alerts + update PRs            |
| Container image  | **Trivy** (HIGH/CRITICAL)              | `.github/workflows/cd.yml`             | Hard gate (`exit-code: 1`)     |
| Running app (DAST) | **OWASP ZAP** baseline scan          | `.github/workflows/dast.yml` (`zap.yaml` rules) | Reports to Security tab (advisory) |

Supporting controls already in place:

- **Azure Key Vault** — runtime secrets fetched at deploy time, masked in logs (`cd.yml`).
- **Content-Security-Policy** headers on the frontend.
- **Keycloak** auth (JWT, httpOnly cookies) with multi-tenant isolation.

> The repository is **public**, so CodeQL code scanning, native secret scanning,
> and push protection are all free — no GitHub Advanced Security licence.

## 1a. DAST — OWASP ZAP penetration scan

The `dast.yml` workflow runs an **OWASP ZAP baseline scan** against the running
application (spun up via Docker Compose in CI), exercising the live HTTP surface
rather than the source. Rules are tuned in `zap.yaml` (false positives such as
informational headers are suppressed; real findings are kept).

- **What it covers:** OWASP-style passive + active baseline checks — missing
  security headers, cookie flags, reflected inputs, CSP, etc., against the
  actually-served pages and API.
- **Run cadence:** on the DAST workflow trigger; the HTML report (`report.html`)
  is produced as the scan artifact (kept out of git via `.gitignore`).
- **Notable investigation:** a flagged `/login?demo=1` reflected-input case was
  investigated and confirmed **not exploitable** — the demo parameter only
  pre-fills a known demo credential into a controlled React state value; it is
  not rendered as raw HTML (React escapes it) and carries no privileged token.
- **Headers in place** (verified by the scan): CSP nonce middleware, HSTS via
  Nginx TLS, httpOnly + SameSite cookies for auth.

## 2. Label mapping

| Label | Meaning                | Satisfied by                                                       |
|-------|------------------------|--------------------------------------------------------------------|
| DO-9  | Security hardening     | CodeQL + secret scanning + Dependabot land (alongside existing Trivy / Key Vault) |
| FS-5  | Security audit         | Static (CodeQL) + secrets (TruffleHog) + deps (Dependabot) + image (Trivy) + **DAST (OWASP ZAP)** — findings in the **Security** tab + ZAP report artifact |
| M5.5  | Security audit report  | This document + the exported findings snapshot below               |

## 3. How findings flow

- **CodeQL** uploads SARIF results to **Security → Code scanning** on every push/PR
  to `main`/`development` and weekly.
- **Secret scanning** (TruffleHog) fails its check on a *verified* secret; GitHub
  **push protection** blocks a `git push` that contains a recognised token.
- **Dependabot** opens alerts under **Security → Dependabot** and raises update PRs.
- **Trivy** fails the delivery pipeline on HIGH/CRITICAL image vulnerabilities.

CodeQL and TruffleHog are **non-blocking on the rest of CI** — they run as
independent jobs and do not change how `backend-ci`, `frontend-ci`, `cd`, or
`release` behave.

## 4. Reproducing / exporting the evidence

Export current code-scanning findings (run after the first CodeQL run completes):

```bash
gh api repos/LIFEGrupi5/DashTab/code-scanning/alerts \
  --jq 'group_by(.rule.security_severity_level)[] | {severity: .[0].rule.security_severity_level, count: length}'
```

Other useful queries:

```bash
gh api repos/LIFEGrupi5/DashTab/dependabot/alerts --jq 'length'      # open dependency alerts
gh api repos/LIFEGrupi5/DashTab/secret-scanning/alerts --jq 'length' # open secret alerts
```

## 5. Findings snapshot

_Fill in after the first scan run on this branch's PR._

| Category               | Critical | High | Medium | Low | Date |
|------------------------|---------:|-----:|-------:|----:|------|
| CodeQL (code scanning) |          |      |        |     |      |
| Secret scanning        |          |      |        |     |      |
| Dependabot             |          |      |        |     |      |
| Trivy (latest image)   |          |      |        |     |      |
