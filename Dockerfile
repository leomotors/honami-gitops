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

# Build the bundled output
RUN bun run build

# Runtime stage
FROM oven/bun:1-alpine AS runner

RUN apk add --no-cache docker docker-compose git openssh

WORKDIR /app

# Copy node_modules and bundled code from builder
# COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 8940

# Run with bun
CMD ["bun", "run", "dist/index.js"]
