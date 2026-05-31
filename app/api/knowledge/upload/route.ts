import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { getSessionFromRequest } from "@/lib/revanta-os/auth";
import { jsonError, jsonOk } from "@/lib/revanta-os/http";
import { extractTextFromUpload, ingestKnowledgeDocument } from "@/lib/revanta-os/knowledge";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.orgId) return jsonError("Unauthorized", 401);

  const formData = await request.formData().catch(() => null);
  if (!formData) return jsonError("Invalid multipart upload.");

  const fileEntry = formData.get("file");
  const file = fileEntry instanceof File ? fileEntry : null;
  const textValue = typeof formData.get("content") === "string" ? (formData.get("content") as string) : "";
  const titleValue = typeof formData.get("title") === "string" ? (formData.get("title") as string) : "";
  const knowledgeBaseId = typeof formData.get("knowledgeBaseId") === "string" ? (formData.get("knowledgeBaseId") as string) : null;
  const sourceName = typeof formData.get("sourceName") === "string" ? (formData.get("sourceName") as string) : null;
  const sourceType = typeof formData.get("sourceType") === "string" ? (formData.get("sourceType") as string) : "upload";
  const sourceUrl = typeof formData.get("sourceUrl") === "string" ? (formData.get("sourceUrl") as string) : null;
  const category = typeof formData.get("category") === "string" ? (formData.get("category") as string) : null;

  let extractedText = textValue.trim();
  let fileName: string | null = null;
  let mimeType: string | null = null;
  let pageCount: number | null = null;
  let checksum: string | null = null;

  if (file) {
    fileName = file.name;
    mimeType = file.type || null;
    const extracted = await extractTextFromUpload(file);
    extractedText = extracted.text || extractedText;
    pageCount = extracted.pageCount;
    const buffer = Buffer.from(await file.arrayBuffer());
    checksum = createHash("sha256").update(buffer).digest("hex");
  }

  if (!extractedText.trim()) {
    return jsonError("Document content could not be extracted.");
  }

  const title = titleValue.trim() || fileName || sourceName || "Knowledge document";
  const result = await ingestKnowledgeDocument({
    organizationId: session.orgId,
    title,
    content: extractedText,
    sourceType: category || sourceType,
    sourceName,
    sourceUrl,
    fileName,
    mimeType,
    checksum,
    pageCount,
    knowledgeBaseId,
    metadata: {
      uploadedAt: new Date().toISOString()
    }
  });

  return jsonOk(result, { status: 201 });
}
