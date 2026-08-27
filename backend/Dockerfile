# Multi-stage production build for Railway (inside backend directory)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma.config.ts ./
COPY tsconfig*.json ./

RUN npm ci

COPY src ./src

RUN npm run build

# Production runner image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/prisma ./src/prisma

EXPOSE 3001

CMD ["node", "dist/index.js"]
