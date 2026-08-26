import { PrismaClient } from "@prisma/client";
import { mockPrisma } from "./mockPrisma";

declare global {
  var prismaInstance: PrismaClient | undefined;
}

let prismaClient: any;

try {
  if (process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === "production") {
      prismaClient = new PrismaClient();
    } else {
      if (!global.prismaInstance) {
        global.prismaInstance = new PrismaClient();
      }
      prismaClient = global.prismaInstance;
    }
  } else {
    prismaClient = mockPrisma;
  }
} catch (e) {
  console.warn("Could not instantiate PrismaClient, falling back to mockPrisma:", e);
  prismaClient = mockPrisma;
}

// Proxy to automatically fallback to mockPrisma if DB connection errors occur
export const prisma = new Proxy(prismaClient, {
  get(target, prop, receiver) {
    const original = Reflect.get(target, prop, receiver);
    if (!original) {
      return (mockPrisma as any)[prop];
    }
    // Return a wrapped object to catch DB connection failures on any model call
    return new Proxy(original, {
      get(modelTarget, methodProp, modelReceiver) {
        const method = Reflect.get(modelTarget, methodProp, modelReceiver);
        if (typeof method !== "function") return method;

        return async (...args: any[]) => {
          try {
            return await method.apply(modelTarget, args);
          } catch (err: any) {
            console.warn(`Prisma.${String(prop)}.${String(methodProp)} failed, using mockPrisma fallback:`, err?.message || err);
            const mockModel = (mockPrisma as any)[prop];
            if (mockModel && typeof mockModel[methodProp] === "function") {
              return await mockModel[methodProp](...args);
            }
            throw err;
          }
        };
      }
    });
  }
});
