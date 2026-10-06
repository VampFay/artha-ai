# ============================================
# Artha AI — Bun-optimized Multi-stage Dockerfile
# WP3.2 — leverages Bun runtime for fast startup + small image
#
# Target: <150MB final image (Bun standalone is ~50MB vs Node's ~150MB)
# ============================================

# Stage 1: Builder — install deps + build
FROM oven/bun:1.3.14-alpine AS builder
WORKDIR /app

# Install build-time deps
RUN apk add --no-cache python3 make g++ libc6-compat openssl

# Cache: install deps first
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# Copy source (use .dockerignore to skip node_modules, .next, etc.)
COPY . .

# Generate Prisma client
RUN bun run db:generate

# Build Next.js (standalone output)
RUN bun run build

# Stage 2: Runner — minimal Bun image
FROM oven/bun:1.3.14-alpine AS runner
WORKDIR /app

# Install tini for proper signal handling (PID 1) + wget for healthcheck
RUN apk add --no-cache tini wget openssl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S artha -u 1001 -G nodejs

# Copy standalone build (Next.js traces deps into .next/standalone)
COPY --from=builder --chown=artha:nodejs /app/.next/standalone ./
COPY --from=builder --chown=artha:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=artha:nodejs /app/public ./public

# Prisma client + schema
COPY --from=builder --chown=artha:nodejs /app/prisma ./prisma
COPY --from=builder --chown=artha:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=artha:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Worker entrypoint (separate container, same image)
COPY --from=builder --chown=artha:nodejs /app/scripts/start-worker.js ./scripts/

# Create uploads directory (for local-storage mode fallback)
RUN mkdir -p uploads && chown -R artha:nodejs uploads

USER artha

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Healthcheck — Next.js server on :3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

EXPOSE 3000

# Use tini as PID 1 for graceful shutdown (handles SIGTERM from Docker)
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["bun", "server.js"]
