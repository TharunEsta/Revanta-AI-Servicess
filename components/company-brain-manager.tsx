"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CompanyKnowledgeRecord = {
  id: string;
  category: string;
  title: string;
  content: string;
  status: string;
  sortOrder: number;
};

type KnowledgeBaseRecord = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export function CompanyBrainManager({
  entries,
  knowledgeBases
}: {
  entries: CompanyKnowledgeRecord[];
  knowledgeBases: KnowledgeBaseRecord[];
}) {
  const router = useRouter();
  const [newEntry, setNewEntry] = useState({
    category: "Services",
    title: "",
    content: "",
    status: "PUBLISHED",
    sortOrder: 0
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, CompanyKnowledgeRecord>>({});
  const [uploading, setUploading] = useState(false);

  const sortedEntries = useMemo(
    () => [...entries].sort((left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title)),
    [entries]
  );

  async function refreshAfterMutation() {
    router.refresh();
  }

  async function createEntry() {
    const response = await fetch("/api/company-brain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEntry)
    });
    if (!response.ok) return;
    setNewEntry({ category: "Services", title: "", content: "", status: "PUBLISHED", sortOrder: 0 });
    await refreshAfterMutation();
  }

  async function updateEntry(id: string) {
    const payload = drafts[id];
    if (!payload) return;
    const response = await fetch(`/api/company-brain/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) return;
    setEditingId(null);
    await refreshAfterMutation();
  }

  async function deleteEntry(id: string) {
    const response = await fetch(`/api/company-brain/${id}`, {
      method: "DELETE"
    });
    if (!response.ok) return;
    await refreshAfterMutation();
  }

  async function uploadDocument(formData: FormData) {
    setUploading(true);
    try {
      const response = await fetch("/api/knowledge/upload", {
        method: "POST",
        body: formData
      });
      if (!response.ok) return;
      await refreshAfterMutation();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Company knowledge</p>
          <div className="mt-4 grid gap-3">
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
              placeholder="Category"
              value={newEntry.category}
              onChange={(event) => setNewEntry((current) => ({ ...current, category: event.target.value }))}
            />
            <input
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
              placeholder="Title"
              value={newEntry.title}
              onChange={(event) => setNewEntry((current) => ({ ...current, title: event.target.value }))}
            />
            <textarea
              className="min-h-36 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
              placeholder="Knowledge content"
              value={newEntry.content}
              onChange={(event) => setNewEntry((current) => ({ ...current, content: event.target.value }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                type="number"
                value={newEntry.sortOrder}
                onChange={(event) => setNewEntry((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
              />
              <select
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                value={newEntry.status}
                onChange={(event) => setNewEntry((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
            <button type="button" className="button-primary" onClick={createEntry}>
              Add knowledge
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Document upload</p>
          <form
            className="mt-4 grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const formData = new FormData(form);
              await uploadDocument(formData);
              form.reset();
            }}
          >
            <input name="title" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Document title" />
            <input name="category" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Category" />
            <input name="sourceName" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Source name" />
            <input name="sourceUrl" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Source URL" />
            <select name="knowledgeBaseId" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              <option value="">Default knowledge base</option>
              {knowledgeBases.map((knowledgeBase) => (
                <option key={knowledgeBase.id} value={knowledgeBase.id}>
                  {knowledgeBase.name}
                </option>
              ))}
            </select>
            <textarea
              name="content"
              className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Paste text if you do not have a file"
            />
            <input name="file" type="file" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            <button type="submit" className="button-secondary" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload document"}
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-4">
        {sortedEntries.map((entry) => {
          const draft = drafts[entry.id] || entry;
          const editing = editingId === entry.id;
          return (
            <div key={entry.id} className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{entry.category}</p>
                  {editing ? (
                    <div className="mt-4 grid gap-3">
                      <input
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                        value={draft.title}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [entry.id]: { ...draft, title: event.target.value }
                          }))
                        }
                      />
                      <textarea
                        className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                        value={draft.content}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [entry.id]: { ...draft, content: event.target.value }
                          }))
                        }
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="mt-2 font-[var(--font-display)] text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                        {entry.title}
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">{entry.content}</p>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {editing ? (
                    <>
                      <button
                        type="button"
                        className="button-primary"
                        onClick={() => updateEntry(entry.id)}
                      >
                        Save
                      </button>
                      <button type="button" className="button-secondary" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => {
                          setEditingId(entry.id);
                          setDrafts((current) => ({ ...current, [entry.id]: { ...entry } }));
                        }}
                      >
                        Edit
                      </button>
                      <button type="button" className="button-secondary" onClick={() => deleteEntry(entry.id)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
