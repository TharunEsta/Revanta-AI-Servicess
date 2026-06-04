# TODO - Fix conversation state gating

- [ ] Inspect current WhatsApp flow state machine and identify where it auto-advances within a single inbound webhook.
- [ ] Implement gating: when a state asks a question, persist `nextExpectedState`, set `waitingForUserReply=true`, log `[WAITING_FOR_USER_REPLY]`, and return immediately.
- [ ] Prevent any further state transitions/auto-advances unless a new inbound WhatsApp message is received.
- [ ] Add/adjust logs for: `[WAITING_FOR_USER_REPLY]`, `[USER_REPLY_RECEIVED]`, `[STATE_ADVANCE]`.
- [ ] Ensure REQ_COLLECTION and CONSULTATION only send one question per inbound message and do not immediately send Qualification summary/Calendly.
- [ ] Verify QUALIFICATION_COMPLETE and BOOK_DISCOVERY_CALL transitions occur only when qualification is complete.
- [ ] Run build/lint and (if available) a local test harness for conversation flow.

