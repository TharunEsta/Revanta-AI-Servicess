import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { generateInvoiceFromProject } from "@/lib/revanta-os/business";
import { toJsonValue } from "@/lib/revanta-os/json";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const invoices = await prisma.invoice.findMany({
    where: { organizationId: session.orgId },
    include: { items: true, payments: true, customer: true, project: true },
    orderBy: { createdAt: "desc" }
  });
  return jsonOk(invoices);
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const organizationId = session.orgId;
  const body = (await safeJson(request)) as Record<string, unknown>;

  if (typeof body.projectId === "string" && body.projectId.trim()) {
    const invoice = await generateInvoiceFromProject({
      organizationId,
      projectId: body.projectId.trim(),
      userId: session.userId
    });
    return jsonOk(invoice, { status: 201 });
  }

  const number = typeof body.number === "string" && body.number.trim() ? body.number.trim() : `INV-${Date.now()}`;
  const items = Array.isArray(body.items) ? body.items : [];
  const subtotal = Number(body.subtotal ?? 0);
  const tax = Number(body.tax ?? 0);
  const total = Number(body.total ?? subtotal + tax);
  const invoice = await prisma.invoice.create({
    data: {
      organizationId,
      projectId: typeof body.projectId === "string" ? body.projectId : undefined,
      customerId: typeof body.customerId === "string" ? body.customerId : undefined,
      createdById: session.userId,
      number,
      status: typeof body.status === "string" ? (body.status as any) : "DRAFT",
      subtotal,
      tax,
      total,
      currency: typeof body.currency === "string" ? body.currency : "USD",
      dueDate: typeof body.dueDate === "string" ? new Date(body.dueDate) : undefined,
      issuedAt: typeof body.issuedAt === "string" ? new Date(body.issuedAt) : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      items: {
        create: items.map((item) => ({
          organizationId,
          projectId: typeof body.projectId === "string" ? body.projectId : undefined,
          title: typeof item === "object" && item && typeof (item as any).title === "string" ? (item as any).title : "Invoice item",
          description: typeof item === "object" && item && typeof (item as any).description === "string" ? (item as any).description : undefined,
          quantity: Number((item as any)?.quantity ?? 1),
          unitPrice: Number((item as any)?.unitPrice ?? 0),
          tax: Number((item as any)?.tax ?? 0),
          amount: Number((item as any)?.amount ?? 0),
          metadata: toJsonValue(typeof item === "object" && item ? item as Record<string, unknown> : {})
        }))
      }
    },
    include: { items: true, payments: true, customer: true, project: true }
  });

  return jsonOk(invoice, { status: 201 });
}
