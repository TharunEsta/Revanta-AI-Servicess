import { NextResponse } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { sendWhatsAppTextMessage } from "@/lib/revanta-os/whatsapp";
import { toJsonObject, toJsonValue } from "@/lib/revanta-os/json";

type ReminderPlan = {
  text: string;
  nextReminderType?: string;
  finalState?: string;
  finalOutcome?: string;
  status?: "OPEN" | "PENDING" | "CLOSED" | "ARCHIVED";
};

function getReminderPlan(reminderType: string): ReminderPlan {
  switch (reminderType) {
    case "DISCOVERY":
      return {
        text: "Just checking in. Reply with the service you need, and we will continue from there.",
        nextReminderType: "DISCOVERY_FOLLOW_UP_1"
      };
    case "DISCOVERY_FOLLOW_UP_1":
      return {
        text: "Still here to help. Tell us what you want to build, and we will guide you to the next step.",
        nextReminderType: "DISCOVERY_FINAL_RECOVERY"
      };
    case "DISCOVERY_FINAL_RECOVERY":
      return {
        text: "Final check-in for now. Reply anytime, and we will reopen your WhatsApp consultation.",
        finalState: "NO_RESPONSE_CLOSED",
        finalOutcome: "unresponsive_after_discovery",
        status: "PENDING"
      };
    case "REQUIREMENT_COLLECTION":
      return {
        text: "Checking back on your requirements. Reply with your business, challenge, and expected outcome so we can suggest the right solution.",
        nextReminderType: "REQUIREMENT_COLLECTION_FOLLOW_UP_1"
      };
    case "REQUIREMENT_COLLECTION_FOLLOW_UP_1":
      return {
        text: "We can summarise your requirements and suggest the best solution once you reply. Send any details you have, even if they are brief.",
        nextReminderType: "REQUIREMENT_COLLECTION_FINAL_RECOVERY"
      };
    case "REQUIREMENT_COLLECTION_FINAL_RECOVERY":
      return {
        text: "Final reminder for now. Reply anytime with your requirements and we will continue from where we left off.",
        finalState: "NO_RESPONSE_CLOSED",
        finalOutcome: "unresponsive_during_requirements",
        status: "PENDING"
      };
    case "CONSULTATION":
      return {
        text: "Checking in on the remaining consultation details. Share your timeline, key features, or reference examples and we will complete the recommendation.",
        nextReminderType: "CONSULTATION_FOLLOW_UP_1"
      };
    case "CONSULTATION_FOLLOW_UP_1":
      return {
        text: "We are ready to complete your recommendation as soon as you reply with the remaining details.",
        nextReminderType: "CONSULTATION_FINAL_RECOVERY"
      };
    case "CONSULTATION_FINAL_RECOVERY":
      return {
        text: "Final follow-up for now. Reply anytime and we will finish your consultation and recommend the next step.",
        finalState: "NO_RESPONSE_CLOSED",
        finalOutcome: "unresponsive_during_consultation",
        status: "PENDING"
      };
    case "BOOK_DISCOVERY_CALL":
      return {
        text: "Friendly reminder to book your discovery call. Once booked, our team can move your project forward quickly.",
        nextReminderType: "BOOK_DISCOVERY_CALL_FOLLOW_UP_1"
      };
    case "BOOK_DISCOVERY_CALL_FOLLOW_UP_1":
      return {
        text: "Second reminder: if you prefer not to book right now, simply reply here and our team will help manually.",
        nextReminderType: "BOOK_DISCOVERY_CALL_FINAL_RECOVERY"
      };
    case "BOOK_DISCOVERY_CALL_FINAL_RECOVERY":
      return {
        text: "Final follow-up for now. Reply anytime to continue, and our team can help you schedule the next step manually.",
        finalState: "HUMAN",
        finalOutcome: "awaiting_manual_followup_after_booking_prompt",
        status: "PENDING"
      };
    default:
      return {
        text: "We are waiting for your response. Let us know how Revanta AI can help.",
        finalState: "NO_RESPONSE_CLOSED",
        finalOutcome: "generic_unresponsive",
        status: "PENDING"
      };
  }
}

async function createReminderLog(params: {
  organizationId: string;
  eventType: string;
  message: string;
  payload?: Record<string, unknown>;
  level?: "INFO" | "WARN" | "ERROR" | "SUCCESS";
}) {
  await prisma.executionLog.create({
    data: {
      organizationId: params.organizationId,
      eventType: params.eventType,
      level: params.level || "INFO",
      message: params.message,
      payload: params.payload ? (params.payload as any) : undefined
    }
  });
}

async function scheduleNextReminder(params: {
  organizationId: string;
  conversationId: string;
  leadId?: string | null;
  reminderType: string;
}) {
  const scheduledFor = new Date(Date.now() + 5 * 60 * 1000);

  const reminder = await prisma.conversationReminder.create({
    data: {
      organizationId: params.organizationId,
      conversationId: params.conversationId,
      leadId: params.leadId || null,
      reminderType: params.reminderType,
      scheduledFor
    }
  });

  await createReminderLog({
    organizationId: params.organizationId,
    eventType: "WHATSAPP_REMINDER_SCHEDULED",
    message: `[REMINDER_SCHEDULED] reminderId=${reminder.id} conversationId=${params.conversationId} reminderType=${params.reminderType}`,
    payload: {
      reminderId: reminder.id,
      conversationId: params.conversationId,
      reminderType: params.reminderType,
      scheduledFor: scheduledFor.toISOString()
    }
  });
}

