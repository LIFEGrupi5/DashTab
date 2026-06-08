# Security Policy

## Supported versions

DashTab is pre-1.0 and ships from the `main` release branch. Security fixes are
applied to the latest released minor only.

| Version        | Supported          |
|----------------|--------------------|
| latest `0.x`   | :white_check_mark: |
| older          | :x:                |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through GitHub's **private vulnerability reporting**:
*Security* tab → *Report a vulnerability*. This opens a confidential advisory
visible only to the maintainers.

We aim to acknowledge a report within **3 working days** and to agree on a
disclosure timeline once the issue is confirmed.

## How we find issues

DashTab runs automated security tooling on every change (see
[`docs/security-audit.md`](docs/security-audit.md) for the full posture):

- **CodeQL** — static analysis (SAST) of C#, TypeScript/JavaScript, and Python.
- **TruffleHog** + **GitHub native secret scanning / push protection** — committed-credential detection.
- **Dependabot** — dependency vulnerability alerts and update PRs.
- **Trivy** — container-image vulnerability scanning in the delivery pipeline.

Findings are tracked in the repository **Security** tab.
