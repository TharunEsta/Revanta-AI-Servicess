import { prisma } from "@/lib/revanta-os/db";
import { toJsonValue } from "@/lib/revanta-os/json";
import { dispatchN8nEvent } from "@/lib/revanta-os/n8n";

export type WorkflowEventType =
  | "LEAD_CREATED"
  | "MESSAGE_RECEIVED"
  | "MESSAGE_SENT"
  | "LEAD_UPDATED"
  | "DEAL_WON"
  | "TASK_CREATED"
  | "PROJECT_CREATED"
  | "PROJECT_UPDATED"
  | "PROJECT_BLOCKED"
  | "MILESTONE_APPROVED"
  | "INVOICE_CREATED"
  | "PAYMENT_RECEIVED"
  | "PROJECT_DELAYED"
  | "LEAD_DORMANT"
  | "PROPOSAL_APPROVED"
  | "CONTRACT_APPROVED"
  | "TICKET_CREATED"
  | "TICKET_UPDATED";

type WorkflowDefinition = {
  trigger?: { event?: string };
  triggers?: Array<{ event?: string } | string>;
  n8nWebhookUrl?: string;
  webhookUrl?: string;
};

function getWorkflowDefinition(workflow: { definition: unknown; triggerType: string | null }) {
  const definition = workflow.definition;
  if (!definition || typeof definition !== "object" || Array.isArray(definition)) {
    return {};
  }
  return definition as WorkflowDefinition;
}

function getWorkflowEvents(workflow: { definition: unknown; triggerType: string | null }) {
  const definition = getWorkflowDefinition(workflow);
  const events = new Set<string>();

  if (workflow.triggerType) {
    events.add(workflow.triggerType.toUpperCase());
  }

  if (definition.trigger?.event) {
    events.add(definition.trigger.event.toUpperCase());
  }

  for (const trigger of definition.triggers ?? []) {
    if (typeof trigger === "string") {
      events.add(trigger.toUpperCase());
    } else if (trigger?.event) {
      events.add(trigger.event.toUpperCase());
    }
  }

  return events;
}

async function sendWorkflowToN8n(webhookUrl: string, body: unknown) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.N8N_API_KEY ? { Authorization: `Bearer ${process.env.N8N_API_KEY}` } : {})
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(errorBody || `N8N webhook failed with status ${response.status}`);
  }
}

export async function triggerWorkflowEvent(params: {
  organizationId: string;
  eventType: WorkflowEventType;
  payload: Record<string, unknown>;
  actorId?: string | null;
}) {
  await dispatchN8nEvent({
    organizationId: params.organizationId,
    eventType: params.eventType,
    payload: params.payload
  });

  const workflows = await prisma.workflow.findMany({
    where: {
      organizationId: params.organizationId,
      status: "ACTIVE"
    }
  });

  const matchingWorkflows = workflows.filter((workflow: { definition: unknown; triggerType: string | null; id: string; ownerId: string | null; n8nWebhookUrl?: string | null; webhookUrl?: string | null }) => {
    const events = getWorkflowEvents(workflow);
    return events.size > 0 && events.has(params.eventType);
  });

  const results: Array<{ workflowId: string; workflowRunId: string; status: string }> = [];

  for (const workflow of matchingWorkflows) {
    const definition = getWorkflowDefinition(workflow);
    const n8nWebhookUrl = definition.n8nWebhookUrl || definition.webhookUrl || workflow.n8nWebhookUrl || null;

    const run = await prisma.workflowRun.create({
      data: {
        organizationId: params.organizationId,
        workflowId: workflow.id,
        actorId: params.actorId || workflow.ownerId || null,
        status: "RUNNING",
        provider: n8nWebhookUrl ? "n8n" : "local",
        trigger: params.eventType,
        input: toJsonValue(params.payload),
        startedAt: new Date()
      }
    });

    await prisma.executionLog.create({
      data: {
        organizationId: params.organizationId,
        workflowId: workflow.id,
        workflowRunId: run.id,
        actorId: params.actorId || workflow.ownerId || null,
        eventType: params.eventType,
        level: "INFO",
        message: `Workflow triggered for ${params.eventType}`,
        payload: toJsonValue(params.payload)
      }
    });

    try {
      if (n8nWebhookUrl) {
        await sendWorkflowToN8n(n8nWebhookUrl, {
          eventType: params.eventType,
          organizationId: params.organizationId,
          workflowId: workflow.id,
          workflowRunId: run.id,
          payload: params.payload
        });
      }

      await prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          status: "SUCCEEDED",
          output: toJsonValue({
            eventType: params.eventType,
            forwardedToN8n: Boolean(n8nWebhookUrl)
          }),
          finishedAt: new Date()
        }
      });

      await prisma.executionLog.create({
        data: {
          organizationId: params.organizationId,
          workflowId: workflow.id,
          workflowRunId: run.id,
          actorId: params.actorId || workflow.ownerId || null,
          eventType: params.eventType,
          level: "SUCCESS",
          message: n8nWebhookUrl ? "Workflow forwarded to N8N" : "Workflow executed locally",
          payload: toJsonValue({
            forwardedToN8n: Boolean(n8nWebhookUrl)
          })
        }
      });

      results.push({ workflowId: workflow.id, workflowRunId: run.id, status: "SUCCEEDED" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Workflow execution failed";

      await prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          errorMessage: message,
          finishedAt: new Date()
        }
      });

      await prisma.executionLog.create({
        data: {
          organizationId: params.organizationId,
          workflowId: workflow.id,
          workflowRunId: run.id,
          actorId: params.actorId || workflow.ownerId || null,
          eventType: params.eventType,
          level: "ERROR",
          message,
          payload: toJsonValue(params.payload)
        }
      });

      results.push({ workflowId: workflow.id, workflowRunId: run.id, status: "FAILED" });
    }
  }

  return results;
}