async function transitionReminderOutcome(params: {
  organizationId: string;
  conversationId: string;
  finalState: string;
  finalOutcome: string;
  status: "OPEN" | "PENDING" | "CLOSED" | "ARCHIVED";
}) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: params.conversationId, organizationId: params.organizationId }
  });
  if (!conversation) return;

  const metadata = conversation.metadata ? toJsonObject(conversation.metadata) : {};
  const fromState =
    typeof metadata.flowStep === "string" ? String(metadata.flowStep) : "UNKNOWN";

  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: {
      status: params.status,
      aiState: params.finalState === "HUMAN" ? "HUMAN_ACTIVE" : undefined,
      humanTakeoverAt: params.finalState === "HUMAN" ? new Date() : undefined,
      metadata: toJsonValue({
        ...metadata,
        flowStep: params.finalState,
        flowOutcome: params.finalOutcome,
        lastBotInteraction: new Date().toISOString()
      })
    }
  });

  await createReminderLog({
    organizationId: params.organizationId,
    eventType: "WHATSAPP_STATE_CHANGE",
    message: `[STATE_CHANGE] conversationId=${params.conversationId} from=${fromState} to=${params.finalState}`,
    payload: {
      conversationId: params.conversationId,
      fromState,
      toState: params.finalState,
      flowOutcome: params.finalOutcome
    }
  });

  await createReminderLog({
    organizationId: params.organizationId,
    eventType: "WHATSAPP_FLOW_EXIT",
    message: `[FLOW_EXIT] conversationId=${params.conversationId} flow=REMINDER outcome=${params.finalOutcome}`,
    payload: {
      conversationId: params.conversationId,
      flowStep: params.finalState,
      outcome: params.finalOutcome
    }
  });
}

async function processReminders() {
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
    const plan = getReminderPlan(reminder.reminderType);

    await createReminderLog({
      organizationId: reminder.organizationId,
      eventType: "WHATSAPP_FLOW_ENTER",
      message: `[FLOW_ENTER] conversationId=${reminder.conversationId} flow=REMINDER`,
      payload: {
        conversationId: reminder.conversationId,
        reminderId: reminder.id,
        reminderType: reminder.reminderType
      }
    });

    // Safety: ensure conversation still exists and has WhatsApp channel.
    if (!reminder.conversation || reminder.conversation.channel !== "WHATSAPP") {
      await prisma.conversationReminder.update({
        where: { id: reminder.id },
        data: { cancelledAt: new Date() }
      });
      await createReminderLog({
        organizationId: reminder.organizationId,
        eventType: "WHATSAPP_FLOW_EXIT",
        message: `[FLOW_EXIT] conversationId=${reminder.conversationId} flow=REMINDER outcome=cancelled_invalid_conversation`,
        payload: {
          conversationId: reminder.conversationId,
          reminderId: reminder.id,
          reminderType: reminder.reminderType
        }
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
        text: plan.text,
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

      if (plan.nextReminderType) {
        await scheduleNextReminder({
          organizationId: reminder.organizationId,
          conversationId: reminder.conversationId,
          leadId: reminder.leadId,
          reminderType: plan.nextReminderType
        });
      } else if (plan.finalState && plan.finalOutcome && plan.status) {
        await transitionReminderOutcome({
          organizationId: reminder.organizationId,
          conversationId: reminder.conversationId,
          finalState: plan.finalState,
          finalOutcome: plan.finalOutcome,
          status: plan.status
        });
      }

      await createReminderLog({
        organizationId: reminder.organizationId,
        eventType: "WHATSAPP_FLOW_EXIT",
        message: `[FLOW_EXIT] conversationId=${reminder.conversationId} flow=REMINDER outcome=${plan.finalOutcome || plan.nextReminderType || "reminder_sent"}`,
        payload: {
          conversationId: reminder.conversationId,
          reminderId: reminder.id,
          reminderType: reminder.reminderType,
          nextReminderType: plan.nextReminderType || null,
          finalOutcome: plan.finalOutcome || null
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

      await createReminderLog({
        organizationId: reminder.organizationId,
        eventType: "WHATSAPP_FLOW_EXIT",
        message: `[FLOW_EXIT] conversationId=${reminder.conversationId} flow=REMINDER outcome=send_error`,
        payload: {
          conversationId: reminder.conversationId,
          reminderId: reminder.id,
          reminderType: reminder.reminderType,
          error: e?.message || String(e)
        },
        level: "ERROR"
      });
    }
  }

  return NextResponse.json({ ok: true, processed: dueReminders.length });
}

export async function GET() {
  return processReminders();
}

export async function POST() {
  return processReminders();
}


