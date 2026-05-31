import crypto from "node:crypto";
import { prisma } from "@/lib/revanta-os/db";
import { toJsonValue } from "@/lib/revanta-os/json";

function getN8nBaseUrl() {
  return (
    process.env.N8N_WEBHOOK_URL?.trim() ||
    process.env.N8N_WEBHOOK_BASE_URL?.trim() ||
    process.env.N8N_BASE_URL?.trim() ||
    null
  );
}

function getN8nSecret() {
  return process.env.N8N_WEBHOOK_SECRET?.trim() || process.env.N8N_API_KEY?.trim() || null;
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function postWithRetry(url: string, payload: Record<string, unknown>, attempts = 3) {
  const secret = getN8nSecret();
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const body = JSON.stringify(payload);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secret
            ? {
                "x-revanta-signature": crypto.createHmac("sha256", secret).update(body).digest("hex")
              }
            : {})
        },
        body
      });

      if (response.ok) {
        return {
          ok: true,
          status: response.status,
          response: await response.json().catch(() => null)
        };
      }

      lastError = `N8N webhook failed with status ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "N8N webhook failed";
    }

    if (attempt < attempts) {
      await delay(500 * attempt);
    }
  }

  return { ok: false, error: lastError || "N8N webhook failed" };
}

export async function dispatchN8nEvent(params: {
  organizationId: string;
  eventType: string;
  payload: Record<string, unknown>;
  workflowId?: string | null;
  workflowRunId?: string | null;
}) {
  const baseUrl = getN8nBaseUrl();
  if (!baseUrl) {
    return { ok: false, skipped: true };
  }

  const url = `${baseUrl.replace(/\/$/, "")}/${params.eventType.toLowerCase()}`;
  const result = await postWithRetry(url, {
    eventType: params.eventType,
    organizationId: params.organizationId,
    workflowId: params.workflowId || null,
    workflowRunId: params.workflowRunId || null,
    payload: params.payload
  });

  await prisma.executionLog.create({
    data: {
      organizationId: params.organizationId,
      workflowId: params.workflowId || undefined,
      workflowRunId: params.workflowRunId || undefined,
      eventType: params.eventType,
      level: result.ok ? "SUCCESS" : "ERROR",
      message: result.ok ? "N8N event delivered" : result.error || "N8N delivery failed",
      payload: toJsonValue({
        eventType: params.eventType,
        payload: params.payload,
        result
      })
    }
  });

  return result;
}
