import { PrismaClient } from "@prisma/client";
import { mockPrisma } from "./mockPrisma";

declare global {
  var prismaInstance: PrismaClient | undefined;
}

const isProduction = process.env.NODE_ENV === "production";

/**
 * The in-memory mock database is a local development convenience only.
 * In production it is never used: a database outage must surface as an error,
 * not silently accept writes into memory or allow logins against mock users.
 * Set ENABLE_MOCK_DB="true" to opt in explicitly (e.g. for a local demo build).
 */
const mockAllowed = !isProduction || process.env.ENABLE_MOCK_DB === "true";

function createClient(): any {
  if (!process.env.DATABASE_URL) {
    if (mockAllowed) {
      console.warn("DATABASE_URL is not set — using in-memory mockPrisma (development only).");
      return mockPrisma;
    }
    // Real client: queries will fail loudly until DATABASE_URL is configured.
    return new PrismaClient();
  }
  if (isProduction) return new PrismaClient();
  if (!global.prismaInstance) global.prismaInstance = new PrismaClient();
  return global.prismaInstance;
}

const prismaClient = createClient();

function withDevFallback(client: any): any {
  if (!mockAllowed || client === mockPrisma) return client;

  // Development only: fall back to mockPrisma if the local DB is unreachable
  return new Proxy(client, {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver);
      if (!original || typeof original !== "object") return original;
      return new Proxy(original, {
        get(modelTarget, methodProp, modelReceiver) {
          const method = Reflect.get(modelTarget, methodProp, modelReceiver);
          if (typeof method !== "function") return method;

          return async (...args: any[]) => {
            try {
              return await method.apply(modelTarget, args);
            } catch (err: any) {
              const mockModel = (mockPrisma as any)[prop];
              if (mockModel && typeof mockModel[methodProp] === "function") {
                console.warn(
                  `Prisma.${String(prop)}.${String(methodProp)} failed, using mockPrisma fallback (dev only):`,
                  err?.message || err,
                );
                return await mockModel[methodProp](...args);
              }
              throw err;
            }
          };
        },
      });
    },
  });
}

export const prisma = withDevFallback(prismaClient);
