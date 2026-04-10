# syntax = docker/dockerfile:1

# ---------- base: shared Node Alpine image ----------
FROM node:22.21.0-alpine AS base
WORKDIR /app
ENV NODE_ENV="production"
RUN corepack enable && corepack prepare yarn@4.5.0 --activate

# ---------- deps: install ALL dependencies for building ----------
FROM base AS deps
COPY --link package.json yarn.lock .yarnrc.yml ./
COPY --link .yarn .yarn
# YARN_ENABLE_SCRIPTS=false prevents arbitrary code execution from untrusted packages
RUN YARN_ENABLE_SCRIPTS=false yarn install --immutable --network-timeout 1000000
# sharp uses prebuild-install and needs its install script to fetch the native binary
RUN cd node_modules/sharp && npm run install

# ---------- build: compile the Next.js application ----------
FROM deps AS build
COPY --link . .
RUN yarn run build

# ---------- prod-deps: production-only node_modules ----------
FROM deps AS prod-deps
RUN npm prune --omit=dev --legacy-peer-deps
# Re-run sharp install after prune in case npm prune removed the prebuilt binary
RUN cd node_modules/sharp && npm run install

# ---------- runner: minimal production image ----------
FROM base AS runner

ARG APP_VERSION="dev"
ENV APP_VERSION=$APP_VERSION
ENV NEXT_TELEMETRY_DISABLED=1

RUN adduser -S -u 1001 nextjs

# Production node_modules only (no devDependencies)
COPY --from=prod-deps /app/node_modules ./node_modules

# Built Next.js output
COPY --from=build /app/.next ./.next

# Runtime config and server files
COPY --from=build /app/package.json ./
COPY --from=build /app/next.config.js ./
COPY --from=build /app/server.js ./
COPY --from=build /app/public ./public

# Custom server runtime dependencies (mail service, EJS views, API helpers)
COPY --from=build /app/src/server ./src/server
COPY --from=build /app/src/axios.js ./src/axios.js

EXPOSE 8080

USER nextjs

CMD [ "node", "server.js" ]