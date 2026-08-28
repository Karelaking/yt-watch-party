# Multi-stage production build for Railway (inside backend directory)
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma.config.ts ./
COPY tsconfig*.json ./

RUN npm install

COPY src ./src

RUN npm run build

# Production runner image
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/prisma ./src/prisma

EXPOSE 3001

CMD ["node", "dist/cluster.js"]
