FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* are inlined into the bundle at build time, so they must be
# present here (not at runtime). Passed via --build-arg from CI; the default
# keeps local `docker build` working without args.
# The app reads exactly ONE public var (the KDS hub URL derives from it);
# auth goes through the backend, so no NEXT_PUBLIC_KEYCLOAK_* are needed.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

ARG NEXT_PUBLIC_POSTHOG_KEY=
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY

ARG NEXT_PUBLIC_UNLEASH_FRONTEND_URL=
ENV NEXT_PUBLIC_UNLEASH_FRONTEND_URL=$NEXT_PUBLIC_UNLEASH_FRONTEND_URL

ARG NEXT_PUBLIC_UNLEASH_FRONTEND_TOKEN=
ENV NEXT_PUBLIC_UNLEASH_FRONTEND_TOKEN=$NEXT_PUBLIC_UNLEASH_FRONTEND_TOKEN

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Patch base-image OS packages before shipping: node:20-alpine lags Alpine's
# security releases, so it carries fixed-but-unpatched CVEs (e.g. CVE-2026-45447,
# OpenSSL heap UAF in libcrypto3/libssl3) that fail the Trivy gate (DO-9).
# --no-cache refreshes the apk index so this pulls the latest patched packages.
RUN apk upgrade --no-cache
# Drop the global npm CLI + corepack from the runtime image. The server runs
# `node server.js` and never needs npm; npm bundles its own (lagging) copies of
# tar/glob/minimatch/cross-spawn under /usr/local/lib/node_modules/npm that fail
# the Trivy gate (DO-9) and are pure attack surface here. The project's own deps
# (in .next/standalone) are unaffected.
RUN rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
