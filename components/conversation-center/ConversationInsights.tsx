"use client";

export function ConversationInsights({
  conversation
}: {
  conversation:
    | {
        lead?: {
          score?: number | null;
          status?: string | null;
          aiSummary?: unknown;
          qualificationNotes?: string | null;
          nextBestAction?: string | null;
          recommendedService?: string | null;
          source?: string | null;
          sourceLabel?: string | null;
          industry?: string | null;
        } | null;
        assignedTo?: { name?: string | null } | null;
      }
    | null;
}) {
  const lead = conversation?.lead ?? null;

  if (!conversation) {
    return (
      <aside className="col-span-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex h-full items-center justify-center p-6 text-slate-500">Select a conversation.</div>
      </aside>
    );
  }

  return (
    <aside className="col-span-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">CRM + AI</div>
      </div>

      <div className="h-full overflow-y-auto p-4">
        <div className="space-y-4">
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-500">Lead Score</div>
              <div className="text-sm font-bold text-slate-900">{lead?.score ?? "—"}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-500">Pipeline Stage</div>
              <div className="text-sm font-bold text-slate-900">{lead?.status ?? "—"}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Deal Value</div>
              <div className="text-sm font-semibold text-slate-900">—</div>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Lead Source</div>
              <div className="text-sm font-semibold text-slate-900">{lead?.sourceLabel ?? lead?.source ?? "—"}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Country</div>
              <div className="text-sm font-semibold text-slate-900">—</div>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Industry</div>
              <div className="text-sm font-semibold text-slate-900">{lead?.industry ?? "—"}</div>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned Owner</div>
            <div className="text-sm font-semibold text-slate-900">{conversation?.assignedTo?.name ?? "—"}</div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI Summary</div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
              {lead?.aiSummary && typeof lead.aiSummary === "object" ? JSON.stringify(lead.aiSummary) : (lead?.aiSummary as any) || "—"}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Qualification Notes</div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">{lead?.qualificationNotes ?? "—"}</div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next Best Action</div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">{lead?.nextBestAction ?? "—"}</div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended Service</div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900">{lead?.recommendedService ?? "—"}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

