import { createApp } from '../src/app.js';
import { prisma } from '../src/infrastructure/database/prisma.js';
import { connectMongoose } from '../src/infrastructure/database/mongoose.js';

const app = createApp();

let isConnected = false;
async function ensureDb() {
  if (!isConnected) {
    try {
      await Promise.allSettled([
        prisma.(),
        connectMongoose(),
      ]);
      isConnected = true;
    } catch (err) {
      console.warn('Database initialization warning:', err);
    }
  }
}

app.use(async (_req, _res, next) => {
  await ensureDb();
  next();
});

export default app;
