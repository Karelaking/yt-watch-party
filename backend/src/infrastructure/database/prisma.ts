import { Temporal } from '@js-temporal/polyfill';
if (!(globalThis as any).Temporal) {
  (globalThis as any).Temporal = Temporal;
}

import { db } from '../../prisma/db.js';
import { env } from '../../config/env.config.js';

export function toSafeDate(val: any): Date {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  if (typeof val === 'number') return new Date(val);
  if (typeof val === 'string') return new Date(val);
  if (typeof val?.epochMilliseconds === 'number') {
    return new Date(val.epochMilliseconds);
  }
  if (typeof val?.toInstant === 'function') {
    try {
      const inst = val.toInstant();
      if (typeof inst?.epochMilliseconds === 'number') return new Date(inst.epochMilliseconds);
    } catch {}
  }
  if (typeof val?.toString === 'function') {
    try {
      const str = val.toString();
      if (typeof str === 'string') return new Date(str);
    } catch {}
  }
  try {
    return new Date(String(val));
  } catch {
    return new Date();
  }
}

function convertDatesToTemporal(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (data instanceof Date) {
    if (typeof (globalThis as any).Temporal?.Instant?.fromEpochMilliseconds === 'function') {
      return (globalThis as any).Temporal.Instant.fromEpochMilliseconds(data.getTime());
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(convertDatesToTemporal);
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = convertDatesToTemporal(value);
  }
  return result;
}

function flattenWhere(where: any): any {
  if (!where || typeof where !== 'object') return where;
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(where)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      const subKeys = Object.keys(value);
      const isOperator = ['gt', 'gte', 'lt', 'lte', 'equals', 'not', 'in'].some((k) => k in value);
      if (subKeys.length > 0 && !isOperator) {
        Object.assign(result, value);
        continue;
      }
    }
    result[key] = value instanceof Date ? convertDatesToTemporal(value) : value;
  }
  return result;
}


function createModelDelegate(modelName: string, dbClient: any = db) {
  const getOrmModel = () => {
    const orm = dbClient?.orm;
    if (!orm) return null;
    return orm.public?.[modelName] ?? orm[modelName];
  };

  return {
    async findUnique(args: { where: any; include?: any }) {
      const ormModel = getOrmModel();
      if (!ormModel) return null;
      const flattened = flattenWhere(args?.where);
      const result = await ormModel.where(flattened).first();
      return result ?? null;
    },


    async findFirst(args?: { where?: any; include?: any; orderBy?: any }) {
      const ormModel = getOrmModel();
      if (!ormModel) return null;
      let query = ormModel;
      if (args?.where) {
        query = query.where(flattenWhere(args.where));
      }
      if (args?.orderBy) {
        const [field, dir] = Object.entries(args.orderBy)[0] || [];
        if (field) {
          query = query.orderBy((f: any) => (dir === 'desc' ? f[field].desc() : f[field].asc()));
        }
      }
      const result = await query.first();
      return result ?? null;
    },

    async findMany(args?: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number }) {
      const ormModel = getOrmModel();
      if (!ormModel) return [];
      let query = ormModel;

      if (args?.where) {
        const flattened = flattenWhere(args.where);
        const hasOps = Object.values(flattened).some(
          (v) => v && typeof v === 'object' && !(v instanceof Date) && !Array.isArray(v)
        );
        if (hasOps) {
          query = query.where((f: any) => {
            for (const [field, val] of Object.entries(flattened)) {
              if (val && typeof val === 'object' && !(val instanceof Date) && !Array.isArray(val)) {
                const opObj = val as any;
                if ('gt' in opObj) return f[field].gt(opObj.gt);
                if ('gte' in opObj) return f[field].gte(opObj.gte);
                if ('lt' in opObj) return f[field].lt(opObj.lt);
                if ('lte' in opObj) return f[field].lte(opObj.lte);
                if ('in' in opObj) return f[field].in(opObj.in);
              }
            }
          });
        } else {
          query = query.where(flattened);
        }
      }
      if (args?.orderBy) {
        if (Array.isArray(args.orderBy)) {
          const orderClauses = args.orderBy.map((item: any) => {
            const [field, dir] = Object.entries(item)[0] || [];
            return (f: any) => (dir === 'desc' ? f[field].desc() : f[field].asc());
          });
          query = query.orderBy(orderClauses);
        } else {
          const [field, dir] = Object.entries(args.orderBy)[0] || [];
          if (field) {
            query = query.orderBy((f: any) => (dir === 'desc' ? f[field].desc() : f[field].asc()));
          }
        }
      }
      if (typeof args?.take === 'number') {
        query = query.limit(args.take);
      }
      if (typeof args?.skip === 'number') {
        query = query.offset(args.skip);
      }
      const results = await query.all();
      return results ?? [];
    },

    async create(args: { data: any; include?: any }) {
      const ormModel = getOrmModel();
      if (!ormModel) throw new Error(`Model ${modelName} not found in database contract`);
      const data = { ...args.data };

      const nestedMemberships = data.memberships?.create;
      const nestedPlaybackState = data.playbackState?.create;
      delete data.memberships;
      delete data.playbackState;

      for (const [k, v] of Object.entries(data)) {
        if (v && typeof v === 'object' && 'increment' in (v as any)) {
          data[k] = (v as any).increment;
        }
      }

      const created = await ormModel.create(convertDatesToTemporal(data));

      if (nestedMemberships) {
        const memModel = (dbClient.orm?.public ?? dbClient.orm)?.RoomMembership;
        if (memModel) {
          await memModel.create(convertDatesToTemporal({
            ...nestedMemberships,
            roomId: created.id,
          }));
        }
      }
      if (nestedPlaybackState) {
        const pbModel = (dbClient.orm?.public ?? dbClient.orm)?.PlaybackState;
        if (pbModel) {
          await pbModel.create(convertDatesToTemporal({
            ...nestedPlaybackState,
            roomId: created.id,
          }));
        }
      }

      return created;
    },

    async update(args: { where: any; data: any }) {
      const ormModel = getOrmModel();
      if (!ormModel) return null;
      const flattened = flattenWhere(args.where);
      const updateData = { ...args.data };

      for (const [k, v] of Object.entries(updateData)) {
        if (v && typeof v === 'object' && 'increment' in (v as any)) {
          const existing = await ormModel.where(flattened).first();
          const currentVal = existing ? (existing[k] ?? 0) : 0;
          updateData[k] = currentVal + (v as any).increment;
        }
      }

      for (const key of Object.keys(updateData)) {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      }

      const updated = await ormModel.where(flattened).update(convertDatesToTemporal(updateData));
      return Array.isArray(updated) ? updated[0] : updated;
    },

    async upsert(args: { where: any; update: any; create: any }) {
      const ormModel = getOrmModel();
      if (!ormModel) return null;
      const flattened = flattenWhere(args.where);
      const existing = await ormModel.where(flattened).first();
      if (existing) {
        const updateData = { ...args.update };
        for (const key of Object.keys(updateData)) {
          if (updateData[key] === undefined) delete updateData[key];
        }
        const updated = await ormModel.where(flattened).update(convertDatesToTemporal(updateData));
        return Array.isArray(updated) ? updated[0] : updated;
      } else {
        const createData = { ...args.create };
        const created = await ormModel.create(convertDatesToTemporal(createData));
        return created;
      }
    },


    async delete(args: { where: any }) {
      const ormModel = getOrmModel();
      const flattened = flattenWhere(args.where);
      const existing = await ormModel.where(flattened).first();
      await ormModel.where(flattened).delete();
      return existing ?? true;
    },

    async count(args?: { where?: any }) {
      const ormModel = getOrmModel();
      if (args?.where) {
        const flattened = flattenWhere(args.where);
        return await ormModel.where(flattened).count();
      }
      return await ormModel.count();
    },
  };
}

