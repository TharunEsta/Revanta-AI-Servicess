(function () {
  const source = document.querySelector(".assistant-shell");
  if (!source) return;

  const shell = source.cloneNode(true);
  source.replaceWith(shell);

  const el = (s) => shell.querySelector(s);
  const launcher = el("#assistant-launcher");
  const panel = el("#assistant-panel");
  const closeBtn = el("#assistant-close");
  const minimizeBtn = el("#assistant-minimize");
  const messages = el("#assistant-messages");
  const form = el("#assistant-form");
  const input = el("#assistant-input");
  const modes = Array.from(shell.querySelectorAll(".assistant-mode"));
  const chips = Array.from(shell.querySelectorAll(".assistant-chip"));
  const fit = el("#assistant-insight-fit");
  const complexity = el("#assistant-insight-complexity");
  const next = el("#assistant-insight-next");
  if (!launcher || !panel || !messages || !form || !input) return;

  const KEY = "revanta-copilot-v1";
  const MODE = {
    ask: "Ask REVIX",
    estimate: "Estimate Cost",
    features: "Suggest Features",
    "ai-business": "AI for My Business",
    mvp: "Build My MVP",
    proposal: "Get Proposal"
  };
  const OPENER = {
    ask: "Tell me what you need, and I’ll map the smartest direction.",
    estimate: "I’ll assess the scope, complexity, and budget direction.",
    features: "I’ll help shape the right feature set without overbuilding.",
    "ai-business": "I’ll identify where AI can save time and add leverage.",
    mvp: "I’ll help narrow the idea into a launchable MVP.",
    proposal: "I’ll summarize the project direction and next step."
  };
  const INDUSTRIES = [
    ["real estate", ["real estate", "property", "broker", "agent"], "lead capture website, listing portal, WhatsApp follow-up, CRM dashboard", ["AI lead qualification", "property recommendation engine", "enquiry automation"]],
    ["fashion", ["fashion", "clothing", "apparel", "garment", "textile"], "catalog website, wholesale portal, order dashboard, enquiry automation", ["AI enquiry sorting", "catalog assistance", "order update automation"]],
    ["startup", ["startup", "mvp", "saas", "product", "launch"], "MVP, product prototype, onboarding, payments, analytics", ["AI product assistant", "usage insights", "support automation"]],
    ["clinic", ["clinic", "hospital", "healthcare", "doctor", "patient", "medical"], "appointment system, patient enquiry bot, reminders, admin dashboard", ["AI FAQ assistant", "appointment triage", "reminder automation"]],
    ["ecommerce", ["ecommerce", "e-commerce", "store", "shop", "checkout"], "storefront, catalog, checkout flow, order dashboard", ["AI recommendation engine", "cart recovery automation", "support bot"]],
    ["agency", ["agency", "marketing", "design", "branding", "creative", "studio"], "agency website, client portal, proposal flow, project dashboard", ["AI proposal drafting", "lead scoring", "client update automation"]]
  ].map(([name, words, fit, ai]) => ({ name, words, fit, ai }));
  const PROJECTS = [
    ["website", ["website", "landing page", "company website", "portfolio", "marketing site"], "premium website / landing page", "3 days to 2 weeks", "₹25k - ₹50k"],
    ["web app", ["web app", "portal", "dashboard", "crm", "saas", "admin panel"], "web app / dashboard / portal", "2 to 6 weeks", "₹50k - ₹1.5L"],
    ["mobile app", ["mobile app", "android app", "ios app", "application", "app development"], "Android / iOS app build", "4 to 10 weeks", "₹1L - ₹3L+"],
    ["ai automation", ["ai automation", "automation", "workflow automation", "agent", "bot", "assistant"], "AI automation system", "1 to 3 weeks", "₹35k - ₹1.5L"],
    ["fine tuning", ["fine tuning", "finetuning", "model training", "ai model", "llm"], "AI fine-tuning / custom model workflow", "3 to 8 weeks", "₹1.5L - ₹6L+"]
  ].map(([name, words, fit, time, price]) => ({ name, words, fit, time, price }));
  const FEATURES = [
    ["website", "Website", ["website", "site", "landing", "pages", "responsive"]],
    ["dashboard", "Dashboard", ["dashboard", "panel", "admin", "analytics"]],
    ["auth", "Login / Roles", ["login", "sign in", "auth", "roles", "permissions", "users"]],
    ["payments", "Payments", ["payment", "payments", "checkout", "subscription", "stripe", "razorpay"]],
    ["crm", "CRM / Leads", ["crm", "lead", "leads", "sales pipeline", "enquiry", "inquiry"]],
    ["ai", "AI Integration", ["ai", "chatbot", "assistant", "llm", "automation", "agent"]],
    ["automation", "Automation", ["automation", "workflow", "trigger", "sync", "integration"]],
    ["mobile", "Mobile App", ["mobile", "android", "ios", "app"]]
  ].map(([key, label, words]) => ({ key, label, words }));

  const state = load();
  let typing = null;
  let opened = false;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return {
        mode: "ask",
        minimized: false,
        profile: { industry: null, project: null, features: [] },
        lead: {
          name: "",
          email: "",
          company: "",
          budget: "",
          requirement: "",
          projectType: "",
          industry: "",
          features: [],
          aiSuggestions: [],
          timeline: "",
          complexity: "",
          summary: "",
          userMessage: ""
        },
        leadStage: "idle"
      };
      const s = JSON.parse(raw);
      return {
        mode: s.mode || "ask",
        minimized: !!s.minimized,
        profile: { industry: s.profile?.industry || null, project: s.profile?.project || null, features: Array.isArray(s.profile?.features) ? s.profile.features : [] },
        lead: {
          name: s.lead?.name || "",
          email: s.lead?.email || "",
          company: s.lead?.company || "",
          budget: s.lead?.budget || "",
          requirement: s.lead?.requirement || "",
          projectType: s.lead?.projectType || "",
          industry: s.lead?.industry || "",
          features: Array.isArray(s.lead?.features) ? s.lead.features : [],
          aiSuggestions: Array.isArray(s.lead?.aiSuggestions) ? s.lead.aiSuggestions : [],
          timeline: s.lead?.timeline || "",
          complexity: s.lead?.complexity || "",
          summary: s.lead?.summary || "",
          userMessage: s.lead?.userMessage || ""
        },
        leadStage: s.leadStage || "idle"
      };
    } catch {
      return {
        mode: "ask",
        minimized: false,
        profile: { industry: null, project: null, features: [] },
        lead: {
          name: "",
          email: "",
          company: "",
          budget: "",
          requirement: "",
          projectType: "",
          industry: "",
          features: [],
          aiSuggestions: [],
          timeline: "",
          complexity: "",
          summary: "",
          userMessage: ""
        },
        leadStage: "idle"
      };
    }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }
  const norm = (v) => (v || "").toLowerCase().replace(/[^a-z0-9₹+\s]/g, " ").replace(/\s+/g, " ").trim();
  const has = (t, list) => list.some((w) => t.includes(w));
  const findIndustry = (text) => {
    const t = norm(text);
    return INDUSTRIES.find((x) => has(t, x.words)) || null;
  };
  const findProject = (text) => {
    const t = norm(text);
    return PROJECTS.find((x) => has(t, x.words)) || null;
  };
  const findFeatures = (text) => {
    const t = norm(text);
    return FEATURES.filter((x) => has(t, x.words));
  };
  function intent(text) {
    const t = norm(text);
    const s = { website: 0, mobile: 0, ai: 0, pricing: 0, mvp: 0, contact: 0, features: 0 };
    const add = (words, key, points = 1) => { if (has(t, words)) s[key] += points; };
    add(["website", "web app", "portal", "dashboard", "crm", "saas"], "website", 2);
    add(["mobile", "android", "ios", "app development"], "mobile", 2);
    add(["ai", "automation", "chatbot", "fine tuning", "model"], "ai", 2);
    add(["price", "pricing", "cost", "budget", "quote", "estimate"], "pricing", 2);
    add(["mvp", "startup", "idea", "launch"], "mvp", 2);
    add(["contact", "proposal", "whatsapp", "email", "call"], "contact", 2);
    add(["feature", "features", "login", "payments", "admin", "roles"], "features", 2);
    return Object.entries(s).sort((a, b) => b[1] - a[1])[0]?.[0] || "website";
  }
  function complexityScore(profile, text) {
    const t = norm(text);
    let n = profile.features.length * 1.1;
    if (profile.project?.name === "mobile app") n += 3;
    if (profile.project?.name === "web app") n += 2;
    if (profile.project?.name === "ai automation") n += 2.5;
    if (profile.project?.name === "fine tuning") n += 4;
    if (has(t, ["payment", "checkout", "subscription"])) n += 1.2;
    if (has(t, ["login", "roles", "permissions"])) n += 1.2;
    if (has(t, ["integration", "api", "whatsapp", "stripe", "razorpay"])) n += 1.4;
    if (has(t, ["ai", "automation", "assistant", "bot"])) n += 1.8;
    if (profile.industry?.name) n += 0.8;
    return n;
  }
  const band = (n) => n < 3.5 ? ["Simple", "lean, fast, and focused"] : n < 6 ? ["Medium", "structured with a few moving parts"] : n < 9 ? ["Advanced", "multi-layer with integrations"] : ["Premium / custom AI", "strategic, multi-system, and tailored"];
  const price = (n, p) => p?.name === "fine tuning" ? "₹1.5L - ₹6L+" : p?.name === "mobile app" ? (n < 7 ? "₹1L - ₹2.5L" : "₹2L - ₹5L+") : p?.name === "ai automation" ? (n < 5 ? "₹35k - ₹75k" : "₹75k - ₹2L") : p?.name === "web app" ? (n < 6 ? "₹50k - ₹1.5L" : "₹1L - ₹3L+") : p?.name === "mvp" ? (n < 6 ? "₹50k - ₹1.5L" : "₹1L - ₹2.5L+") : n < 3.5 ? "₹25k - ₹50k" : n < 6 ? "₹50k - ₹1L" : n < 9 ? "₹1L - ₹2.5L" : "₹2.5L - ₹6L+";
  const timeline = (n, p, fc) => p?.name === "fine tuning" ? "3 - 8 weeks" : p?.name === "mobile app" ? "4 - 10 weeks" : p?.name === "ai automation" ? (fc > 4 ? "2 - 5 weeks" : "1 - 3 weeks") : p?.name === "web app" ? (n < 6 ? "2 - 4 weeks" : "4 - 8 weeks") : p?.name === "mvp" ? (n < 6 ? "3 - 6 weeks" : "5 - 10 weeks") : n < 3.5 ? "3 days - 1.5 weeks" : n < 6 ? "1 - 3 weeks" : n < 9 ? "3 - 6 weeks" : "6 - 12+ weeks";
  const fitText = (profile) => profile.project?.fit || profile.industry?.fit || "Smart fit";
  const leadStageOrder = ["name", "email", "company", "requirement", "budget", "notes"];
  const leadQuestions = {
    name: "What name should I use for the project brief?",
    email: "What email should we send the brief to?",
    company: "What is your business or company name?",
    requirement: "What are you planning to build?",
    budget: "What budget range should I place this in?",
    notes: "Any extra notes, must-have features, or timeline details?"
  };
  const normalizeBudget = (text) => {
    const t = norm(text);
    if (has(t, ["under", "50k", "₹50k", "below 50k"])) return "Under ₹50k";
    if (has(t, ["50k", "1l", "₹50k - ₹1L", "50000", "1 lakh"])) return "₹50k - ₹1L";
    if (has(t, ["1l", "2l", "₹1L - ₹2L", "100000", "2 lakh"])) return "₹1L - ₹2L";
    if (has(t, ["2l", "5l", "₹2L+", "premium"])) return "₹2L+";
    return text.trim();
  };
  const extractEmail = (text) => text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const extractName = (text) => {
    const trimmed = text.trim();
    if (/^my name is\s+/i.test(trimmed)) return trimmed.replace(/^my name is\s+/i, "").trim();
    if (/^i am\s+/i.test(trimmed)) return trimmed.replace(/^i am\s+/i, "").trim();
    if (/^i'm\s+/i.test(trimmed)) return trimmed.replace(/^i'm\s+/i, "").trim();
    return trimmed.length <= 40 ? trimmed : "";
  };
  const extractCompany = (text) => {
    const trimmed = text.trim();
    const patterns = [
      /^my company is\s+/i,
      /^company\s*:\s*/i,
      /^business\s*:\s*/i,
      /^we are\s+/i,
      /^our company is\s+/i
    ];
    const match = patterns.find((pattern) => pattern.test(trimmed));
    return match ? trimmed.replace(match, "").trim() : (trimmed.length <= 60 ? trimmed : "");
  };
  const extractRequirement = (text) => {
    const t = text.trim();
    if (!t) return "";
    const lower = norm(t);
    if (has(lower, ["website"])) return "Business Website";
    if (has(lower, ["web app", "dashboard", "portal", "crm", "saas"])) return "Web App / Dashboard";
    if (has(lower, ["mobile", "android", "ios", "app"])) return "Mobile App";
    if (has(lower, ["automation", "workflow", "bot", "assistant"])) return "AI Automation";
    if (has(lower, ["fine tuning", "finetuning", "model"])) return "AI Fine-Tuning";
    if (has(lower, ["mvp", "startup", "launch"])) return "MVP Build";
    return t;
  };
  const aiIdeas = (industry, text) => {
    const t = norm(text);
    if (industry) return industry.ai.slice(0, 3);
    if (has(t, ["support", "help desk", "customer service"])) return ["AI support bot", "ticket triage", "reply drafting"];
    if (has(t, ["sales", "lead", "crm"])) return ["Lead qualification", "CRM enrichment", "follow-up automation"];
    return ["AI lead qualification", "AI workflow automation", "AI support assistant"];
  };
  const featureScope = (profile, text) => {
    const result = new Map(profile.features.map((item) => [item.key, item]));
    findFeatures(text).forEach((item) => result.set(item.key, item));
    if (profile.project?.name === "web app" || profile.project?.name === "mvp") {
      result.set("dashboard", { key: "dashboard", label: "Dashboard" });
      result.set("auth", { key: "auth", label: "Login / Roles" });
    }
    if (profile.project?.name === "ai automation") {
      result.set("ai", { key: "ai", label: "AI Integration" });
      result.set("automation", { key: "automation", label: "Automation" });
    }
    if (profile.project?.name === "mobile app") {
      result.set("mobile", { key: "mobile", label: "Mobile App" });
    }
    return Array.from(result.values()).map((item) => item.label);
  };
  const buildLeadSummary = (lead) => [
    "Project Summary:",
    "",
    "Business / Industry:",
    lead.company || lead.industry || "Not specified",
    "",
    "Project Type:",
    lead.projectType || lead.requirement || "Not specified",
    "",
    "Main Requirements:",
    ...(lead.features?.length ? lead.features.map((item) => `- ${item}`) : ["- Not specified"]),
    "",
    "AI / Automation Opportunities:",
    ...(lead.aiSuggestions?.length ? lead.aiSuggestions.map((item) => `- ${item}`) : ["- Not specified"]),
    "",
    "Estimated Complexity:",
    lead.complexity || "Not specified",
    "",
    "Estimated Budget Direction:",
    lead.budget || "Not specified",
    "",
    "Estimated Timeline:",
    lead.timeline || "Not specified",
    "",
    "Additional Notes:",
    lead.userMessage || lead.summary || "Not specified"
  ].join("\n");
  const leadReady = (lead) => Boolean(lead.name && lead.email && lead.company && lead.requirement && lead.budget);
  const nextLeadStage = (lead) => leadStageOrder.find((key) => !lead[key]) || null;
  const leadCards = (lead) => [
    { label: "Name", value: lead.name || "Pending", detail: lead.email || "Email needed" },
    { label: "Company", value: lead.company || "Pending", detail: lead.requirement || "Requirement needed" },
    { label: "Budget", value: lead.budget || "Pending", detail: lead.timeline || "Timeline inferred next" }
  ];
  const syncLeadFromText = (text) => {
    const lead = state.lead;
    const t = text.trim();
    const email = extractEmail(t);
    if (email) lead.email = email;

    const name = extractName(t);
    if (!lead.name && name && !email) lead.name = name;
    if (!lead.company) {
      const company = extractCompany(t);
      if (company && company !== name) lead.company = company;
    }

    const project = findProject(t) || state.profile.project;
    if (project && !lead.projectType) lead.projectType = project.fit;
    const req = extractRequirement(t);
    if (req && !lead.requirement) lead.requirement = req;
    const budget = normalizeBudget(t);
    if (!lead.budget && has(norm(t), ["50k", "1l", "2l", "budget", "₹"])) lead.budget = budget;
    const industry = findIndustry(t) || state.profile.industry;
    if (industry && !lead.industry) lead.industry = industry.name;
    lead.features = Array.from(new Set([...(lead.features || []), ...featureScope(state.profile, t)]));
    lead.aiSuggestions = Array.from(new Set([...(lead.aiSuggestions || []), ...aiIdeas(industry, t)]));
    lead.userMessage = [lead.userMessage, t].filter(Boolean).join("\n");
    return lead;
  };
  const getLeadPreview = () => {
    const lead = state.lead;
    const projectType = lead.projectType || state.profile.project?.fit || "Custom digital build";
    const complexity = lead.complexity || band(complexityScore(state.profile, lead.userMessage || "")).join(" - ");
    const timelineValue = lead.timeline || timeline(complexityScore(state.profile, lead.userMessage || ""), state.profile.project, lead.features.length || state.profile.features.length);
    const aiSuggestions = lead.aiSuggestions?.length ? lead.aiSuggestions : aiIdeas(state.profile.industry, lead.userMessage || "");
    const summary = lead.summary || buildLeadSummary({
      company: lead.company,
      projectType,
      features: lead.features.length ? lead.features : featureScope(state.profile, lead.userMessage || ""),
      aiSuggestions,
      complexity: lead.complexity || band(complexityScore(state.profile, lead.userMessage || ""))[0],
      budget: lead.budget,
      timeline: timelineValue,
      userMessage: lead.userMessage || "",
      industry: lead.industry || state.profile.industry?.name
    });

    return {
      name: lead.name,
      email: lead.email,
      company: lead.company,
      budget: lead.budget,
      requirement: lead.requirement,
      projectType,
      features: lead.features.length ? lead.features : featureScope(state.profile, lead.userMessage || ""),
      aiSuggestions,
      complexity: lead.complexity || band(complexityScore(state.profile, lead.userMessage || ""))[0],
      timeline: timelineValue,
      summary
    };
  };
  const writeLead = (partial) => {
    state.lead = { ...state.lead, ...partial };
    state.lead.summary = buildLeadSummary(getLeadPreview());
    save();
  };
  const leadPrompt = (field) => ({
    kicker: "Project brief",
    tag: "REVIX",
    title: "Let’s build your brief",
    text: leadQuestions[field],
    cards: leadCards(state.lead),
    followUp: "You can answer in one line. REVIX will map the details for you."
  });
  const leadReview = () => {
    const brief = getLeadPreview();
    return {
      kicker: "Project brief ready",
      tag: "REVIX",
      title: "Your Project Brief is Ready",
      text: "I’ve organized everything into a clean brief. Review it below, then send it to our team.",
      cards: [
        { label: "Name", value: brief.name || "Pending", detail: brief.email || "Email needed" },
        { label: "Company", value: brief.company || "Pending", detail: brief.budget || "Budget needed" },
        { label: "Requirement", value: brief.requirement || "Pending", detail: brief.projectType || "Project type inferred" }
      ],
      bullets: [
        `Feature summary: ${brief.features.length ? brief.features.join(", ") : "Not specified"}`,
        `AI suggestions: ${brief.aiSuggestions.length ? brief.aiSuggestions.join(", ") : "Not specified"}`,
        `Timeline: ${brief.timeline}`,
        `Complexity: ${brief.complexity}`
      ],
      ctas: [
        { label: "Send to Our Team", action: "send", href: "#", value: "send", target: "action", variant: "btn-primary" },
        { label: "Edit Details", action: "edit", href: "#", value: "edit", target: "action", variant: "btn-secondary" },
        { label: "Send on WhatsApp", href: "https://wa.me/919014719422?text=Hi%20Revanta%2C%20I%20have%20a%20project%20brief.", target: "url", variant: "btn-secondary" }
      ],
      followUp: "REVIX has prepared your project brief."
    };
  };
  const leadPayloadForEmail = () => {
    const brief = getLeadPreview();
    return {
      name: brief.name,
      email: brief.email,
      company: brief.company,
      industry: state.lead.industry || state.profile.industry?.name || "",
      budget: brief.budget,
      requirement: brief.requirement,
      projectType: brief.projectType,
      features: brief.features,
      aiSuggestions: brief.aiSuggestions,
      complexity: brief.complexity,
      timeline: brief.timeline,
      additionalNotes: state.lead.userMessage || "",
      message: brief.summary
    };
  };
  const sendBotLead = async () => {
    if (!window.revantaQuoteBridge?.sendLeadViaEmailJS) {
      throw new Error("Email bridge unavailable.");
    }
    const result = await window.revantaQuoteBridge.sendLeadViaEmailJS(leadPayloadForEmail());
    return result;
  };
  const leadBranch = (text) => {
    const lead = syncLeadFromText(text);
    if (!lead.name) {
      state.leadStage = "name";
      save();
      return leadPrompt("name");
    }
    if (!lead.email) {
      state.leadStage = "email";
      save();
      return leadPrompt("email");
    }
    if (!lead.company) {
      state.leadStage = "company";
      save();
      return leadPrompt("company");
    }
    if (!lead.requirement) {
      state.leadStage = "requirement";
      save();
      return leadPrompt("requirement");
    }
    if (!lead.budget) {
      state.leadStage = "budget";
      save();
      return leadPrompt("budget");
    }

    lead.timeline = lead.timeline || timeline(complexityScore(state.profile, text), state.profile.project, lead.features.length || state.profile.features.length);
    lead.complexity = lead.complexity || band(complexityScore(state.profile, text))[0];
    lead.summary = buildLeadSummary(leadPayloadForEmail());
    state.leadStage = "review";
    save();
    return leadReview();
  };
  const renderCard = (label, value, detail) => {
    const d = document.createElement("div");
    d.className = "assistant-mini-card";
    d.innerHTML = `<span class="assistant-mini-label">${label}</span><strong></strong><p></p>`;
    d.querySelector("strong").textContent = value;
    d.querySelector("p").textContent = detail || "";
    return d;
  };
  const updateInsights = (profile, level, nextStep) => {
    if (fit) fit.textContent = fitText(profile);
    if (complexity) complexity.textContent = level;
    if (next) next.textContent = nextStep;
  };
  const clearTyping = () => { if (typing?.parentNode) typing.parentNode.removeChild(typing); typing = null; };
  const showTyping = () => {
    clearTyping();
    const row = document.createElement("article");
    row.className = "assistant-message bot";
    const bubble = document.createElement("div");
    bubble.className = "assistant-response glass-card assistant-typing";
    bubble.innerHTML = '<span class="assistant-typing-dot"></span><span class="assistant-typing-dot"></span><span class="assistant-typing-dot"></span>';
    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    typing = row;
  };
  const render = (role, payload) => {
    const row = document.createElement("article");
    row.className = `assistant-message ${role}`;
    if (role === "user") {
      const bubble = document.createElement("div");
      bubble.className = "assistant-bubble";
      bubble.textContent = payload.text;
      row.appendChild(bubble);
      messages.appendChild(row);
      messages.scrollTop = messages.scrollHeight;
      return;
    }
    const bubble = document.createElement("div");
    bubble.className = "assistant-response glass-card";
    bubble.innerHTML = `<div class="assistant-response-head"><span></span><span class="assistant-response-tag"></span></div><strong class="assistant-response-title"></strong><p class="assistant-response-copy"></p>`;
    bubble.querySelector(".assistant-response-head span").textContent = payload.kicker || "Copilot analysis";
    bubble.querySelector(".assistant-response-tag").textContent = payload.tag || MODE[state.mode];
    bubble.querySelector(".assistant-response-title").textContent = payload.title || "Recommendation";
    bubble.querySelector(".assistant-response-copy").textContent = payload.text || "";
    if (payload.cards?.length) {
      const grid = document.createElement("div");
      grid.className = "assistant-card-grid";
      payload.cards.forEach((x) => grid.appendChild(renderCard(x.label, x.value, x.detail)));
      bubble.appendChild(grid);
    }
    if (payload.bullets?.length) {
      const list = document.createElement("ul");
      list.className = "assistant-response-list";
      payload.bullets.forEach((x) => { const li = document.createElement("li"); li.textContent = x; list.appendChild(li); });
      bubble.appendChild(list);
    }
    if (payload.followUp) {
      const p = document.createElement("p");
      p.className = "assistant-follow-up";
      p.textContent = payload.followUp;
      bubble.appendChild(p);
    }
    if (payload.chips?.length) {
      const row = document.createElement("div");
      row.className = "assistant-inline-chips";
      payload.chips.forEach((x) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "assistant-chip assistant-chip-soft";
        b.textContent = x.label;
        b.addEventListener("click", () => {
          if (x.action === "mode") { state.mode = x.value in MODE ? x.value : "ask"; modes.forEach((m) => m.classList.toggle("is-active", m.dataset.mode === state.mode)); save(); sendPrompt(x.prompt || x.label, true); }
          else if (x.action === "section") scrollToSection(x.value);
          else if (x.action === "url") window.open(x.value, "_blank", "noopener,noreferrer");
          else if (x.action === "edit") { state.leadStage = "name"; save(); sendPrompt("I want to edit the brief.", true); }
          else if (x.action === "send") sendBotLead()
            .then(() => {
              render("bot", {
                kicker: "REVIX",
                tag: "EmailJS",
                title: "Project brief sent successfully",
                text: "Your project brief has been delivered to our team. We’ll review it and get back to you with the next step.",
                cards: [
                  { label: "Status", value: "Sent", detail: "Delivered through the same EmailJS flow." },
                  { label: "Next", value: "Review", detail: "Our team will check the brief." },
                  { label: "Follow-up", value: "Reply-ready", detail: "You can keep using REVIX for edits." }
                ]
              });
              state.leadStage = "idle";
              save();
            })
            .catch((error) => {
              render("bot", {
                kicker: "REVIX",
                tag: "EmailJS",
                title: "Failed to send",
                text: error?.text || error?.message || "Please try again.",
                cards: [
                  { label: "Check", value: "EmailJS", detail: "Make sure the bridge and template are active." },
                  { label: "Fallback", value: "Edit brief", detail: "You can revise details and resend." }
                ]
              });
            });
          else sendPrompt(x.value, true);
        });
        row.appendChild(b);
      });
      bubble.appendChild(row);
    }
    if (payload.ctas?.length) {
      const row = document.createElement("div");
      row.className = "assistant-cta-row";
      payload.ctas.forEach((x) => {
        const a = document.createElement("a");
        a.className = `btn ${x.variant || "btn-secondary"} assistant-cta`;
        a.href = x.href || "#";
        a.textContent = x.label;
        if (x.target === "section") a.addEventListener("click", (e) => { e.preventDefault(); scrollToSection(x.value); });
        if (x.target === "url") { a.target = "_blank"; a.rel = "noopener noreferrer"; }
        row.appendChild(a);
      });
      bubble.appendChild(row);
    }
    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  };
  const open = () => {
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    launcher.setAttribute("aria-expanded", "true");
    panel.classList.toggle("is-minimized", !!state.minimized);
    if (!opened) {
      opened = true;
      render("bot", { kicker: "REVIX", tag: "AI Business Copilot", title: "Hi, I’m REVIX", text: "I can help you scope a website, web app, mobile app, AI automation, MVP, or custom software build. Tell me what you are trying to achieve and I’ll map the smartest direction.", cards: [{ label: "What I do", value: "Analyze scope", detail: "Recommend the right build path." }, { label: "How I help", value: "Estimate", detail: "Give realistic price and timeline direction." }, { label: "Best next step", value: "Quote / contact", detail: "Push toward the right CTA at the right time." }], chips: [{ label: "Estimate Cost", action: "mode", value: "estimate", prompt: "Estimate the cost for my project." }, { label: "AI for My Business", action: "mode", value: "ai-business", prompt: "Where can AI help my business?" }, { label: "Build My MVP", action: "mode", value: "mvp", prompt: "Help me plan an MVP." }] });
      updateInsights(state.profile, "Ready", "Start discovery");
    }
  };
  const close = () => { panel.classList.remove("is-open"); panel.setAttribute("aria-hidden", "true"); launcher.setAttribute("aria-expanded", "false"); };
  const toggleMinimize = () => { state.minimized = !state.minimized; panel.classList.toggle("is-minimized", state.minimized); if (minimizeBtn) minimizeBtn.textContent = state.minimized ? "Restore" : "Minimize"; save(); };
  const sendPrompt = (text, auto) => { input.value = text; if (auto) submit(text); };
  const build = (text) => {
    const t = norm(text);
    const it = intent(text);
    const industry = findIndustry(text) || state.profile.industry || null;
    const project = findProject(text) || state.profile.project || null;
    const feat = new Map(state.profile.features.map((x) => [x.key, x]));
    findFeatures(text).forEach((x) => feat.set(x.key, x));
    state.profile.features = Array.from(feat.values());
    if (industry) state.profile.industry = industry;
    if (project) state.profile.project = project;
    const sc = complexityScore(state.profile, text);
    const [lvl, tone] = band(sc);
    const p = price(sc, state.profile.project);
    const tm = timeline(sc, state.profile.project, state.profile.features.length);
    const scope = [...new Set([...state.profile.features.map((x) => x.label), ...findFeatures(text).map((x) => x.label)])];
    const ai = industry ? industry.ai : ["AI lead qualification", "AI workflow automation", "AI support assistant"];
    const projectFit = state.profile.project?.fit || "custom website / web app";
    const industryFit = industry?.fit || "a solution matched to your workflow";
    let out = { kicker: industry ? `${industry.name} business` : "Strategic response", tag: MODE[state.mode], title: "Recommendation", text: "", bullets: [], cards: [], chips: [], ctas: [], followUp: "" };
    const pricingIntent = state.mode === "estimate" || it === "pricing" || has(t, ["price", "budget", "cost", "quote", "estimate"]);
    const featureIntent = state.mode === "features" || has(t, ["feature", "features", "login", "payments", "admin", "roles"]);
    const aiIntent = state.mode === "ai-business" || it === "ai" || has(t, ["ai for my business", "where can ai help", "ai opportunities"]);
    const mvpIntent = state.mode === "mvp" || it === "mvp" || has(t, ["mvp", "startup", "idea", "launch"]);
    const proposalIntent = state.mode === "proposal" || has(t, ["proposal", "contact", "quote", "start", "build it"]);
    const leadFlowActive = state.mode === "proposal" || state.leadStage !== "idle" || has(t, ["send to our team", "project brief", "quote", "brief"]);
    if (leadFlowActive) {
      const brief = leadBranch(text);
      if (state.leadStage === "sent") {
        brief.kicker = "REVIX";
        brief.tag = "EmailJS";
        brief.title = "Project brief sent successfully";
        brief.text = "Your project brief has been delivered to our team. We’ll review it and get back to you with the next step.";
        brief.cards = [
          { label: "Status", value: "Sent", detail: "Delivered through the same EmailJS flow." },
          { label: "Next", value: "Review", detail: "Our team will check the brief." },
          { label: "Follow-up", value: "Reply-ready", detail: "You can keep using REVIX for edits." }
        ];
      }
      return brief;
    }
    if (state.mode === "ask" && !state.profile.project && !state.profile.industry) {
      out.title = "Let’s map the build direction";
      out.text = "Tell me the business you run or the product you want to build, and I’ll recommend the right stack, scope, and next step.";
      out.bullets = ["I can analyze websites, apps, AI workflows, MVPs, and software systems.", "I’ll keep the answer strategic, not generic.", "You can keep it short and I’ll infer the likely direction."];
      out.followUp = "What are you trying to build or improve?";
      out.cards = [{ label: "Role", value: "Solution architect", detail: "I’ll narrow the build direction." }, { label: "Output", value: "Scope + pricing + timeline", detail: "Enough to guide a proper quote." }, { label: "Mode", value: MODE.ask, detail: "Discovery-first conversation." }];
    } else if (pricingIntent) {
      out.title = "Pricing direction";
      out.text = `This looks like a ${lvl.toLowerCase()} build with a ${tone} scope.`;
      out.bullets = [`Estimated price range: ${p}`, `Estimated timeline: ${tm}`, `Why: ${state.profile.project?.time || "scope determines the delivery window"}`];
      out.cards = [{ label: "Complexity", value: lvl, detail: tone }, { label: "Best fit", value: projectFit, detail: industryFit }, { label: "Budget band", value: p, detail: "Realistic range, not a fixed quote." }];
      out.chips = [{ label: "Suggest features", action: "mode", value: "features", prompt: "Suggest the right features for this project." }, { label: "AI opportunities", action: "mode", value: "ai-business", prompt: "Show me AI opportunities for my business." }, { label: "Get proposal", action: "mode", value: "proposal", prompt: "Turn this into a proposal summary." }];
      out.ctas = [{ label: "Get a Quote", href: "#contact", value: "contact", target: "section", variant: "btn-primary" }, { label: "WhatsApp Us", href: "https://wa.me/919014719422?text=Hi%20Revanta%2C%20I%20want%20a%20project%20estimate.", target: "url", variant: "btn-secondary" }];
      out.followUp = "If you share the must-have features, I can tighten the range further.";
    } else if (featureIntent) {
      out.title = "Recommended build scope";
      out.text = `Based on your requirements, the smartest scope is a ${projectFit}.`;
      out.bullets = [...scope.map((x) => `Include: ${x}`), "Keep phase one focused on the highest-impact workflows.", "Add extra automation only after the core journey is validated."];
      out.cards = [{ label: "Core fit", value: projectFit, detail: state.profile.project?.time || tm }, { label: "Scope focus", value: scope.length ? scope.join(" + ") : "Discovery required", detail: "Phase one should stay narrow and high-value." }];
      out.chips = [{ label: "Estimate cost", action: "mode", value: "estimate", prompt: "Estimate the cost for this feature set." }, { label: "MVP advice", action: "mode", value: "mvp", prompt: "What should I launch first as an MVP?" }, { label: "AI for business", action: "mode", value: "ai-business", prompt: "Where can AI help my business?" }];
      out.ctas = [{ label: "Open Services", href: "#services", value: "services", target: "section", variant: "btn-secondary" }, { label: "Request Quote", href: "#contact", value: "contact", target: "section", variant: "btn-primary" }];
      out.followUp = "If you want, I can break this into phase one and phase two.";
    } else if (aiIntent) {
      out.title = "AI opportunity scan";
      out.text = industry ? `For a ${industry.name} business, the best AI opportunities are usually the ones that remove repetitive work and speed up response time.` : "AI is most valuable when it removes manual work, improves response speed, or scores leads automatically.";
      out.bullets = ai;
      out.cards = [{ label: "High-value AI use", value: ai[0] || "Lead qualification", detail: "Usually the fastest ROI area." }, { label: "Operational fit", value: industryFit, detail: "This is where AI can save time." }];
      out.chips = [{ label: "Estimate cost", action: "mode", value: "estimate", prompt: "Estimate the cost for an AI workflow." }, { label: "Build MVP", action: "mode", value: "mvp", prompt: "How should I launch this as an MVP?" }, { label: "Get proposal", action: "mode", value: "proposal", prompt: "Turn this into a proposal." }];
      out.ctas = [{ label: "Quote an AI build", href: "#contact", value: "contact", target: "section", variant: "btn-primary" }, { label: "View AI automation", href: "#service-automation", value: "service-automation", target: "section", variant: "btn-secondary" }];
      out.followUp = "If you share the industry and main workflow, I can narrow the best AI use case further.";
    } else if (mvpIntent) {
      out.title = "MVP strategy";
      out.text = "For most startup ideas, the smartest move is to launch a lean MVP that proves demand before building every feature.";
      out.bullets = ["Start with the smallest version that proves demand.", "Launch one clear user journey first instead of every possible feature.", "Add analytics and automation after the first usage signals are clear."];
      out.cards = [{ label: "Launch focus", value: projectFit, detail: "Build the smallest usable version first." }, { label: "Avoid", value: "Overbuilding", detail: "Skip non-critical features until traction appears." }];
      out.chips = [{ label: "Estimate MVP", action: "mode", value: "estimate", prompt: "Estimate the MVP cost and timeline." }, { label: "Suggest features", action: "mode", value: "features", prompt: "Which MVP features should I include?" }, { label: "Get proposal", action: "mode", value: "proposal", prompt: "Summarize this as a proposal." }];
      out.ctas = [{ label: "Discuss MVP", href: "#contact", value: "contact", target: "section", variant: "btn-primary" }, { label: "View products", href: "#products", value: "products", target: "section", variant: "btn-secondary" }];
      out.followUp = "If you want, I can narrow this into a phase-one build plan.";
    } else if (proposalIntent) {
      out.title = "Proposal direction";
      out.text = "Based on what you shared, this is the shape of a serious build plan we can turn into a clear quote and timeline.";
      out.bullets = [`Recommended build: ${projectFit}`, `Complexity level: ${lvl}`, `Budget direction: ${p}`, `Timeline direction: ${tm}`];
      out.cards = [{ label: "Best fit", value: projectFit, detail: industry ? `Optimized for ${industry.name}` : "Based on the current brief." }, { label: "Cost direction", value: p, detail: "Realistic estimate band." }, { label: "Delivery window", value: tm, detail: "Based on scope complexity." }];
      out.chips = [{ label: "Open quote form", action: "section", value: "contact" }, { label: "WhatsApp", action: "url", value: "https://wa.me/919014719422?text=Hi%20Revanta%2C%20I%20want%20to%20discuss%20a%20project." }, { label: "More services", action: "section", value: "services" }];
      out.ctas = [{ label: "Get Quote", href: "#contact", value: "contact", target: "section", variant: "btn-primary" }, { label: "Start Project", href: "#contact", value: "contact", target: "section", variant: "btn-secondary" }];
      out.followUp = "Share the rough scope in the contact form and we’ll turn this into a clean proposal direction.";
    } else {
      out.title = "Strategic recommendation";
      out.text = `${projectType ? `I’d position this as a ${projectFit}. ` : "I’d start by identifying the primary digital product you need. "}${industry ? `For a ${industry.name} business, the most valuable build is usually ${industryFit}.` : "If you share your industry, I can make the recommendation more specific."}`;
      out.bullets = [`Complexity level: ${lvl}`, `Likely price direction: ${price(score(state.profile, text), state.profile.project)}`, `Likely delivery window: ${tm}`];
      out.cards = [{ label: "Best fit", value: projectFit, detail: state.profile.project?.time || tm }, { label: "Industry fit", value: industry?.name ? industry.name.toUpperCase() : "Flexible", detail: industryFit }, { label: "Next step", value: MODE[state.mode], detail: OPENER[state.mode] }];
      out.chips = [{ label: "Estimate cost", action: "mode", value: "estimate", prompt: "Estimate the cost of this idea." }, { label: "Suggest features", action: "mode", value: "features", prompt: "What features should this include?" }, { label: "AI for business", action: "mode", value: "ai-business", prompt: "Where can AI help this business?" }];
      out.ctas = [{ label: "View Services", href: "#services", value: "services", target: "section", variant: "btn-secondary" }, { label: "Request Quote", href: "#contact", value: "contact", target: "section", variant: "btn-primary" }];
      out.followUp = "If you answer one more question, I can tighten the recommendation further.";
    }
    updateInsights(state.profile, lvl, out.followUp || "Refine scope");
    return out;
  }
  function submit(text) {
    const clean = (text || "").trim();
    if (!clean) return;
    showAssistantPanel();
    render("user", { text: clean });
    showTyping();
    setTimeout(() => {
      clearTyping();
      render("bot", build(clean));
    }, 380);
  }
  function queue(text, auto = false) {
    input.value = text;
    if (auto) submit(text);
  }
  function showAssistantPanel() {
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    launcher.setAttribute("aria-expanded", "true");
    panel.classList.toggle("is-minimized", !!state.minimized);
    if (!opened) {
      opened = true;
      render("bot", {
        kicker: "REVIX",
        tag: "AI Business Copilot",
        title: "Hi, I’m REVIX",
        text: "I’m REVIX — your AI business copilot. I can help you scope a website, web app, mobile app, AI automation, MVP, or custom software build.",
        cards: [
          { label: "What I do", value: "Analyze scope", detail: "Recommend the right build path." },
          { label: "How I help", value: "Estimate", detail: "Give realistic price and timeline direction." },
          { label: "Best next step", value: "Quote / contact", detail: "Push toward the right CTA at the right time." }
        ],
        chips: [
          { label: "Estimate Cost", action: "mode", value: "estimate", prompt: "Estimate the cost for my project." },
          { label: "AI for My Business", action: "mode", value: "ai-business", prompt: "Where can AI help my business?" },
          { label: "Build My MVP", action: "mode", value: "mvp", prompt: "Help me plan an MVP." }
        ]
      });
      updateInsights(state.profile, "Ready", "Start discovery");
    }
  }
  function hideAssistantPanel() {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    launcher.setAttribute("aria-expanded", "false");
  }
  function handleMinimize() {
    state.minimized = !state.minimized;
    panel.classList.toggle("is-minimized", state.minimized);
    if (minimizeBtn) minimizeBtn.textContent = state.minimized ? "Restore" : "Minimize";
    save();
  }
  launcher.addEventListener("click", showAssistantPanel);
  closeBtn.addEventListener("click", hideAssistantPanel);
  minimizeBtn?.addEventListener("click", handleMinimize);
  modes.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === state.mode);
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode || "ask";
      modes.forEach((m) => m.classList.toggle("is-active", m.dataset.mode === state.mode));
      save();
      sendPrompt(OPENER[state.mode], true);
    });
  });
  chips.forEach((chip) => chip.addEventListener("click", () => submit(chip.textContent || "")));
  form.addEventListener("submit", (event) => { event.preventDefault(); submit(input.value); input.value = ""; });
  if (state.minimized) { panel.classList.add("is-minimized"); if (minimizeBtn) minimizeBtn.textContent = "Restore"; }
  save();
})();
