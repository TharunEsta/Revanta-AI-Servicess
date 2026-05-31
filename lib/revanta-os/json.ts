import { Prisma } from "@prisma/client";

export function toJsonObject(value: unknown): Prisma.JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Prisma.JsonObject;
  }

  return {};
}

export function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
