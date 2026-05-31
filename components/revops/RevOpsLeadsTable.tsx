"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Copy, ExternalLink, Mail, MessageCircle, PencilLine, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui";

type LeadOwner = {
  id: string;
  name: string | null;
  email: string;
};

type LeadCompany = {
  id: string;
  name: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
};

type LeadActivity = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  createdAt: string;
};

type LeadRecord = {
  id: string;
  companyName: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  linkedinUrl: string | null;
  category: string | null;
  source: string;
  status: string;
  sourceLabel: string | null;
  notes: string | null;
  enrichment: Record<string, unknown> | null;
  ownerId: string | null;
  owner: LeadOwner | null;
  company: LeadCompany | null;
  activities: LeadActivity[];
  lastActivityAt: string | null;
  updatedAt: string;
};

type LeadFormValues = {
  companyName: string;
  fullName: string;
  email: string;
  phone: string;
  website: string;
  linkedinUrl: string;
  category: string;
  source: string;
  status: string;
  sourceLabel: string;
  ownerId: string;
  notes: string;
  followUpAt: string;
};

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

type Props = {
  initialLeads: LeadRecord[];
  initialOwners: LeadOwner[];
};

const leadStatuses = ["NEW", "QUALIFIED", "CONTACTED", "ENGAGED", "PROPOSAL", "WON", "LOST", "ARCHIVED"];
const leadSources = [
  "MANUAL",
  "WEB",
  "WHATSAPP",
  "LINKEDIN",
  "GOOGLE_MAPS",
  "CSV",
  "APOLLO",
  "DIRECTORY",
  "REFERRAL",
  "API",
  "OTHER"
];

