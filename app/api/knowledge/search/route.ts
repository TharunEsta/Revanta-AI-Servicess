import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk, safeJson } from "@/lib/revanta-os/http";
import { searchKnowledgeChunks } from "@/lib/revanta-os/knowledge";
import { prisma } from "@/lib/revanta-os/db";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);

  const body = (await safeJson(request)) as Record<string, unknown>;
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) return jsonError("query is required.");

  const results = await searchKnowledgeChunks({
    organizationId: session.orgId,
    query,
    topK: typeof body.topK === "number" ? body.topK : 8,
    knowledgeBaseId: typeof body.knowledgeBaseId === "string" ? body.knowledgeBaseId : null,
    documentId: typeof body.documentId === "string" ? body.documentId : null
  });

  const companyKnowledge = await prisma.companyKnowledge.findMany({
    where: {
      organizationId: session.orgId,
      OR: [
        { title: { contains: query } },
        { content: { contains: query } },
        { category: { contains: query } }
      ]
    },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    take: 10
  });

  return jsonOk({
    query,
    chunks: results,
    companyKnowledge
  });
}
