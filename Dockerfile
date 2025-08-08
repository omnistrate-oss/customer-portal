# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
FROM node:24.4.1-alpine AS base

# Next.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"
ARG YARN_VERSION=1.22.21
RUN npm install -g yarn@$YARN_VERSION --force

# Install packages needed to build node modules
FROM base AS build

# Install node modules
COPY --link package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false --network-timeout 1000000

# Copy application code
COPY --link . .

# Build application
RUN yarn run build

# Final stage for app image
FROM base

ENV NODE_ENV="production"
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application from the previous stage
COPY --from=build /app /app

RUN adduser -S -u 1001 nextjs

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000

USER nextjs

CMD [ "node", "server.js" ]