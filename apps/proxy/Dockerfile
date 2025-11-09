FROM node:18-alpine AS builder

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy proxy app package.json
COPY apps/proxy/package.json ./apps/proxy/

# Install pnpm and dependencies
RUN npm install -g pnpm@8.15.0
RUN pnpm install --frozen-lockfile

# Copy proxy app source files
COPY apps/proxy ./apps/proxy

# Build the application using workspace filter
RUN pnpm --filter @kontecst/proxy build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy workspace configuration and lockfile
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

# Copy proxy app files
COPY --from=builder /app/apps/proxy/package.json ./apps/proxy/
COPY --from=builder /app/apps/proxy/dist ./apps/proxy/dist

# Install pnpm and production dependencies only
RUN npm install -g pnpm@8.15.0
RUN pnpm install --prod --frozen-lockfile --filter @kontecst/proxy

# Create data directory
RUN mkdir -p /data/files

# Run as non-root user
USER node

EXPOSE 3001

CMD ["node", "apps/proxy/dist/index.js"]
