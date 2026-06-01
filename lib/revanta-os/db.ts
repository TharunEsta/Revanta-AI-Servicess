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


