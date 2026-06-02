import { NextResponse } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { sendWhatsAppTextMessage } from "@/lib/revanta-os/whatsapp";

const REMINDER_TEXT =
  "We are waiting for your response. Let us know how Revanta AI can help.";

export async function POST() {
  const now = new Date();

  const dueReminders = await prisma.conversationReminder.findMany({
    where: {
      scheduledFor: { lte: now },
      sentAt: null,
      cancelledAt: null
    },
    take: 50,
    include: {
      conversation: {
        include: {
          lead: true,
          assignedTo: true
        }
      }
    }
  });

  for (const reminder of dueReminders) {
    // Safety: ensure conversation still exists and has WhatsApp channel.
    if (!reminder.conversation || reminder.conversation.channel !== "WHATSAPP") {
      await prisma.conversationReminder.update({
        where: { id: reminder.id },
        data: { cancelledAt: new Date() }
      });
      continue;
    }

    await prisma.conversationReminder.update({
      where: { id: reminder.id },
      data: {
        sentAt: now
      }
    });

    try {
      await sendWhatsAppTextMessage({
        organizationId: reminder.organizationId,
        conversationId: reminder.conversationId,
        text: REMINDER_TEXT,
        metadata: {
          source: "reminder",
          reminderType: reminder.reminderType
        }
      });

      await prisma.executionLog.create({
        data: {
          organizationId: reminder.organizationId,
          eventType: "WHATSAPP_REMINDER_SENT",
          level: "INFO",
          message: `[REMINDER_SENT] reminderId=${reminder.id} conversationId=${reminder.conversationId}`,
          payload: {
            reminderId: reminder.id,
            conversationId: reminder.conversationId,
            reminderType: reminder.reminderType
          } as any
        }
      });
    } catch (e: any) {
      // If WhatsApp send fails, revert sentAt so it can be retried.
      await prisma.conversationReminder.update({
        where: { id: reminder.id },
        data: { sentAt: null }
      });

      await prisma.executionLog.create({
        data: {
          organizationId: reminder.organizationId,
          eventType: "WHATSAPP_REMINDER_ERROR",
          level: "ERROR",
          message: `REMINDER_SEND_FAILED reminderId=${reminder.id}: ${e?.message || String(e)}`,
          payload: { reminderId: reminder.id } as any
        }
      });
    }
  }

  return NextResponse.json({ ok: true, processed: dueReminders.length });
}


