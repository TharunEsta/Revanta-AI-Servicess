# TODO

## Inactivity reminders (DB-backed)
- [ ] Add Prisma model(s) for conversation inactivity reminders.
- [ ] Add scheduling logic to create reminder records when bot enters a waiting-for-user state (e.g., after sending REQ/CONSULTATION questions).
- [ ] Add cancellation logic to mark/void reminders on inbound user messages.
- [ ] Add worker endpoint/cron route to process due reminders.
- [ ] Add logs:
  - [ ] [REMINDER_SCHEDULED]
  - [ ] [REMINDER_CANCELLED]
  - [ ] [REMINDER_SENT]
- [ ] Ensure reminders survive restarts (no in-memory timers).
- [ ] Prevent duplicate reminders.

## Verification
- [ ] Simulate waiting scenario and confirm reminders are created and sent at +5 min.
- [ ] Simulate inbound reply and confirm reminders are cancelled immediately.
- [ ] Run build and fix any compilation / Prisma issues.


