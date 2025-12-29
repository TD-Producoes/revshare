# Multi-stage Dockerfile for Next.js 16 production deployment
# Stage 1: Dependencies
FROM node:20-alpine AS deps

# Install security updates and dependencies
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder

# Install security updates and required dependencies
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Copy Prisma schema
COPY prisma ./prisma/

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# Stage 3: Runner (Production)
FROM node:20-alpine AS runner

# Install security updates and required runtime dependencies
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    dumb-init

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Accept build arguments for runtime environment variables
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Set runtime environment variables from build args
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
