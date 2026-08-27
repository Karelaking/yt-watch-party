import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Search for .env file across current working directory and monorepo workspace root
const candidatePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(__dirname, '../../../../.env'),
  path.resolve(__dirname, '../../../../../.env'),
];

for (const envPath of candidatePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.union([z.string(), z.number()]).default('3001').transform((val) => (typeof val === 'number' ? val : parseInt(String(val), 10))),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('https://watchparty-yt.vercel.app,http://localhost:3000,http://localhost:3001'),

  // NeonDB PostgreSQL
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/watchparty?schema=public'),
  DIRECT_URL: z.string().optional().default(''),

  // Redis & Upstash
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),
  UPSTASH_REDIS_REST_URL: z.string().optional().default(''),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().default(''),

  // MongoDB
  MONGODB_URL: z.string().default('mongodb://localhost:27017/watchparty'),

  // Clerk Auth
  CLERK_SECRET_KEY: z.string().optional().default(''),
  CLERK_PUBLISHABLE_KEY: z.string().optional().default(''),
  CLERK_WEBHOOK_SECRET: z.string().optional().default(''),
  CLERK_JWT_KEY: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('Invalid environment configuration');
  }
}

function deriveRedisUrl(rawRedisUrl?: string, upstashUrl?: string, upstashToken?: string): string {
  if (rawRedisUrl && rawRedisUrl !== 'redis://localhost:6379') {
    return rawRedisUrl;
  }
  if (upstashUrl && upstashToken) {
    try {
      const hostname = new URL(upstashUrl).hostname;
      return `rediss://default:${upstashToken}@${hostname}:6379`;
    } catch {
      // ignore URL parsing error
    }
  }
  return rawRedisUrl || 'redis://localhost:6379';
}

export const env = parsed.success
  ? {
      ...parsed.data,
      CLERK_PUBLISHABLE_KEY: parsed.data.CLERK_PUBLISHABLE_KEY || process.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'] || '',
      DIRECT_URL: parsed.data.DIRECT_URL || parsed.data.DATABASE_URL,
      REDIS_URL: deriveRedisUrl(
        parsed.data.REDIS_URL,
        parsed.data.UPSTASH_REDIS_REST_URL,
        parsed.data.UPSTASH_REDIS_REST_TOKEN
      ),
    }
  : {
      NODE_ENV: (process.env['NODE_ENV'] as 'development' | 'production' | 'test') || 'development',
      PORT: parseInt(process.env['PORT'] || '3001', 10),
      HOST: process.env['HOST'] || '0.0.0.0',
      CORS_ORIGIN: process.env['CORS_ORIGIN'] || 'http://localhost:3000,http://localhost:3001',
      DATABASE_URL: process.env['DATABASE_URL'] || 'postgresql://postgres:postgres@localhost:5432/watchparty?schema=public',
      DIRECT_URL: process.env['DIRECT_URL'] || process.env['DATABASE_URL'] || 'postgresql://postgres:postgres@localhost:5432/watchparty?schema=public',
      REDIS_URL: deriveRedisUrl(
        process.env['REDIS_URL'],
        process.env['UPSTASH_REDIS_REST_URL'],
        process.env['UPSTASH_REDIS_REST_TOKEN']
      ),
      UPSTASH_REDIS_REST_URL: process.env['UPSTASH_REDIS_REST_URL'] || '',
      UPSTASH_REDIS_REST_TOKEN: process.env['UPSTASH_REDIS_REST_TOKEN'] || '',
      MONGODB_URL: process.env['MONGODB_URL'] || 'mongodb://localhost:27017/watchparty',
      CLERK_SECRET_KEY: process.env['CLERK_SECRET_KEY'] || '',
      CLERK_PUBLISHABLE_KEY: process.env['CLERK_PUBLISHABLE_KEY'] || '',
      CLERK_WEBHOOK_SECRET: process.env['CLERK_WEBHOOK_SECRET'] || '',
      CLERK_JWT_KEY: process.env['CLERK_JWT_KEY'] || '',
    };
