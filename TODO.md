# TODO - ConversationListClient audit & safe comparator fix

- [ ] Audit data flow for ConversationListClient fields:
  - [ ] _lastActivityAt
  - [ ] createdAt
  - [ ] sentAt
  - [ ] deliveredAt
  - [ ] readAt
  - [ ] Determine database type, server runtime type, client runtime type
- [ ] Replace ConversationListClient sort comparator with serialization-safe helper `toTimestamp`.
- [ ] Modify file `components/conversation-center/ConversationList.tsx` accordingly.
- [ ] Delete build artifacts:
  - [ ] rm -rf .next
  - [ ] rm -rf .next-build
- [ ] Rebuild: `npm run build`
- [ ] Restart PM2: `pm2 restart revanta-os`
- [ ] Provide outputs:
  - [ ] Files Modified
  - [ ] Date Fields Audited
  - [ ] Build Status
  - [ ] PM2 Restart Status
  - [ ] Remaining Runtime Errors

