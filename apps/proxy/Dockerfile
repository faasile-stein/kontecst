FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY apps/proxy/package.json ./apps/proxy/

# Install pnpm and dependencies
RUN npm install -g pnpm@8.15.0
RUN pnpm install --frozen-lockfile

# Copy source files
COPY apps/proxy ./apps/proxy

# Build the application
WORKDIR /app/apps/proxy
RUN pnpm build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY --from=builder /app/apps/proxy/package.json ./
COPY --from=builder /app/apps/proxy/dist ./dist

# Install production dependencies only
RUN npm install -g pnpm@8.15.0
RUN pnpm install --prod --frozen-lockfile

# Create data directory
RUN mkdir -p /data/files

# Run as non-root user
USER node

EXPOSE 3001

CMD ["node", "dist/index.js"]
