import { createHash } from "node:crypto";
import { inflateRawSync, inflateSync } from "node:zlib";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/revanta-os/db";
import { toJsonObject, toJsonValue } from "@/lib/revanta-os/json";

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "have",
  "he",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "our",
  "she",
  "that",
  "the",
  "their",
  "this",
  "to",
  "was",
  "we",
  "were",
  "with",
  "you",
  "your"
]);

function normalizeKnowledgeLabel(sourceType: string | null | undefined) {
  const value = (sourceType || "general").toLowerCase();
  if (value.includes("service")) return "Services";
  if (value.includes("industry")) return "Industries";
  if (value.includes("faq")) return "FAQs";
  if (value.includes("sales")) return "Sales Scripts";
  if (value.includes("qualification")) return "Qualification Logic";
  if (value.includes("discovery")) return "Discovery Questions";
  if (value.includes("objection")) return "Objection Handling";
  if (value.includes("case")) return "Case Studies";
  return "Company Information";
}

function normalizeText(input: string) {
  return input
    .replace(/\r/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function tokenize(input: string) {
  return normalizeText(input)
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function hashToken(token: string, dimensions: number) {
  const digest = createHash("sha1").update(token).digest();
  return digest.readUInt32BE(0) % dimensions;
}

export function buildEmbeddingVector(text: string, dimensions = 64) {
  const vector = Array.from({ length: dimensions }, () => 0);
  const tokens = tokenize(text);
  if (!tokens.length) {
    return vector;
  }

  for (const token of tokens) {
    vector[hashToken(token, dimensions)] += 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / magnitude).toFixed(8)));
}

function cosineSimilarity(left: number[], right: number[]) {
  const size = Math.min(left.length, right.length);
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < size; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

export function splitTextIntoChunks(text: string, maxCharacters = 1200, overlap = 160) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return [];
  }

  const paragraphs = normalized.split(/\n{2,}/g);
  const chunks: string[] = [];
  let current = "";

  const pushCurrent = () => {
    const trimmed = current.trim();
    if (trimmed) {
      chunks.push(trimmed);
    }
    current = "";
  };

  for (const paragraph of paragraphs) {
    const textBlock = paragraph.trim();
    if (!textBlock) continue;

    if ((current + "\n\n" + textBlock).trim().length > maxCharacters && current) {
      pushCurrent();
    }

    if (textBlock.length > maxCharacters) {
      const sentences = textBlock.split(/(?<=[.!?])\s+/g);
      for (const sentence of sentences) {
        if ((current + " " + sentence).trim().length > maxCharacters && current) {
          pushCurrent();
        }
        current = current ? `${current} ${sentence}` : sentence;
        if (current.length >= maxCharacters) {
          pushCurrent();
        }
      }
      continue;
    }

    current = current ? `${current}\n\n${textBlock}` : textBlock;
  }

  pushCurrent();

  if (overlap > 0 && chunks.length > 1) {
    const overlapped: string[] = [];
    for (let index = 0; index < chunks.length; index += 1) {
      const previous = index > 0 ? chunks[index - 1].slice(Math.max(0, chunks[index - 1].length - overlap)) : "";
      overlapped.push(previous ? `${previous}\n${chunks[index]}` : chunks[index]);
    }
    return overlapped;
  }

  return chunks;
}

function unescapePdfString(input: string) {
  let output = "";
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character !== "\\") {
      output += character;
      continue;
    }

    index += 1;
    const next = input[index];
    if (!next) break;

    if (next === "n") output += "\n";
    else if (next === "r") output += "\r";
    else if (next === "t") output += "\t";
    else if (next === "b") output += "\b";
    else if (next === "f") output += "\f";
    else if (next === "(") output += "(";
    else if (next === ")") output += ")";
    else if (next === "\\") output += "\\";
    else if (/[0-7]/.test(next)) {
      const octal = next + (/[0-7]/.test(input[index + 1] || "") ? input[++index] : "") + (/[0-7]/.test(input[index + 1] || "") ? input[++index] : "");
      output += String.fromCharCode(parseInt(octal, 8));
    } else {
      output += next;
    }
  }
  return output;
}