function humanize(value: string) {
  return value
    .toLowerCase()
    .split(/[_-]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getFollowUpAt(enrichment: Record<string, unknown> | null) {
  if (!enrichment) {
    return "";
  }
  const value = enrichment.followUpAt;
  return typeof value === "string" ? value.slice(0, 10) : "";
}

function getLeadDisplayName(lead: LeadRecord) {
  return lead.companyName || lead.fullName || lead.company?.name || "Untitled lead";
}

function getLeadSubtitle(lead: LeadRecord) {
  return lead.email || lead.phone || lead.company?.email || lead.company?.phone || "No contact details";
}

function getLatestActivity(lead: LeadRecord) {
  return lead.activities[0] ?? null;
}

function formatRelativeTime(value: string | null) {
  if (!value) {
    return "No activity yet";
  }

  const date = new Date(value);
  const diff = date.getTime() - Date.now();
  const absolute = Math.abs(diff);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absolute < hour) {
    return formatter.format(Math.round(diff / minute), "minute");
  }
  if (absolute < day) {
    return formatter.format(Math.round(diff / hour), "hour");
  }
  if (absolute < 30 * day) {
    return formatter.format(Math.round(diff / day), "day");
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function toDateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function normalizeWhatsAppNumber(value: string | null) {
  return value ? value.replace(/[^\d]/g, "") : "";
}

function createEmptyFormValues(): LeadFormValues {
  return {
    companyName: "",
    fullName: "",
    email: "",
    phone: "",
    website: "",
    linkedinUrl: "",
    category: "",
    source: "MANUAL",
    status: "NEW",
    sourceLabel: "",
    ownerId: "",
    notes: "",
    followUpAt: ""
  };
}

function leadToFormValues(lead: LeadRecord | null): LeadFormValues {
  if (!lead) {
    return createEmptyFormValues();
  }

  return {
    companyName: lead.companyName ?? "",
    fullName: lead.fullName ?? "",
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    website: lead.website ?? "",
    linkedinUrl: lead.linkedinUrl ?? "",
    category: lead.category ?? "",
    source: lead.source ?? "MANUAL",
    status: lead.status ?? "NEW",
    sourceLabel: lead.sourceLabel ?? "",
    ownerId: lead.ownerId ?? "",
    notes: lead.notes ?? "",
    followUpAt: getFollowUpAt(lead.enrichment)
  };
}

function updateFollowUpEnrichment(enrichment: Record<string, unknown> | null, followUpAt: string) {
  const existingEnrichment = enrichment && typeof enrichment === "object" ? enrichment : {};

  if (!followUpAt) {
    const nextEnrichment = Object.fromEntries(
      Object.entries(existingEnrichment).filter(([key]) => key !== "followUpAt")
    );

    return Object.keys(nextEnrichment).length ? nextEnrichment : null;
  }

  return {
    ...existingEnrichment,
    followUpAt
  };
}

function Modal({
  open,
  title,
  description,
  onClose,
  children
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog overlay"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h3 className="font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              {title}
            </h3>
            {description ? <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export function RevOpsLeadsTable({ initialLeads, initialOwners }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [owners] = useState(initialOwners);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<null | { mode: "create" } | { mode: "edit"; leadId: string } | { mode: "delete"; leadId: string }>(null);
  const [formValues, setFormValues] = useState<LeadFormValues>(createEmptyFormValues());
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [followUpDrafts, setFollowUpDrafts] = useState<Record<string, string>>({});

  const modalLeadId = activeModal && "leadId" in activeModal ? activeModal.leadId : null;
  const selectedLead = activeModal && "leadId" in activeModal ? leads.find((lead) => lead.id === activeModal.leadId) ?? null : null;

  const stats = useMemo(() => {
    const total = leads.length;
    const active = leads.filter((lead) => lead.status !== "ARCHIVED" && lead.status !== "LOST").length;
    const withFollowUps = leads.filter((lead) => getFollowUpAt(lead.enrichment)).length;
    const unassigned = leads.filter((lead) => !lead.ownerId).length;
    return { total, active, withFollowUps, unassigned };
  }, [leads]);

  async function loadLeads() {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetch("/api/crm/leads", { cache: "no-store" });
      const payload = (await response.json()) as ApiEnvelope<LeadRecord[]>;
      if (!response.ok || !payload.ok || !payload.data) {
        throw new Error(payload.error || "Unable to refresh leads.");
      }
      setLeads(payload.data);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to refresh leads.");
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTick]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRefreshTick((value) => value + 1);
    }, 45_000);

    return () => window.clearInterval(timer);
  }, []);

  function openCreateModal() {
    setFormValues(createEmptyFormValues());
    setActiveModal({ mode: "create" });
    setError(null);
  }

  function openEditModal(lead: LeadRecord) {
    setFormValues(leadToFormValues(lead));
    setActiveModal({ mode: "edit", leadId: lead.id });
    setError(null);
  }

  function openDeleteModal(leadId: string) {
    setActiveModal({ mode: "delete", leadId });
    setError(null);
  }

  function closeModal() {
    setActiveModal(null);
    setFormValues(createEmptyFormValues());
  }

  async function copyValue(value: string | null, key: string) {
    if (!value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 1200);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  async function mutateLead(leadId: string, payload: Record<string, unknown>) {
    setSavingLeadId(leadId);
    setError(null);
    try {
      const response = await fetch(`/api/crm/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as ApiEnvelope<LeadRecord>;
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Unable to update lead.");
      }
      setRefreshTick((value) => value + 1);
      return result.data ?? null;
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to update lead.");
      return null;
    } finally {
      setSavingLeadId(null);
    }
  }

  async function saveInlineStage(lead: LeadRecord, status: string) {
    await mutateLead(lead.id, {
      status
    });
  }

  async function saveInlineOwner(lead: LeadRecord, ownerId: string) {
    await mutateLead(lead.id, {
      ownerId: ownerId || null
    });
  }

  async function saveInlineNotes(lead: LeadRecord, notes: string) {
    const result = await mutateLead(lead.id, {
      notes
    });
    if (result) {
      setNoteDrafts((current) => {
        const next = { ...current };
        delete next[lead.id];
        return next;
      });
    }
  }

  async function saveInlineFollowUp(lead: LeadRecord, followUpAt: string) {
    const result = await mutateLead(lead.id, {
      enrichment: updateFollowUpEnrichment(lead.enrichment, followUpAt)
    });
    if (result) {
      setFollowUpDrafts((current) => {
        const next = { ...current };
        delete next[lead.id];
        return next;
      });
    }
  }

  async function handleLeadFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingLeadId(activeModal && "leadId" in activeModal ? activeModal.leadId : "create");
    setError(null);

    const existingEnrichment = selectedLead?.enrichment ?? null;
    const nextEnrichment =
      activeModal?.mode === "edit"
        ? updateFollowUpEnrichment(existingEnrichment, formValues.followUpAt)
        : formValues.followUpAt
          ? { followUpAt: formValues.followUpAt }
          : null;

    const payload: Record<string, unknown> = {
      companyName: formValues.companyName || null,
      fullName: formValues.fullName || null,
      email: formValues.email || null,
      phone: formValues.phone || null,
      website: formValues.website || null,
      linkedinUrl: formValues.linkedinUrl || null,
      category: formValues.category || null,
      source: formValues.source,
      status: formValues.status,
      sourceLabel: formValues.sourceLabel || null,
      ownerId: formValues.ownerId || null,
      notes: formValues.notes || null,
      enrichment: nextEnrichment
    };

    try {
      const endpoint = activeModal && "leadId" in activeModal ? `/api/crm/leads/${activeModal.leadId}` : "/api/crm/leads";
      const response = await fetch(endpoint, {
        method: activeModal && "leadId" in activeModal ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as ApiEnvelope<LeadRecord>;
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Unable to save lead.");
      }
      closeModal();
      setRefreshTick((value) => value + 1);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save lead.");
    } finally {
      setSavingLeadId(null);
    }
  }

  async function handleDeleteLead() {
    if (!activeModal || !("leadId" in activeModal)) {
      return;
    }
    const leadId = activeModal.leadId;
    setSavingLeadId(leadId);
    setError(null);

    try {
      const response = await fetch(`/api/crm/leads/${leadId}`, { method: "DELETE" });
      const result = (await response.json()) as ApiEnvelope<{ archived: boolean }>;
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Unable to archive lead.");
      }
      closeModal();
      setRefreshTick((value) => value + 1);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to archive lead.");
    } finally {
      setSavingLeadId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <p className="eyebrow">CRM</p>
          <div>
            <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
              Leads
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Inline controls for stage, owner, follow-up, notes, and quick contact actions.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={openCreateModal} className="button-primary">
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </button>
          <button type="button" onClick={() => setRefreshTick((value) => value + 1)} className="button-secondary">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-white">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Total leads</p>
          <p className="mt-4 font-[var(--font-display)] text-4xl font-semibold tracking-[-0.06em] text-slate-950">
            {stats.total}
          </p>
        </Card>
        <Card className="bg-white">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Active pipeline</p>
          <p className="mt-4 font-[var(--font-display)] text-4xl font-semibold tracking-[-0.06em] text-slate-950">
            {stats.active}
          </p>
        </Card>
        <Card className="bg-white">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Follow-ups set</p>
          <p className="mt-4 font-[var(--font-display)] text-4xl font-semibold tracking-[-0.06em] text-slate-950">
            {stats.withFollowUps}
          </p>
        </Card>
        <Card className="bg-white">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Unassigned</p>
          <p className="mt-4 font-[var(--font-display)] text-4xl font-semibold tracking-[-0.06em] text-slate-950">
            {stats.unassigned}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden bg-white p-0">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Lead board</p>
            <p className="mt-1 text-sm text-slate-600">Scroll horizontally to access the full set of inline controls.</p>
          </div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
            {isRefreshing ? "Refreshing" : "Live"}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1700px] w-full border-collapse">
            <thead className="bg-slate-50">
              <tr className="text-left text-[11px] uppercase tracking-[0.22em] text-slate-500">
                <th className="px-4 py-3 font-semibold">Lead</th>
                <th className="px-4 py-3 font-semibold">Contact tools</th>
                <th className="px-4 py-3 font-semibold">Stage</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Follow-up</th>
                <th className="px-4 py-3 font-semibold">Quick notes</th>
                <th className="px-4 py-3 font-semibold">Latest activity</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const latestActivity = getLatestActivity(lead);
                const followUpValue = followUpDrafts[lead.id] ?? getFollowUpAt(lead.enrichment);
                const noteValue = noteDrafts[lead.id] ?? lead.notes ?? "";
                const leadName = getLeadDisplayName(lead);
                const stageBusy = savingLeadId === lead.id;
                const ownerBusy = savingLeadId === lead.id;

                return (
                  <tr key={lead.id} className="border-t border-slate-200 align-top transition hover:bg-slate-50/70">
                    <td className="px-4 py-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{leadName}</p>
                          <p className="mt-1 text-xs text-slate-500">{getLeadSubtitle(lead)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            {lead.sourceLabel || humanize(lead.source)}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            {humanize(lead.status)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          <p>{lead.company?.name || "No company"}</p>
                          <p className="mt-1">Updated {formatRelativeTime(lead.updatedAt)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => copyValue(lead.email, `${lead.id}-email`)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          title={lead.email || "No email"}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copiedKey === `${lead.id}-email` ? "Copied email" : "Email"}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyValue(lead.phone, `${lead.id}-phone`)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          title={lead.phone || "No phone"}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copiedKey === `${lead.id}-phone` ? "Copied phone" : "Phone"}
                        </button>
                        {lead.linkedinUrl ? (
                          <a
                            href={lead.linkedinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            LinkedIn
                          </a>
                        ) : null}
                        {lead.phone ? (
                          <a
                            href={`https://wa.me/${normalizeWhatsAppNumber(lead.phone)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            WhatsApp
                          </a>
                        ) : null}
                        {lead.email ? (
                          <a
                            href={`mailto:${lead.email}`}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            Mailto
                          </a>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <select
                        value={lead.status}
                        disabled={stageBusy}
                        onChange={(event) => void saveInlineStage(lead, event.target.value)}
                        className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {leadStatuses.map((status) => (
                          <option key={status} value={status}>
                            {humanize(status)}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-4">
                      <select
                        value={lead.ownerId || ""}
                        disabled={ownerBusy}
                        onChange={(event) => void saveInlineOwner(lead, event.target.value)}
                        className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">Unassigned</option>
                        {owners.map((owner) => (
                          <option key={owner.id} value={owner.id}>
                            {owner.name || owner.email}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-4">
                      <input
                        type="date"
                        value={followUpValue}
                        onChange={(event) =>
                          setFollowUpDrafts((current) => ({
                            ...current,
                            [lead.id]: event.target.value
                          }))
                        }
                        onBlur={(event) => {
                          if (event.target.value !== getFollowUpAt(lead.enrichment)) {
                            void saveInlineFollowUp(lead, event.target.value);
                          } else {
                            setFollowUpDrafts((current) => {
                              const next = { ...current };
                              delete next[lead.id];
                              return next;
                            });
                          }
                        }}
                        className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        {followUpValue ? `Due ${formatDate(followUpValue)}` : "No follow-up set"}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <textarea
                        value={noteValue}
                        onChange={(event) =>
                          setNoteDrafts((current) => ({
                            ...current,
                            [lead.id]: event.target.value
                          }))
                        }
                        onBlur={(event) => {
                          if ((event.target.value || "") !== (lead.notes || "")) {
                            void saveInlineNotes(lead, event.target.value);
                          } else {
                            setNoteDrafts((current) => {
                              const next = { ...current };
                              delete next[lead.id];
                              return next;
                            });
                          }
                        }}
                        rows={2}
                        className="min-h-[5rem] w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition focus:border-slate-400"
                        placeholder="Add quick notes"
                      />
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-2 text-sm">
                        {latestActivity ? (
                          <>
                            <p className="font-medium text-slate-950">{latestActivity.title}</p>
                            <p className="text-xs text-slate-500">
                              {latestActivity.body || latestActivity.type} | {formatRelativeTime(latestActivity.createdAt)}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-slate-950">No activity yet</p>
                            <p className="text-xs text-slate-500">
                              Fallback visibility: updated {formatRelativeTime(lead.lastActivityAt || lead.updatedAt)}
                            </p>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(lead)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
                        >
                          <PencilLine className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(lead.id)}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <p className="font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                      No leads yet
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      Add the first lead to start tracking stage, ownership, follow-up, and notes.
                    </p>
                    <button type="button" onClick={openCreateModal} className="button-primary mt-6">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Lead
                    </button>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={activeModal?.mode === "create" || activeModal?.mode === "edit"}
        title={activeModal?.mode === "edit" ? "Edit lead" : "Add lead"}
        description="Use the full form when you need to adjust the complete lead record in one pass."
        onClose={closeModal}
      >
        <form className="space-y-5" onSubmit={handleLeadFormSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Company name">
              <input
                value={formValues.companyName}
                onChange={(event) => setFormValues((current) => ({ ...current, companyName: event.target.value }))}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="Acme Services"
              />
            </Field>
            <Field label="Full name">
              <input
                value={formValues.fullName}
                onChange={(event) => setFormValues((current) => ({ ...current, fullName: event.target.value }))}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="Jane Doe"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={formValues.email}
                onChange={(event) => setFormValues((current) => ({ ...current, email: event.target.value }))}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="jane@acme.com"
              />
            </Field>
            <Field label="Phone">
              <input
                value={formValues.phone}
                onChange={(event) => setFormValues((current) => ({ ...current, phone: event.target.value }))}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="+91 90000 00000"
              />
            </Field>
            <Field label="Website">
              <input
                value={formValues.website}
                onChange={(event) => setFormValues((current) => ({ ...current, website: event.target.value }))}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="https://example.com"
              />
            </Field>
            <Field label="LinkedIn URL">
              <input
                value={formValues.linkedinUrl}
                onChange={(event) => setFormValues((current) => ({ ...current, linkedinUrl: event.target.value }))}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="https://linkedin.com/in/..."
              />
            </Field>
            <Field label="Category">
              <input
                value={formValues.category}
                onChange={(event) => setFormValues((current) => ({ ...current, category: event.target.value }))}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="Healthcare, SaaS, Logistics"
              />
            </Field>
            <Field label="Source label">
              <input
                value={formValues.sourceLabel}
                onChange={(event) => setFormValues((current) => ({ ...current, sourceLabel: event.target.value }))}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                placeholder="Inbound form, referral, outbound"
              />
            </Field>
            <Field label="Source">
              <select
                value={formValues.source}
                onChange={(event) => setFormValues((current) => ({ ...current, source: event.target.value }))}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                {leadSources.map((source) => (
                  <option key={source} value={source}>
                    {humanize(source)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={formValues.status}
                onChange={(event) => setFormValues((current) => ({ ...current, status: event.target.value }))}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                {leadStatuses.map((status) => (
                  <option key={status} value={status}>
                    {humanize(status)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Owner">
              <select
                value={formValues.ownerId}
                onChange={(event) => setFormValues((current) => ({ ...current, ownerId: event.target.value }))}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                <option value="">Unassigned</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name || owner.email}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Follow-up date">
              <input
                type="date"
                value={formValues.followUpAt}
                onChange={(event) => setFormValues((current) => ({ ...current, followUpAt: event.target.value }))}
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              rows={4}
              value={formValues.notes}
              onChange={(event) => setFormValues((current) => ({ ...current, notes: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="Any context, objections, or next steps..."
            />
          </Field>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
            <button type="button" onClick={closeModal} className="button-secondary">
              Cancel
            </button>
            <button type="submit" className="button-primary" disabled={savingLeadId === "create" || savingLeadId === modalLeadId}>
              {savingLeadId === "create" || savingLeadId === modalLeadId ? "Saving..." : "Save lead"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={activeModal?.mode === "delete"}
        title="Archive lead"
        description={`This will archive ${selectedLead ? getLeadDisplayName(selectedLead) : "the selected lead"} and remove it from the active board.`}
        onClose={closeModal}
      >
        <div className="space-y-5">
          <p className="text-sm leading-7 text-slate-600">
            Archived leads stay in the database but disappear from the active view.
          </p>
          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
            <button type="button" onClick={closeModal} className="button-secondary">
              Cancel
            </button>
            <button type="button" onClick={() => void handleDeleteLead()} className="button-primary bg-rose-600 hover:bg-rose-500">
              {savingLeadId === modalLeadId ? "Archiving..." : "Archive lead"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
