# ? -------------------------
# ? Builder: Complile TypeScript to JS
# ? -------------------------

FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable
RUN pnpm i --frozen-lockfile

# copy sources
COPY src ./src
COPY tsconfig.json ./
COPY tsup.config.ts ./

# compile
RUN pnpm build

# ? -------------------------
# ? Runner: Production to run
# ? -------------------------

FROM node:22-alpine AS runner

RUN apk add --no-cache docker git

WORKDIR /app

LABEL name="honami-gitops"

ENV NODE_ENV=production

# copy all files from layers above
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/index.cjs"]
