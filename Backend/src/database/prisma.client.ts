// Prisma Database Client - Singleton pattern with local JSON fallback
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { dbFallback } from './db_fallback';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

let isDbConnected = false;

// Prevent multiple instances in development (hot reload)
const prismaInstance = global.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['error', 'warn']
    : ['error'],
});

if (process.env.NODE_ENV === 'development') {
  global.__prisma = prismaInstance;
}

export const connectDatabase = async (): Promise<void> => {
  try {
    await prismaInstance.$connect();
    isDbConnected = true;
    logger.info('✅ Database connected successfully');
  } catch (error) {
    isDbConnected = false;
    logger.error('❌ Database connection failed (switching to fallback local JSON database):', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (isDbConnected) {
    await prismaInstance.$disconnect();
    logger.info('Database disconnected');
  }
};

import { encrypt, decrypt } from '../utils/encryption';

const encryptIntegrationFields = (data: any) => {
  if (!data) return data;
  const copy = { ...data };
  if (typeof copy.accessToken === 'string') {
    copy.accessToken = encrypt(copy.accessToken);
  }
  if (typeof copy.refreshToken === 'string') {
    copy.refreshToken = encrypt(copy.refreshToken);
  }
  return copy;
};

const decryptIntegrationFields = (record: any) => {
  if (!record) return record;
  const copy = { ...record };
  if (typeof copy.accessToken === 'string') {
    copy.accessToken = decrypt(copy.accessToken);
  }
  if (typeof copy.refreshToken === 'string') {
    copy.refreshToken = decrypt(copy.refreshToken);
  }
  return copy;
};

const wrapIntegrationModel = (model: any) => {
  return new Proxy(model, {
    get(mTarget, mProp) {
      const originalMethod = Reflect.get(mTarget, mProp);
      if (typeof originalMethod !== 'function') {
        return originalMethod;
      }
      return async (...args: any[]) => {
        // 1. Transform write arguments
        if (args[0]) {
          const queryArg = args[0];
          if (mProp === 'create' && queryArg.data) {
            queryArg.data = encryptIntegrationFields(queryArg.data);
          } else if (mProp === 'update' && queryArg.data) {
            queryArg.data = encryptIntegrationFields(queryArg.data);
          } else if (mProp === 'upsert') {
            if (queryArg.create) queryArg.create = encryptIntegrationFields(queryArg.create);
            if (queryArg.update) queryArg.update = encryptIntegrationFields(queryArg.update);
          }
        }

        // 2. Execute original database operation
        const result = await originalMethod.apply(mTarget, args);

        // 3. Decrypt results
        if (Array.isArray(result)) {
          return result.map(decryptIntegrationFields);
        } else {
          return decryptIntegrationFields(result);
        }
      };
    }
  });
};

const wrapTx = (tx: any) => {
  return new Proxy(tx, {
    get(target, prop) {
      if (prop === 'integration') {
        const model = Reflect.get(target, prop);
        return wrapIntegrationModel(model);
      }
      return Reflect.get(target, prop);
    }
  });
};

// ES6 Proxy to intercept model queries and route them to JSON fallback when offline
const prismaProxy = new Proxy(prismaInstance, {
  get(target, prop) {
    // Override top level utility methods
    if (prop === '$connect') {
      return connectDatabase;
    }
    if (prop === '$disconnect') {
      return disconnectDatabase;
    }
    if (prop === '$transaction') {
      return (callback: (tx: any) => Promise<any>) => {
        const wrappedCallback = (tx: any) => callback(wrapTx(tx));
        if (isDbConnected) {
          return prismaInstance.$transaction(wrappedCallback);
        }
        return dbFallback.$transaction(wrappedCallback);
      };
    }

    if (prop === 'integration') {
      const model = isDbConnected ? prismaInstance.integration : dbFallback.integration;
      return wrapIntegrationModel(model);
    }

    // Route query methods
    if (isDbConnected) {
      return Reflect.get(target, prop);
    } else {
      // Direct access from mock DB fallback
      return Reflect.get(dbFallback, prop);
    }
  }
});

export default prismaProxy as unknown as PrismaClient;
