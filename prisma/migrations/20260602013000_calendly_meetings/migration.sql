-- Add Calendly meeting tracking fields
ALTER TYPE "public"."LeadStatus" ADD VALUE IF NOT EXISTS 'MEETING_BOOKED';

ALTER TABLE "public"."Lead"
  ADD COLUMN IF NOT EXISTS "meetingScheduled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "meetingBookedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "calendlyEventId" TEXT,
  ADD COLUMN IF NOT EXISTS "calendlyBookingUrl" TEXT;
