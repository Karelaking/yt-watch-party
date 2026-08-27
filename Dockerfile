# Multi-stage production build for Railway monorepo
FROM node:20-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./backend/
COPY backend/prisma.config.ts ./backend/
COPY backend/tsconfig*.json ./backend/

WORKDIR /app/backend
RUN npm ci

COPY backend/src ./src
RUN npm run build

# Production runner image
FROM node:20-alpine AS runner

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3001

COPY backend/package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/src/prisma ./src/prisma

EXPOSE 3001

CMD ["node", "dist/index.js"]