function extractTextFromPdfBuffer(buffer: Buffer) {
  const ascii = buffer.toString("latin1");
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  const texts: string[] = [];

  for (const match of ascii.matchAll(streamRegex)) {
    const streamText = match[1];
    const prefix = ascii.slice(Math.max(0, match.index - 300), match.index);
    const rawBuffer = Buffer.from(streamText, "latin1");

    let decodedBuffer: Buffer | null = null;
    if (/\/FlateDecode/i.test(prefix)) {
      try {
        decodedBuffer = inflateSync(rawBuffer);
      } catch {
        try {
          decodedBuffer = inflateRawSync(rawBuffer);
        } catch {
          decodedBuffer = null;
        }
      }
    }

    const decodedText = (decodedBuffer || rawBuffer).toString("latin1");
    const stringMatches = [
      ...decodedText.matchAll(/\((?:\\.|[^\\)])*\)\s*T[Jj]/g),
      ...decodedText.matchAll(/\[(?:[\s\S]*?)\]\s*TJ/g)
    ];

    for (const stringMatch of stringMatches) {
      const source = stringMatch[1] || stringMatch[0];
      const inner = source.match(/\(([\s\S]*?)\)/)?.[1];
      if (inner) {
        texts.push(unescapePdfString(inner));
      }
    }

    if (!stringMatches.length) {
      const cleaned = decodedText.replace(/[^A-Za-z0-9\s.,;:!?'"'"'"/-]/g, " ").replace(/\s{2,}/g, " ").trim();
      if (cleaned.length > 20) {
        texts.push(cleaned);
      }
    }
  }

  const joined = normalizeText(texts.join("\n"));
  if (joined) {
    return joined;
  }

  const fallback = ascii.replace(/[^A-Za-z0-9\s.,;:!?'"'"'"/-]/g, " ").replace(/\s{2,}/g, " ").trim();
  return normalizeText(fallback);
}

export async function extractTextFromUpload(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const lowerName = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || lowerName.endsWith(".pdf");
  const isTextLike =
    file.type.startsWith("text/") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".csv") ||
    lowerName.endsWith(".json") ||
    lowerName.endsWith(".xml") ||
    lowerName.endsWith(".html");

  const text = isPdf ? extractTextFromPdfBuffer(buffer) : isTextLike ? normalizeText(buffer.toString("utf8")) : normalizeText(buffer.toString("utf8"));
  const pageCount = isPdf ? Math.max(1, (buffer.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length) : 1;
  return { text, pageCount, isPdf };
}

function getEmbeddingFromJson(value: Prisma.JsonValue | null | undefined) {
  if (!Array.isArray(value)) {
    return null;
  }

  const vector = value
    .map((item) => (typeof item === "number" ? item : Number(item)))
    .filter((item) => Number.isFinite(item));

  return vector.length ? vector : null;
}

async function findOrCreateDefaultKnowledgeBase(organizationId: string) {
  const existing = await prisma.knowledgeBase.findFirst({
    where: { organizationId, slug: "company-brain" }
  });

  if (existing) {
    return existing;
  }

  return prisma.knowledgeBase.create({
    data: {
      organizationId,
      name: "Company Brain",
      slug: "company-brain",
      status: "PUBLISHED",
      description: "Default company knowledge base for Revanta AI.",
      settings: toJsonValue({
        default: true
      })
    }
  });
}

export async function ingestKnowledgeDocument(params: {
  organizationId: string;
  title: string;
  content: string;
  sourceType?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  checksum?: string | null;
  pageCount?: number | null;
  knowledgeBaseId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const knowledgeBase = params.knowledgeBaseId
    ? await prisma.knowledgeBase.findFirst({ where: { id: params.knowledgeBaseId, organizationId: params.organizationId } })
    : await findOrCreateDefaultKnowledgeBase(params.organizationId);

  if (!knowledgeBase) {
    throw new Error("Knowledge base not found.");
  }

  const fullText = normalizeText(params.content);
  const document = await prisma.document.create({
    data: {
      organizationId: params.organizationId,
      knowledgeBaseId: knowledgeBase.id,
      title: params.title,
      slug: params.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120),
      status: "PUBLISHED",
      sourceType: params.sourceType || "upload",
      sourceName: params.sourceName || null,
      sourceUrl: params.sourceUrl || null,
      fileName: params.fileName || null,
      mimeType: params.mimeType || null,
      textContent: fullText,
      checksum: params.checksum || null,
      pageCount: params.pageCount ?? null,
      content: fullText,
      metadata: toJsonValue(params.metadata || {})
    }
  });

  const chunks = splitTextIntoChunks(fullText).map((chunk, index) => ({
    organizationId: params.organizationId,
    documentId: document.id,
    chunkIndex: index,
    content: chunk,
    embedding: toJsonValue(buildEmbeddingVector(chunk)),
    tokenCount: tokenize(chunk).length,
    metadata: toJsonValue({
      sourceType: params.sourceType || "upload",
      sourceName: params.sourceName || null
    })
  }));

  if (chunks.length) {
    await prisma.documentChunk.createMany({
      data: chunks
    });
  }

  return { knowledgeBase, document, chunksCreated: chunks.length };
}

