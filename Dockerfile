# Multi-stage production build for Railway monorepo
FROM node:22-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./backend/
COPY backend/prisma.config.ts ./backend/
COPY backend/tsconfig*.json ./backend/

WORKDIR /app/backend
RUN npm install

COPY backend/src ./src
RUN npm run build

# Production runner image
FROM node:22-alpine AS runner

WORKDIR /app/backend

ENV NODE_ENV=production

COPY backend/package*.json ./

RUN npm install --omit=dev

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/src/prisma ./src/prisma

EXPOSE 3001

CMD ["node", "dist/cluster.js"]
