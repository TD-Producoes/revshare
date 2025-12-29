# Multi-stage Dockerfile for Next.js production deployment
# Stage 1: Dependencies
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build stage)
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Accept build arguments (NEXT_PUBLIC_* must be available during build)
ARG DATABASE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Set build environment variables
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    DATABASE_URL=$DATABASE_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Copy dependencies and package files
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Copy application source
COPY . .

# Generate Prisma Client and build
RUN npx prisma generate && npm run build

# Stage 3: Runner (Production)
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat openssl dumb-init

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Use dumb-init to handle signals properly
CMD ["dumb-init", "node", "server.js"]
