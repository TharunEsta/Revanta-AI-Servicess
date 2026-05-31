import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/revanta-os/db";
import { getCompanyKnowledgeContext } from "@/lib/revanta-os/knowledge";
import { toJsonObject, toJsonValue } from "@/lib/revanta-os/json";

type AIProvider = "openrouter" | "openai" | "claude" | "gemini";

type AIPurpose = "chat" | "qualify" | "score" | "summarize" | "reply";

const providerOrder: AIProvider[] = ["openrouter", "openai", "claude", "gemini"];

function getProviderKey(provider: AIProvider) {
  if (provider === "openrouter") return process.env.OPENROUTER_API_KEY || null;
  if (provider === "openai") return process.env.OPENAI_API_KEY || null;
  if (provider === "claude") return process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || null;
  return process.env.GEMINI_API_KEY || null;
}

function getModel(provider: AIProvider) {
  if (provider === "openrouter") return process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
  if (provider === "openai") return process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (provider === "claude") return process.env.CLAUDE_MODEL || process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
  return process.env.GEMINI_MODEL || "gemini-1.5-pro";
}

async function callProvider(provider: AIProvider, prompt: string, system: string) {
  const apiKey = getProviderKey(provider);
  if (!apiKey) return null;

  try {
    if (provider === "openrouter") {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: getModel(provider),
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt }
          ]
        })
      });
      if (!response.ok) return null;
      const json = await response.json();
      return json?.choices?.[0]?.message?.content || null;
    }

    if (provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: getModel(provider),
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt }
          ]
        })
      });
      if (!response.ok) return null;
      const json = await response.json();
      return json?.choices?.[0]?.message?.content || null;
    }

    if (provider === "claude") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: getModel(provider),
          max_tokens: 1024,
          system,
          messages: [{ role: "user", content: prompt }]
        })
      });
      if (!response.ok) return null;
      const json = await response.json();
      return json?.content?.[0]?.text || null;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(getModel(provider))}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        })
      }
    );
    if (!response.ok) return null;
    const json = await response.json();
    return json?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || null;
  } catch {
    return null;
  }
}

function buildKnowledgeAwareSystemPrompt(baseSystem: string, knowledgeContext: string) {
  if (!knowledgeContext.trim()) {
    return `${baseSystem}\n\nUse the available record context only. Do not invent company-specific facts.`;
  }

  return `${baseSystem}\n\nCompany knowledge:\n${knowledgeContext}\n\nUse the company knowledge above before drafting any response.`;
}

function parseJsonResponse(output: string) {
  const trimmed = output.trim();
  const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1]?.trim() || trimmed;
  try {
    return JSON.parse(candidate) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function inferLeadIndustry(lead: {
  companyName?: string | null;
  category?: string | null;
  notes?: string | null;
  website?: string | null;
  sourceLabel?: string | null;
}) {
  const haystack = `${lead.companyName || ""} ${lead.category || ""} ${lead.notes || ""} ${lead.website || ""} ${lead.sourceLabel || ""}`.toLowerCase();
  const rules: Array<[string[], string]> = [
    [["saas", "software", "app", "platform", "crm"], "Software / SaaS"],
    [["health", "clinic", "doctor", "hospital"], "Healthcare"],
    [["real estate", "property", "broker", "builder"], "Real Estate"],
    [["agency", "marketing", "creative", "brand"], "Agency / Services"],
    [["education", "school", "academy", "institute"], "Education"],
    [["retail", "ecommerce", "shop", "store"], "Retail / E-commerce"],
    [["manufactur", "factory", "industrial"], "Manufacturing"],
    [["finance", "fintech", "bank", "account"], "Finance"]
  ];

  for (const [keywords, industry] of rules) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return industry;
    }
  }

  return lead.category || "General";
}

function inferRecommendedService(industry: string, lead: { website?: string | null; notes?: string | null }) {
  const haystack = `${industry} ${lead.website || ""} ${lead.notes || ""}`.toLowerCase();
  if (haystack.includes("saas") || haystack.includes("software") || haystack.includes("crm")) {
    return "CRM + AI automation";
  }
  if (haystack.includes("health")) {
    return "Patient acquisition and workflow automation";
  }
  if (haystack.includes("real estate")) {
    return "Lead qualification and WhatsApp follow-up automation";
  }
  if (haystack.includes("agency")) {
    return "Sales systems and client communication automation";
  }
  return "WhatsApp sales automation and customer operations";
}

function inferIntent(lead: { notes?: string | null; sourceLabel?: string | null; companyName?: string | null }) {
  const haystack = `${lead.notes || ""} ${lead.sourceLabel || ""} ${lead.companyName || ""}`.toLowerCase();
  if (haystack.includes("pricing") || haystack.includes("cost") || haystack.includes("quote")) return "Pricing inquiry";
  if (haystack.includes("demo") || haystack.includes("call") || haystack.includes("meeting")) return "Demo request";
  if (haystack.includes("support") || haystack.includes("help") || haystack.includes("issue")) return "Support / follow-up";
  if (haystack.includes("automation") || haystack.includes("workflow") || haystack.includes("crm")) return "Automation interest";
  return "General interest";
}

function scoreLeadHeuristically(lead: {
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  notes?: string | null;
  companyName?: string | null;
  category?: string | null;
}) {
  let score = 30;
  if (lead.email) score += 15;
  if (lead.phone) score += 15;
  if (lead.website) score += 10;
  if (lead.companyName) score += 10;
  if (lead.category) score += 10;
  if (lead.notes && lead.notes.length > 120) score += 10;
  return Math.max(0, Math.min(100, score));
}

