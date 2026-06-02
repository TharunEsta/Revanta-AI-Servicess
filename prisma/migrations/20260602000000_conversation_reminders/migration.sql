-- CreateConversationReminder
CREATE TABLE IF NOT EXISTS "public"."ConversationReminder" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "leadId" TEXT,
  "reminderType" TEXT NOT NULL,
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ConversationReminder_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "ConversationReminder_organizationId_scheduledFor_idx" ON "public"."ConversationReminder"("organizationId", "scheduledFor");
CREATE INDEX IF NOT EXISTS "ConversationReminder_conversationId_scheduledFor_idx" ON "public"."ConversationReminder"("conversationId", "scheduledFor");

-- Prevent duplicates of pending reminders for same conversation and type
CREATE UNIQUE INDEX IF NOT EXISTS "ConversationReminder_pending_unique_idx" 
ON "public"."ConversationReminder"("conversationId", "reminderType")
WHERE "sentAt" IS NULL AND "cancelledAt" IS NULL;

-- Foreign keys
ALTER TABLE "public"."ConversationReminder" ADD CONSTRAINT "ConversationReminder_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."ConversationReminder" ADD CONSTRAINT "ConversationReminder_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."ConversationReminder" ADD CONSTRAINT "ConversationReminder_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