async function fetchRelevantChunks(params: {
  organizationId: string;
  query: string;
  topK: number;
  knowledgeBaseId?: string | null;
  documentId?: string | null;
}) {
  const where: Prisma.DocumentChunkWhereInput = {
    organizationId: params.organizationId,
    document: {
      is: {
        status: { not: "ARCHIVED" }
      }
    }
  };

  if (params.knowledgeBaseId) {
    where.document = {
      is: {
        ...(where.document && "is" in where.document ? where.document.is : {}),
        knowledgeBaseId: params.knowledgeBaseId
      }
    };
  }

  if (params.documentId) {
    where.documentId = params.documentId;
  }

  const chunks = await prisma.documentChunk.findMany({
    where,
    include: {
      document: {
        include: {
          knowledgeBase: true
        }
      }
    },
    orderBy: { updatedAt: "desc" },
    take: 400
  });

  const queryEmbedding = buildEmbeddingVector(params.query);
  const queryTokens = tokenize(params.query);

  const ranked = chunks
    .map((chunk) => {
      const embedding = getEmbeddingFromJson(chunk.embedding) || buildEmbeddingVector(chunk.content);
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      const chunkTokens = tokenize(chunk.content);
      const tokenHits = queryTokens.reduce((count, token) => count + (chunkTokens.includes(token) ? 1 : 0), 0);
      const score = similarity + tokenHits * 0.12;
      return {
        chunk,
        score,
        similarity,
        tokenHits
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, params.topK);

  return ranked;
}

export async function searchKnowledgeChunks(params: {
  organizationId: string;
  query: string;
  topK?: number;
  knowledgeBaseId?: string | null;
  documentId?: string | null;
}) {
  return fetchRelevantChunks({
    ...params,
    topK: params.topK || 8
  });
}

export async function retrieveKnowledgeContext(params: {
  organizationId: string;
  query: string;
  topK?: number;
  knowledgeBaseId?: string | null;
  documentId?: string | null;
}) {
  const matches = await searchKnowledgeChunks(params);
  return matches.map((match) => ({
    documentId: match.chunk.documentId,
    documentTitle: match.chunk.document.title,
    knowledgeBase: match.chunk.document.knowledgeBase?.name || null,
    content: match.chunk.content,
    score: match.score,
    sourceType: match.chunk.document.sourceType,
    sourceUrl: match.chunk.document.sourceUrl,
    chunkIndex: match.chunk.chunkIndex
  }));
}

export async function getCompanyKnowledgeContext(organizationId: string, query?: string) {
  const [companyKnowledge, knowledgeBases, documentMatches] = await Promise.all([
    prisma.companyKnowledge.findMany({
      where: {
        organizationId,
        status: { not: "ARCHIVED" }
      },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      take: 40
    }),
    prisma.knowledgeBase.findMany({
      where: {
        organizationId,
        status: { not: "ARCHIVED" }
      },
      include: {
        documents: {
          where: { status: { not: "ARCHIVED" } },
          orderBy: { updatedAt: "desc" },
          take: 20
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 8
    }),
    query ? retrieveKnowledgeContext({ organizationId, query, topK: 6 }) : Promise.resolve([])
  ]);

  const sections: string[] = [];

  const groupedCompanyKnowledge = new Map<string, string[]>();
  for (const entry of companyKnowledge) {
    const label = normalizeKnowledgeLabel(entry.category);
    if (!groupedCompanyKnowledge.has(label)) {
      groupedCompanyKnowledge.set(label, []);
    }
    groupedCompanyKnowledge.get(label)?.push(`${entry.title}: ${entry.content}`);
  }

  for (const [label, entries] of groupedCompanyKnowledge.entries()) {
    sections.push(`${label}\n${entries.slice(0, 10).map((item) => `- ${item}`).join("\n")}`);
  }

  for (const knowledgeBase of knowledgeBases) {
    const documentLines = knowledgeBase.documents
      .slice(0, 6)
      .map((document) => {
        const sourceLabel = document.sourceName || document.sourceType || "Document";
        return `- ${document.title} (${sourceLabel})${document.sourceUrl ? ` — ${document.sourceUrl}` : ""}`;
      })
      .join("\n");
    if (documentLines) {
      sections.push(`${knowledgeBase.name}\n${documentLines}`);
    }
  }

  if (documentMatches.length) {
    sections.push(
      `Relevant document chunks\n${documentMatches
        .map((match) => `- ${match.documentTitle} [chunk ${match.chunkIndex}]: ${match.content}`)
        .join("\n")}`
    );
  }

  return sections.join("\n\n");
}

export async function getCompanyKnowledgeStats(organizationId: string) {
  const [knowledgeBaseCount, documentCount, chunkCount, companyKnowledgeCount] = await Promise.all([
    prisma.knowledgeBase.count({ where: { organizationId, status: { not: "ARCHIVED" } } }),
    prisma.document.count({ where: { organizationId, status: { not: "ARCHIVED" } } }),
    prisma.documentChunk.count({ where: { organizationId } }),
    prisma.companyKnowledge.count({ where: { organizationId, status: { not: "ARCHIVED" } } })
  ]);

  return { knowledgeBaseCount, documentCount, chunkCount, companyKnowledgeCount };
}

export async function findOrCreateLeadQualificationContext(organizationId: string, query: string) {
  return getCompanyKnowledgeContext(organizationId, query);
}
