import { prisma } from "@/lib/revanta-os/db";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import type { NextRequest } from "next/server";

type CrudConfig = {
  model: string;
  listWhere?: (session: NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>) => Record<string, unknown>;
  getWhere: (params: { id: string }, session: NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>) => Record<string, unknown>;
  createData: (body: Record<string, unknown>, session: NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>) => Record<string, unknown>;
  updateData: (
    body: Record<string, unknown>,
    session: NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>
  ) => Record<string, unknown>;
  include?: Record<string, unknown>;
  orderBy?: Record<string, unknown>;
  take?: number;
  afterCreate?: (
    record: unknown,
    body: Record<string, unknown>,
    session: NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>
  ) => Promise<void> | void;
  afterUpdate?: (
    record: unknown,
    body: Record<string, unknown>,
    session: NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>
  ) => Promise<void> | void;
  afterDelete?: (
    existing: unknown,
    session: NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>
  ) => Promise<void> | void;
};

function repo(model: string) {
  return (prisma as any)[model];
}

export async function handleListRequest(request: NextRequest, config: CrudConfig) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) {
    return jsonError("Unauthorized", 401);
  }

  const where = config.listWhere ? config.listWhere(session) : { organizationId: session.orgId };
  const records = await repo(config.model).findMany({
    where,
    orderBy: config.orderBy ?? { createdAt: "desc" },
    take: config.take ?? 100,
    include: config.include
  });

  return jsonOk(records);
}

export async function handleCreateRequest(request: NextRequest, config: CrudConfig) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) {
    return jsonError("Unauthorized", 401);
  }

  const body = (await safeJson(request)) as Record<string, unknown>;
  const data = config.createData(body, session);
  const record = await repo(config.model).create({
    data,
    include: config.include
  });
  if (config.afterCreate) {
    await config.afterCreate(record, body, session);
  }
  return jsonOk(record, { status: 201 });
}

export async function handleGetRequest(request: NextRequest, params: { id: string }, config: CrudConfig) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) {
    return jsonError("Unauthorized", 401);
  }
  const record = await repo(config.model).findFirst({
    where: config.getWhere(params, session),
    include: config.include
  });
  if (!record) {
    return jsonError("Not found", 404);
  }
  return jsonOk(record);
}

export async function handlePatchRequest(request: NextRequest, params: { id: string }, config: CrudConfig) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) {
    return jsonError("Unauthorized", 401);
  }
  const body = (await safeJson(request)) as Record<string, unknown>;
  const data = config.updateData(body, session);
  const existing = await repo(config.model).findFirst({ where: config.getWhere(params, session) });
  if (!existing) {
    return jsonError("Not found", 404);
  }
  const record = await repo(config.model).update({
    where: { id: params.id },
    data,
    include: config.include
  });
  if (config.afterUpdate) {
    await config.afterUpdate(record, body, session);
  }
  return jsonOk(record);
}

export async function handleDeleteRequest(request: NextRequest, params: { id: string }, config: CrudConfig) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) {
    return jsonError("Unauthorized", 401);
  }
  const existing = await repo(config.model).findFirst({ where: config.getWhere(params, session) });
  if (!existing) {
    return jsonError("Not found", 404);
  }
  await repo(config.model).delete({ where: { id: params.id } });
  if (config.afterDelete) {
    await config.afterDelete(existing, session);
  }
  return jsonOk({ deleted: true });
}
