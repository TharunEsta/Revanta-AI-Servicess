import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __revantaPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__revantaPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__revantaPrisma = prisma;
}