function createPrismaAdapter(dbClient: any = db) {
  return {
    user: createModelDelegate('User', dbClient),
    userDevice: createModelDelegate('UserDevice', dbClient),
    room: createModelDelegate('Room', dbClient),
    roomSettings: createModelDelegate('RoomSettings', dbClient),
    roomMembership: createModelDelegate('RoomMembership', dbClient),
    roleHistory: createModelDelegate('RoleHistory', dbClient),
    roomInvitation: createModelDelegate('RoomInvitation', dbClient),
    roomBan: createModelDelegate('RoomBan', dbClient),
    media: createModelDelegate('Media', dbClient),
    playlist: createModelDelegate('Playlist', dbClient),
    playlistItem: createModelDelegate('PlaylistItem', dbClient),
    playbackState: createModelDelegate('PlaybackState', dbClient),
    playbackHistory: createModelDelegate('PlaybackHistory', dbClient),
    watchSession: createModelDelegate('WatchSession', dbClient),
    screenShareSession: createModelDelegate('ScreenShareSession', dbClient),
    roomEvent: createModelDelegate('RoomEvent', dbClient),
    webhookEvent: createModelDelegate('WebhookEvent', dbClient),

    async $connect() {
      try {
        if (typeof dbClient.connect === 'function') {
          await dbClient.connect();
        }
      } catch (e) {
        // Driver might already be connected or lazy
      }
    },

    async $disconnect() {
      try {
        if (typeof dbClient.close === 'function') {
          await dbClient.close();
        }
      } catch (e) {
        // Ignore disconnect error during shutdown
      }
    },

    async $transaction<T>(arg: ((tx: any) => Promise<T>) | Promise<any>[]): Promise<any> {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      if (typeof arg === 'function') {
        if (typeof dbClient.transaction === 'function') {
          return await dbClient.transaction(async (tx: any) => {
            const txAdapter = createPrismaAdapter(tx);
            return await arg(txAdapter);
          });
        }
        return await arg(createPrismaAdapter(dbClient));
      }
      throw new Error('Unsupported transaction parameter');
    },
  };
}

export const prisma = createPrismaAdapter(db);
export type PrismaClient = typeof prisma;
export { db };
