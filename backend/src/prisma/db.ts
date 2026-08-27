import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d.ts';
import contractJson from './contract.json' with { type: 'json' };

function sanitizeDbUrl(url?: string): string {
  if (!url) return '';
  return url
    .replace(/[?&]channel_binding=[^&]+/g, '')
    .replace(/\?&/, '?')
    .replace(/\?$/, '');
}

export const db = postgres<Contract>({
  contractJson,
  url: sanitizeDbUrl(process.env['DATABASE_URL']),
});
