# Build stage
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build the binary
RUN bun run build

# Runtime stage
FROM alpine:3.23 AS runner

RUN apk add --no-cache libstdc++ libgcc docker git

WORKDIR /app

# Copy the compiled binary from builder
COPY --from=builder --chown=appuser:appuser /app/out/server /app/server

# Expose port
EXPOSE 8940

# Run the binary
CMD ["/app/server"]
