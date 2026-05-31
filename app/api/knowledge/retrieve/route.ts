import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { retrieveKnowledgeContext } from "@/lib/revanta-os/knowledge";
import { prisma } from "@/lib/revanta-os/db";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);

  const body = (await safeJson(request)) as Record<string, unknown>;
  const query = typeof body.query === "string" ? body.query.trim() : "";
  const documentId = typeof body.documentId === "string" ? body.documentId : null;

  if (!query && !documentId) {
    return jsonError("query or documentId is required.");
  }

  const matches = await retrieveKnowledgeContext({
    organizationId: session.orgId,
    query: query || documentId || "",
    topK: typeof body.topK === "number" ? body.topK : 10,
    knowledgeBaseId: typeof body.knowledgeBaseId === "string" ? body.knowledgeBaseId : null,
    documentId
  });

  const document = documentId
    ? await prisma.document.findFirst({
        where: { id: documentId, organizationId: session.orgId },
        include: { chunks: { orderBy: { chunkIndex: "asc" } }, knowledgeBase: true }
      })
    : null;

  return jsonOk({
    document,
    matches
  });
}
