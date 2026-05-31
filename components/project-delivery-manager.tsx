"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProjectDeliveryManagerProps = {
  project: any;
  clientMode?: boolean;
};

async function postJson(url: string, data: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return response;
}

async function patchJson(url: string, data: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return response;
}

export function ProjectDeliveryManager({ project, clientMode = false }: ProjectDeliveryManagerProps) {
  const router = useRouter();
  const [projectDraft, setProjectDraft] = useState({
    name: project.name || "",
    serviceType: project.serviceType || "",
    status: project.status || "PLANNED",
    deliveryStage: project.deliveryStage || "DISCOVERY",
    summary: project.summary || "",
    requirements: project.requirements || "",
    repositoryUrl: project.repositoryUrl || "",
    deploymentUrl: project.deploymentUrl || "",
    environmentStatus: project.environmentStatus || "",
    clientSatisfaction: project.clientSatisfaction ?? ""
  });
  const [milestoneDraft, setMilestoneDraft] = useState({ title: "", description: "", dueAt: "" });
  const [taskDraft, setTaskDraft] = useState({ title: "", description: "", dueAt: "", priority: 2, assigneeId: "" });
  const [commentDraft, setCommentDraft] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [uploading, setUploading] = useState(false);

  async function refresh() {
    router.refresh();
  }

  async function updateProject() {
    const response = await patchJson(`/api/projects/${project.id}`, {
      ...projectDraft,
      clientSatisfaction:
        projectDraft.clientSatisfaction === "" ? undefined : Number(projectDraft.clientSatisfaction)
    });
    if (response.ok) {
      await refresh();
    }
  }

  async function createMilestone() {
    const response = await postJson(`/api/projects/${project.id}/milestones`, milestoneDraft);
    if (response.ok) {
      setMilestoneDraft({ title: "", description: "", dueAt: "" });
      await refresh();
    }
  }

  async function approveMilestone(milestoneId: string) {
    const response = await patchJson(`/api/projects/${project.id}/milestones/${milestoneId}`, {
      status: "APPROVED",
      approved: true
    });
    if (response.ok) {
      await refresh();
    }
  }

  async function createTask() {
    const response = await postJson(`/api/projects/${project.id}/tasks`, {
      ...taskDraft,
      priority: Number(taskDraft.priority)
    });
    if (response.ok) {
      setTaskDraft({ title: "", description: "", dueAt: "", priority: 2, assigneeId: "" });
      await refresh();
    }
  }

  async function updateTask(taskId: string, payload: Record<string, unknown>) {
    const response = await patchJson(`/api/projects/${project.id}/tasks/${taskId}`, payload);
    if (response.ok) {
      await refresh();
    }
  }

  async function addComment() {
    if (!commentDraft.trim()) return;
    const response = await postJson(`/api/projects/${project.id}/comments`, {
      body: commentDraft,
      internalOnly: !clientMode
    });
    if (response.ok) {
      setCommentDraft("");
      await refresh();
    }
  }

  async function sendMessage() {
    if (!messageDraft.trim()) return;
    const response = await postJson(`/api/projects/${project.id}/messages`, {
      text: messageDraft,
      direction: clientMode ? "INBOUND" : "OUTBOUND",
      sender: clientMode ? "client" : "staff"
    });
    if (response.ok) {
      setMessageDraft("");
      await refresh();
    }
  }

  async function uploadDocument(formData: FormData) {
    setUploading(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/documents`, {
        method: "POST",
        body: formData
      });
      if (response.ok) {
        await refresh();
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {!clientMode && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Project settings</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={projectDraft.name} onChange={(event) => setProjectDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Project name" />
            <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={projectDraft.serviceType} onChange={(event) => setProjectDraft((current) => ({ ...current, serviceType: event.target.value }))} placeholder="Service type" />
            <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={projectDraft.status} onChange={(event) => setProjectDraft((current) => ({ ...current, status: event.target.value }))}>
              <option value="PLANNED">PLANNED</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PAUSED">PAUSED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELED">CANCELED</option>
            </select>
            <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={projectDraft.deliveryStage} onChange={(event) => setProjectDraft((current) => ({ ...current, deliveryStage: event.target.value }))}>
              <option value="DISCOVERY">DISCOVERY</option>
              <option value="REQUIREMENTS">REQUIREMENTS</option>
              <option value="DESIGN">DESIGN</option>
              <option value="DEVELOPMENT">DEVELOPMENT</option>
              <option value="TESTING">TESTING</option>
              <option value="DEPLOYMENT">DEPLOYMENT</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
            <textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2" value={projectDraft.summary} onChange={(event) => setProjectDraft((current) => ({ ...current, summary: event.target.value }))} placeholder="Project summary" />
            <textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2" value={projectDraft.requirements} onChange={(event) => setProjectDraft((current) => ({ ...current, requirements: event.target.value }))} placeholder="Requirements" />
            <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={projectDraft.repositoryUrl} onChange={(event) => setProjectDraft((current) => ({ ...current, repositoryUrl: event.target.value }))} placeholder="GitHub repository URL" />
            <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={projectDraft.deploymentUrl} onChange={(event) => setProjectDraft((current) => ({ ...current, deploymentUrl: event.target.value }))} placeholder="Deployment URL" />
            <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={projectDraft.environmentStatus} onChange={(event) => setProjectDraft((current) => ({ ...current, environmentStatus: event.target.value }))} placeholder="Environment status" />
            <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={projectDraft.clientSatisfaction} onChange={(event) => setProjectDraft((current) => ({ ...current, clientSatisfaction: event.target.value }))} placeholder="Client satisfaction" />
          </div>
          <button type="button" className="button-primary mt-4" onClick={updateProject}>
            Save project
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Milestones</p>
          <div className="mt-4 grid gap-3">
            {project.milestones.map((milestone: any) => (
              <div key={milestone.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-950">{milestone.title}</p>
                    <p className="text-sm text-slate-600">{milestone.status}</p>
                  </div>
                  {milestone.status !== "APPROVED" ? (
                    <button type="button" className="button-secondary" onClick={() => approveMilestone(milestone.id)}>
                      Approve
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {!clientMode && (
            <div className="mt-4 grid gap-3">
              <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={milestoneDraft.title} onChange={(event) => setMilestoneDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Milestone title" />
              <textarea className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={milestoneDraft.description} onChange={(event) => setMilestoneDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Milestone description" />
              <input type="date" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={milestoneDraft.dueAt} onChange={(event) => setMilestoneDraft((current) => ({ ...current, dueAt: event.target.value }))} />
              <button type="button" className="button-secondary" onClick={createMilestone}>
                Add milestone
              </button>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Tasks</p>
          <div className="mt-4 grid gap-3">
            {project.tasks.map((task: any) => (
              <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-950">{task.title}</p>
                    <p className="text-sm text-slate-600">
                      {task.status} {task.assignee?.name ? `· ${task.assignee.name}` : ""}
                    </p>
                  </div>
                  {!clientMode && task.status !== "COMPLETED" ? (
                    <button type="button" className="button-secondary" onClick={() => updateTask(task.id, { status: "COMPLETED", completed: true })}>
                      Complete
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {!clientMode && (
            <div className="mt-4 grid gap-3">
              <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={taskDraft.title} onChange={(event) => setTaskDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Task title" />
              <textarea className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={taskDraft.description} onChange={(event) => setTaskDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Task description" />
              <div className="grid gap-3 md:grid-cols-3">
                <input type="date" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={taskDraft.dueAt} onChange={(event) => setTaskDraft((current) => ({ ...current, dueAt: event.target.value }))} />
                <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={taskDraft.assigneeId} onChange={(event) => setTaskDraft((current) => ({ ...current, assigneeId: event.target.value }))} placeholder="Assignee user ID" />
                <input type="number" min="1" max="5" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={taskDraft.priority} onChange={(event) => setTaskDraft((current) => ({ ...current, priority: Number(event.target.value) }))} />
              </div>
              <button type="button" className="button-secondary" onClick={createTask}>
                Add task
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Notes</p>
          <div className="mt-4 space-y-3">
            {project.comments.map((comment: any) => (
              <div key={comment.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-950">{comment.author?.name || "Team"}</p>
                <p className="mt-1 text-sm text-slate-600">{comment.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3">
            <textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder={clientMode ? "Leave a note for the team" : "Add internal notes"} />
            <button type="button" className="button-secondary" onClick={addComment}>
              Add note
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Messages</p>
          <div className="mt-4 space-y-3">
            {(() => {
              const messages = (project.conversations?.[0]?.messages || []).slice(-5);
              if (!messages.length) {
                return <p className="text-sm text-slate-600">No messages yet.</p>;
              }
              return messages.map((message: any) => (
                <div key={message.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {message.direction} · {message.body}
                </div>
              ));
            })()}
          </div>
          <div className="mt-4 grid gap-3">
            <textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} placeholder={clientMode ? "Send a message to the team" : "Send an update to the client"} />
            <button type="button" className="button-primary" onClick={sendMessage}>
              Send message
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Documents</p>
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
          <input name="sourceName" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Source name" />
          <textarea name="content" className="min-h-32 rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Paste document content or notes" />
          <input name="file" type="file" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
          <button type="submit" className="button-secondary" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload document"}
          </button>
        </form>
        <div className="mt-4 grid gap-3">
          {project.attachments?.map((attachment: any) => (
            <div key={attachment.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {attachment.fileName}
            </div>
          ))}
          {project.documents?.map((document: any) => (
            <div key={document.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {document.title}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Delivery pipeline</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4 xl:grid-cols-7">
          {["Discovery", "Requirements", "Design", "Development", "Testing", "Deployment", "Maintenance"].map((stage) => {
            const active = project.deliveryStage === stage.toUpperCase();
            return (
              <div key={stage} className={`rounded-2xl border px-4 py-3 text-sm ${active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                {stage}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
