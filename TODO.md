# TODO

- [ ] Rewrite `components/revops/RevOpsLeadsTable.tsx` in a single coherent pass.
  - [ ] Remove legacy modal workflows (Assign Owner, Notes, Follow-up, Move Stage) completely.
  - [ ] Keep only: Add Lead modal, Full Edit modal, Delete confirm modal.
  - [ ] Implement inline row workflows: stage selector, owner dropdown, follow-up date input, quick notes editing.
  - [ ] Add inline contact utilities: copy email/phone, open LinkedIn, open WhatsApp, mailto.
  - [ ] Add compact latest-activity visibility derived from existing fields.
  - [ ] Apply density refinement (tighter spacing / reduced row height).
  - [ ] Ensure inline mutations refresh leads immediately and trigger activity/pipeline updates (via refreshTick + existing polling).
- [ ] Run TypeScript/Next build or lint to confirm no undefined references remain.

