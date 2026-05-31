import { prisma } from "@/lib/revanta-os/db";
import { toJsonValue } from "@/lib/revanta-os/json";

export async function createNotification(params: {
  organizationId: string;
  userId?: string | null;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  return prisma.notification.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId || null,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link || null,
      metadata: params.metadata ? toJsonValue(params.metadata) : undefined
    }
  });
}

export async function listNotifications(organizationId: string, userId?: string | null, take = 50) {
  return prisma.notification.findMany({
    where: {
      organizationId,
      ...(userId ? { OR: [{ userId }, { userId: null }] } : {})
    },
    orderBy: { createdAt: "desc" },
    take
  });
}

export async function markNotificationRead(organizationId: string, notificationId: string, userId?: string | null) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      organizationId,
      ...(userId ? { OR: [{ userId }, { userId: null }] } : {})
    },
    data: { isRead: true, readAt: new Date() }
  });
}

export async function seedOperationalNotifications(organizationId: string) {
  const count = await prisma.notification.count({ where: { organizationId } });
  if (count > 0) return;
  await prisma.notification.createMany({
    data: [
      {
        organizationId,
        type: "SYSTEM",
        title: "Revanta OS production layer is live",
        body: "Operational notifications are enabled for leads, projects, finance, WhatsApp, and AI events."
      },
      {
        organizationId,
        type: "SYSTEM",
        title: "Audit logging enabled",
        body: "Security, approval, and delivery events are now recorded in the audit log."
      }
    ]
  });
}

