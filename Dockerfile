# Build stage
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY tsconfig.json build.ts ./
COPY src ./src
COPY web ./web
COPY static ./static
COPY vite.config.ts svelte.config.js ./

# Build server bundle and static frontend (output: dist/, build/)
RUN bun run build && bun run web:build

# Runtime stage
FROM oven/bun:1-alpine AS runner

RUN apk add --no-cache docker docker-compose git openssh

WORKDIR /app

# Copy node_modules and bundled code from builder
# COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/build ./build

# Expose port
EXPOSE 8940

# Run with bun
CMD ["bun", "run", "dist/index.js"]
