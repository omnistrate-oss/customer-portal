# syntax = docker/dockerfile:1

# ---------- base: shared Node Alpine image ----------
FROM node:22.21.0-alpine AS base
WORKDIR /app
ENV NODE_ENV="production"
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare yarn@4.5.0 --activate

# ---------- deps: install ALL dependencies for build ----------
# Install scripts are disabled to prevent supply-chain attacks via malicious
# postinstall scripts (e.g., the March 31, 2026 axios npm compromise:
# axios@1.14.1 / axios@0.30.4 pulled in plain-crypto-js@4.2.1, whose
# postinstall hook deployed a cross-platform RAT). Scripts are then
# re-enabled only for the explicit allowlist of trusted native packages.
# Allowlist (must be security-reviewed before adding):
#   sharp                                       — libvips native binary
#   tree-sitter, tree-sitter-json,
#   @tree-sitter-grammars/tree-sitter-yaml      — native parsers used by swagger-ui-react
FROM base AS deps
RUN apk add --no-cache python3 make g++
COPY --link package.json yarn.lock .yarnrc.yml ./
COPY --link .yarn .yarn
RUN YARN_ENABLE_SCRIPTS=false yarn install --immutable --network-timeout 1000000 \
 && yarn rebuild sharp tree-sitter tree-sitter-json @tree-sitter-grammars/tree-sitter-yaml

# ---------- build: compile the Next.js application ----------
FROM deps AS build
COPY --link . .
RUN yarn run build

# ---------- prod-deps: production-only node_modules from a clean state ----------
# Must be FROM base (not FROM deps) — `yarn workspaces focus` only adds, it
# never removes existing entries, so inheriting `deps` would leave devDeps in
# place and prune nothing. From a clean state, --production installs only the
# `dependencies` field of package.json (skipping devDependencies entirely).
FROM base AS prod-deps
RUN apk add --no-cache python3 make g++
COPY --link package.json yarn.lock .yarnrc.yml ./
COPY --link .yarn .yarn
RUN YARN_ENABLE_SCRIPTS=false yarn workspaces focus --all --production \
 && npm rebuild sharp tree-sitter tree-sitter-json @tree-sitter-grammars/tree-sitter-yaml

# ---------- runner: minimal production image ----------
FROM base AS runner

ARG APP_VERSION="dev"
ENV APP_VERSION=$APP_VERSION

RUN adduser -S -u 1001 nextjs

COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build     --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build     --chown=nextjs:nodejs /app/public ./public
COPY --from=build     --chown=nextjs:nodejs /app/server.js ./server.js
COPY --from=build     --chown=nextjs:nodejs /app/next.config.js ./next.config.js
COPY --from=build     --chown=nextjs:nodejs /app/src/server ./src/server
COPY --from=build     --chown=nextjs:nodejs /app/src/axios.js ./src/axios.js
COPY --from=build     --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs
EXPOSE 8080

CMD [ "node", "server.js" ]
