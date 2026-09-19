# ============================================
# Artha AI — Multi-stage Production Dockerfile
# Phase 6 — refined for deploy
# ============================================

# Stage 1: Builder
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++ libc6-compat openssl

# Install bun
RUN npm install -g bun

# Copy lockfile + package.json first for cache
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client
RUN bun run db:generate

# Build Next.js (standalone output)
RUN bun run build

# Stage 2: Runner — minimal image, non-root user
FROM node:22-alpine AS runner
WORKDIR /app

# Install tini for proper signal handling + wget for healthcheck
RUN apk add --no-cache tini wget openssl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs

# Copy standalone build (contains server.js + traced node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma client + schema (needed for queries at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Create uploads directory (Phase 3 — replaced by S3 in prod)
RUN mkdir -p uploads && chown -R nextjs:nodejs uploads

USER nextjs

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Healthcheck — hit /api/health, expect 200 within 5s
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

EXPOSE 3000

# Use tini as PID 1 for graceful shutdown
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
