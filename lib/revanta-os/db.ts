import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __revantaPrisma: PrismaClient | undefined;
}

let prismaSingleton: PrismaClient | null = null;

export function getPrisma() {
  if (prismaSingleton) return prismaSingleton;

  // Lazily create PrismaClient to avoid build-time module initialization issues on Vercel.
  prismaSingleton =
    globalThis.__revantaPrisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
    });

  if (process.env.NODE_ENV !== "production") {
    globalThis.__revantaPrisma = prismaSingleton;
  }

  return prismaSingleton;
}

// Backward compatibility: keep the existing `import { prisma } from "@/lib/revanta-os/db"` API.
// NOTE: Do NOT call getPrisma() at module import time.
// Export a getter-style function while preserving named export via a lazy Proxy.
// This ensures `new PrismaClient()` is never executed during build/module evaluation.
export const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getPrisma() as any;
      return (client as any)[prop];
    }
  }
) as any;




