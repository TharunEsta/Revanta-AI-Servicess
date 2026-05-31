import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/revanta-os/db";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk } from "@/lib/revanta-os/http";
import { extractTextFromUpload } from "@/lib/revanta-os/knowledge";
import { toJsonValue } from "@/lib/revanta-os/json";

async function buildProjectDocument(params: {
  organizationId: string;
  projectId: string;
  title: string;
  textContent: string;
  sourceName?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  pageCount?: number | null;
  checksum?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  return prisma.document.create({
    data: {
      organizationId: params.organizationId,
      projectId: params.projectId,
      title: params.title,
      slug: params.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120),
      status: "PUBLISHED",
      sourceType: "project-upload",
      sourceName: params.sourceName || "Project upload",
      sourceUrl: null,
      fileName: params.fileName || null,
      mimeType: params.mimeType || null,
      textContent: params.textContent,
      checksum: params.checksum || null,
      pageCount: params.pageCount ?? null,
      content: params.textContent,
      metadata: toJsonValue(params.metadata || {})
    }
  });
}

export async function GET(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const project = await prisma.project.findFirst({ where: { id, organizationId: session.orgId } });
  if (!project) return jsonError("Not found", 404);
  const documents = await prisma.document.findMany({
    where: { organizationId: session.orgId, projectId: id },
    orderBy: { createdAt: "desc" }
  });
  return jsonOk(documents);
}

export async function POST(request: NextRequest, context: any) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const project = await prisma.project.findFirst({ where: { id, organizationId: session.orgId } });
  if (!project) return jsonError("Not found", 404);

  const formData = await request.formData();
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const sourceName = String(formData.get("sourceName") || "").trim() || null;
  const file = formData.get("file");
  const fileName = file instanceof File ? file.name : null;
  const mimeType = file instanceof File ? file.type : null;
  const checksum = file instanceof File ? createHash("sha256").update(Buffer.from(await file.arrayBuffer())).digest("hex") : null;
  const extracted = file instanceof File ? await extractTextFromUpload(file) : { text: "", pageCount: null };
  const fileText = extracted.text;
  const textContent = content || fileText;
  const pageCount = extracted.pageCount;
  const metadata = {
    projectId: project.id,
    uploadedBy: session.userId,
    source: "client-portal"
  };

  if (!title || !textContent) {
    return jsonError("Title and document content are required.");
  }

  const document = await buildProjectDocument({
    organizationId: session.orgId,
    projectId: project.id,
    title,
    textContent,
    sourceName,
    fileName,
    mimeType,
    pageCount,
    checksum,
    metadata
  });

  await prisma.activity.create({
    data: {
      organizationId: session.orgId,
      actorId: session.userId,
      projectId: project.id,
      type: "PROJECT_DOCUMENT",
      title: `Document uploaded: ${document.title}`,
      body: fileName || document.title,
      metadata: toJsonValue({ projectId: project.id, documentId: document.id, fileName })
    }
  });

  return jsonOk(document, { status: 201 });
}