function buildFallbackQualification(lead: {
  companyName?: string | null;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  category?: string | null;
  sourceLabel?: string | null;
  notes?: string | null;
}) {
  const industry = inferLeadIndustry(lead);
  const score = scoreLeadHeuristically(lead);
  const intent = inferIntent(lead);
  const recommendedService = inferRecommendedService(industry, lead);
  const qualificationNotes = [
    lead.companyName ? `Company identified: ${lead.companyName}` : "Company not yet confirmed",
    lead.email ? "Email captured" : "Email missing",
    lead.phone ? "Phone captured" : "Phone missing",
    lead.notes ? "Conversation/notes available" : "Limited context available"
  ].join("; ");
  const nextBestAction =
    score >= 75
      ? "Assign owner and move to a live discovery conversation."
      : score >= 55
        ? "Send a targeted qualification message and request discovery details."
        : "Nurture with a short follow-up and confirm business fit.";

  return {
    score,
    intent,
    industry,
    recommendedService,
    qualificationNotes,
    nextBestAction,
    reasons: qualificationNotes.split("; "),
    followUpQuestions: [
      "What problem are you trying to solve right now?",
      "What tools or processes are you using today?",
      "What timeline are you working toward?"
    ]
  };
}

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

function estimateCost(provider: AIProvider, inputTokens: number, outputTokens: number) {
  const totalTokens = inputTokens + outputTokens;
  const ratePerMillion =
    provider === "openrouter" ? 1.5 : provider === "openai" ? 2.5 : provider === "claude" ? 3.0 : 2.0;
  return Number(((totalTokens / 1_000_000) * ratePerMillion).toFixed(6));
}

export async function runAIPrompt(params: {
  organizationId: string;
  userId?: string | null;
  purpose: AIPurpose;
  prompt: string;
  system: string;
  parseJson?: boolean;
  promptVersion?: string;
}) {
  const knowledgeContext = await getCompanyKnowledgeContext(params.organizationId, params.prompt);
  const system = buildKnowledgeAwareSystemPrompt(params.system, knowledgeContext);
  const startedAt = Date.now();
  const inputTokens = estimateTokens(`${system}\n${params.prompt}`);

  let output: string | null = null;
  let usedProvider: AIProvider | null = null;

  for (const provider of providerOrder) {
    output = await callProvider(provider, params.prompt, system);
    if (output) {
      usedProvider = provider;
      break;
    }
  }

  if (!output) {
    throw new Error("No AI provider is configured or available.");
  }

  const parsed = params.parseJson ? parseJsonResponse(output) : null;
  const outputTokens = estimateTokens(output);
  const totalTokens = inputTokens + outputTokens;
  const estimatedCost = estimateCost(usedProvider ?? "openai", inputTokens, outputTokens);


  await prisma.activity.create({
    data: {
      organizationId: params.organizationId,
      actorId: params.userId || undefined,
      type: `AI_${params.purpose.toUpperCase()}`,
      title: `AI ${params.purpose}`,
      body: usedProvider ? `${usedProvider}: ${output}` : output
    }
  });

  await (prisma as any).aiUsage.create({

    data: {
      organizationId: params.organizationId,
      userId: params.userId || null,
      provider: usedProvider,
      model: usedProvider ? getModel(usedProvider) : "gpt-4o-mini",

      requestType: params.purpose,
      promptVersion: params.promptVersion || "v1",
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost,
      latencyMs: Date.now() - startedAt,
      status: "SUCCEEDED",
      metadata: toJsonValue({
        purpose: params.purpose,
        parseJson: params.parseJson === true,
        knowledgeContextLength: knowledgeContext.length
      })
    }
  });

  return { output, provider: usedProvider, parsed, knowledgeContext };
}

export async function qualifyLeadWithBrain(params: {
  organizationId: string;
  userId?: string | null;
  lead: {
    id: string;
    companyName?: string | null;
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    category?: string | null;
    sourceLabel?: string | null;
    notes?: string | null;
    status?: string | null;
    score?: number | null;
    enrichment?: Prisma.JsonValue | null;
    aiSummary?: Prisma.JsonValue | null;
  };
  conversationContext?: string;
}) {
  const prompt = JSON.stringify({
    leadId: params.lead.id,
    companyName: params.lead.companyName,
    fullName: params.lead.fullName,
    email: params.lead.email,
    phone: params.lead.phone,
    website: params.lead.website,
    category: params.lead.category,
    sourceLabel: params.lead.sourceLabel,
    notes: params.lead.notes,
    status: params.lead.status,
    score: params.lead.score,
    conversationContext: params.conversationContext || ""
  });

  let result: { output: string | null; provider: AIProvider | null; parsed: Record<string, unknown> | null; knowledgeContext: string };
  try {
    result = await runAIPrompt({
      organizationId: params.organizationId,
      userId: params.userId,
      purpose: "qualify",
      prompt,
      parseJson: true,
      system:
        "You qualify leads for Revanta OS. Return JSON with score, intent, industry, recommendedService, qualificationNotes, nextBestAction, reasons, and followUpQuestions."
    });
  } catch {
    const fallback = buildFallbackQualification(params.lead);
    result = {
      output: JSON.stringify(fallback),
      provider: null,
      parsed: fallback,
      knowledgeContext: await getCompanyKnowledgeContext(params.organizationId, prompt)
    };
  }

  const parsed = result.parsed || buildFallbackQualification(params.lead);
  return {
    result,
    parsed
  };
}
