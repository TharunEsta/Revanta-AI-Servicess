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
    ask: "Tell me what you’re planning to build, and I’ll map the smartest direction.",
    estimate: "I’ll assess the scope, complexity, and budget direction.",
    features: "I’ll help shape the right feature set without overbuilding.",
    "ai-business": "I’ll identify where AI can save time and add leverage.",
    mvp: "I’ll help narrow the idea into a launchable MVP.",
    proposal: "I’ll summarize the project direction and next step."
  };
  const DISCOVERY_CHIPS = [
    { label: "Website", action: "reply", value: "I need a website" },
    { label: "Mobile App", action: "reply", value: "I need an app" },
    { label: "AI Automation", action: "reply", value: "I need AI automation" }
  ];
  const THINKING_LABEL = "REVIX is analyzing...";
  const BRIEF_LABEL = "REVIX is preparing your recommendation...";
  const INDUSTRIES = [
    ["real estate", ["real estate", "property", "broker", "agent"], "lead capture website, listing portal, WhatsApp follow-up, CRM dashboard", ["AI lead qualification", "property recommendation engine", "enquiry automation"]],
    ["fashion", ["fashion", "clothing", "apparel", "garment", "textile"], "catalog website, wholesale portal, order dashboard, enquiry automation", ["AI enquiry sorting", "catalog assistance", "order update automation"]],
    ["startup", ["startup", "mvp", "saas", "product", "launch"], "MVP, product prototype, onboarding, payments, analytics", ["AI product assistant", "usage insights", "support automation"]],
    ["clinic", ["clinic", "hospital", "healthcare", "doctor", "patient", "medical"], "appointment system, patient enquiry bot, reminders, admin dashboard", ["AI FAQ assistant", "appointment triage", "reminder automation"]],
    ["ecommerce", ["ecommerce", "e-commerce", "store", "shop", "checkout"], "storefront, catalog, checkout flow, order dashboard", ["AI recommendation engine", "cart recovery automation", "support bot"]],
    ["agency", ["agency", "marketing", "design", "branding", "creative", "studio"], "agency website, client portal, proposal flow, project dashboard", ["AI proposal drafting", "lead scoring", "client update automation"]]
  ].map(([name, words, fit, ai]) => ({ name, words, fit, ai }));
  const PROJECTS = [
    ["website", ["website", "landing page", "company website", "portfolio", "marketing site"], "premium website / landing page", "3 days to 2 weeks", "â‚¹25k - â‚¹50k"],
    ["web app", ["web app", "portal", "dashboard", "crm", "saas", "admin panel"], "web app / dashboard / portal", "2 to 6 weeks", "â‚¹50k - â‚¹1.5L"],
    ["mobile app", ["mobile app", "android app", "ios app", "application", "app development"], "Android / iOS app build", "4 to 10 weeks", "â‚¹1L - â‚¹3L+"],
    ["ai automation", ["ai automation", "automation", "workflow automation", "agent", "bot", "assistant"], "AI automation system", "1 to 3 weeks", "â‚¹35k - â‚¹1.5L"],
    ["fine tuning", ["fine tuning", "finetuning", "model training", "ai model", "llm"], "AI fine-tuning / custom model workflow", "3 to 8 weeks", "â‚¹1.5L - â‚¹6L+"]
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
          department: "",
          channel: "",
          tools: [],
          features: [],
          aiSuggestions: [],
          timeline: "",
          complexity: "",
          summary: "",
          why: "",
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
          department: s.lead?.department || "",
          channel: s.lead?.channel || "",
          tools: Array.isArray(s.lead?.tools) ? s.lead.tools : [],
          features: Array.isArray(s.lead?.features) ? s.lead.features : [],
          aiSuggestions: Array.isArray(s.lead?.aiSuggestions) ? s.lead.aiSuggestions : [],
          timeline: s.lead?.timeline || "",
          complexity: s.lead?.complexity || "",
          summary: s.lead?.summary || "",
          why: s.lead?.why || "",
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
          department: "",
          channel: "",
          tools: [],
          features: [],
          aiSuggestions: [],
          timeline: "",
          complexity: "",
          summary: "",
          why: "",
          userMessage: ""
        },
        leadStage: "idle"
      };
    }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }
  const norm = (v) => (v || "").toLowerCase().replace(/[^a-z0-9â‚¹+\s]/g, " ").replace(/\s+/g, " ").trim();
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
  const price = (n, p) => p?.name === "fine tuning" ? "â‚¹1.5L - â‚¹6L+" : p?.name === "mobile app" ? (n < 7 ? "â‚¹1L - â‚¹2.5L" : "â‚¹2L - â‚¹5L+") : p?.name === "ai automation" ? (n < 5 ? "â‚¹35k - â‚¹75k" : "â‚¹75k - â‚¹2L") : p?.name === "web app" ? (n < 6 ? "â‚¹50k - â‚¹1.5L" : "â‚¹1L - â‚¹3L+") : p?.name === "mvp" ? (n < 6 ? "â‚¹50k - â‚¹1.5L" : "â‚¹1L - â‚¹2.5L+") : n < 3.5 ? "â‚¹25k - â‚¹50k" : n < 6 ? "â‚¹50k - â‚¹1L" : n < 9 ? "â‚¹1L - â‚¹2.5L" : "â‚¹2.5L - â‚¹6L+";
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
    if (has(t, ["under", "50k", "â‚¹50k", "below 50k"])) return "Under â‚¹50k";
    if (has(t, ["50k", "1l", "â‚¹50k - â‚¹1L", "50000", "1 lakh"])) return "â‚¹50k - â‚¹1L";
    if (has(t, ["1l", "2l", "â‚¹1L - â‚¹2L", "100000", "2 lakh"])) return "â‚¹1L - â‚¹2L";
    if (has(t, ["2l", "5l", "â‚¹2L+", "premium"])) return "â‚¹2L+";
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
  const detectWebsiteSubtype = (text) => {
    const t = norm(text);
    if (has(t, ["saas", "web app", "dashboard", "portal", "admin"])) return "SaaS / Web App";
    if (has(t, ["ecommerce", "e-commerce", "store", "shop", "checkout", "cart"])) return "E-commerce";
    if (has(t, ["portfolio"])) return "Portfolio";
    if (has(t, ["landing", "landing page"])) return "Landing Page";
    if (has(t, ["business", "company", "corporate", "brand"])) return "Business Website";
    return "";
  };
  const detectGoal = (text) => {
    const t = norm(text);
    if (has(t, ["lead", "inquiry", "enquiry", "contact", "booking", "bookings"])) return "Lead generation / enquiries";
    if (has(t, ["sell", "sales", "checkout", "orders"])) return "Sales / conversions";
    if (has(t, ["showcase", "credibility", "brand", "portfolio"])) return "Brand presence / credibility";
    if (has(t, ["dashboard", "internal", "operations", "workflow"])) return "Dashboard / internal workflow";
    if (has(t, ["support", "faq", "ticket"])) return "Support / operations";
    if (has(t, ["subscription", "subscriptions"])) return "Revenue / subscriptions";
    return "";
  };
  const detectAppPlatform = (text) => {
    const t = norm(text);
    if (has(t, ["both", "android and ios", "ios and android"])) return "Both Platforms";
    if (has(t, ["android"])) return "Android App";
    if (has(t, ["iphone", "ios"])) return "iPhone App";
    return "";
  };
  const detectAppAudience = (text) => {
    const t = norm(text);
    if (has(t, ["internal", "staff", "team", "operations"])) return "Internal Team";
    if (has(t, ["field", "sales rep", "field team"])) return "Field Team";
    if (has(t, ["partner", "vendors"])) return "Partners";
    if (has(t, ["customer", "customers", "client", "clients"])) return "Customers";
    return "";
  };
  const detectAIType = (text) => {
    const t = norm(text);
    if (has(t, ["fine tuning", "finetuning", "model"])) return "Fine-Tuning";
    if (has(t, ["support", "help desk", "ticket", "customer service"])) return "AI Support Assistant";
    if (has(t, ["workflow", "automation", "trigger", "process"])) return "AI Automation";
    if (has(t, ["chatbot", "chat bot", "assistant"])) return "AI Chatbot";
    if (has(t, ["internal tool"])) return "Internal Tool";
    return "";
  };
  const detectAIBusiness = (text) => {
    const industry = findIndustry(text);
    if (industry) return industry.name;
    const t = norm(text);
    if (has(t, ["sales"])) return "Sales";
    if (has(t, ["support"])) return "Support";
    if (has(t, ["operations", "ops"])) return "Operations";
    if (has(t, ["lead"])) return "Lead Generation";
    if (has(t, ["ecommerce", "e-commerce", "store"])) return "E-commerce";
    return "";
  };
  const detectAIProcess = (text) => {
    const t = norm(text);
    if (has(t, ["answering questions", "faq", "questions"])) return "Answering questions";
    if (has(t, ["lead", "crm", "enquiry", "inquiry"])) return "Managing leads";
    if (has(t, ["follow up", "follow-up", "reminder"])) return "Follow-ups";
    if (has(t, ["report", "reporting", "analytics"])) return "Reporting";
    if (has(t, ["onboarding"])) return "Onboarding";
    if (has(t, ["task", "routing", "assignment"])) return "Task routing";
    return "";
  };
  const detectAIDepartment = (text) => {
    const t = norm(text);
    if (has(t, ["sales"])) return "Sales";
    if (has(t, ["support", "customer success"])) return "Support";
    if (has(t, ["operations", "ops"])) return "Operations";
    if (has(t, ["lead"])) return "Lead Generation";
    return "";
  };
  const detectAutomationManual = (text) => {
    const t = norm(text);
    if (has(t, ["lead", "follow up", "follow-up"])) return "Lead follow-ups";
    if (has(t, ["whatsapp"])) return "WhatsApp replies";
    if (has(t, ["support"])) return "Support routing";
    if (has(t, ["update", "internal"])) return "Internal updates";
    if (has(t, ["data entry", "entry"])) return "Data entry";
    if (has(t, ["report"])) return "Reporting";
    return "";
  };
  const detectAutomationChannel = (text) => {
    const t = norm(text);
    if (has(t, ["whatsapp"])) return "WhatsApp";
    if (has(t, ["email"])) return "Email";
    if (has(t, ["crm"])) return "CRM";
    if (has(t, ["google sheets", "sheets"])) return "Google Sheets";
    if (has(t, ["website form", "forms"])) return "Website forms";
    if (has(t, ["workflow", "internal"])) return "Internal workflow";
    return "";
  };
  const detectAutomationTools = (text) => {
    const t = norm(text);
    const tools = [];
    if (has(t, ["google sheets", "sheets"])) tools.push("Google Sheets");
    if (has(t, ["whatsapp"])) tools.push("WhatsApp");
    if (has(t, ["hubspot"])) tools.push("HubSpot");
    if (has(t, ["zoho"])) tools.push("Zoho");
    if (has(t, ["notion"])) tools.push("Notion");
    if (has(t, ["excel"])) tools.push("Excel");
    if (has(t, ["crm"])) tools.push("CRM");
    return Array.from(new Set(tools));
  };
  const detectBroadIntent = (text) => {
    const t = norm(text);
    if (has(t, ["website", "landing page", "portfolio", "web app", "dashboard", "portal", "ecommerce", "e-commerce", "store", "shop"])) return "website";
    if (has(t, ["app", "android", "iphone", "ios", "mobile"])) return "mobile app";
    if (has(t, ["fine tuning", "finetuning", "model"])) return "fine tuning";
    if (has(t, ["ai", "chatbot", "assistant", "llm"])) return "ai automation";
    if (has(t, ["automation", "workflow", "automate", "trigger", "zapier", "make"])) return "automation";
    return "";
  };
  const discoveryQuestion = (field) => ({
    websiteSubtype: "What type of website are you looking to build?",
    websiteGoal: "What is the main goal of the website?",
    websiteFeatures: "Do you need any of these inside it?",
    appPlatform: "Is this for Android, iPhone, or both?",
    appAudience: "Is it for customers or internal business use?",
    appFeatures: "Which capabilities matter most?",
    aiType: "What kind of AI are you looking to build?",
    aiBusiness: "What business are you in?",
    aiProcess: "What process are you trying to improve?",
    aiDepartment: "Is this mainly for sales, support, operations, or lead generation?",
    autoManual: "What are you currently doing manually?",
    autoChannel: "Where does this process live today?",
    autoTools: "What tools are you currently using?"
  }[field] || "Tell me a bit more about the project.");
  const progressText = () => {
    const step = state.leadStage;
    if (step === "intro") return "Step 1 of 5 - Understanding your project";
    if (step === "websiteSubtype" || step === "appPlatform" || step === "aiType" || step === "autoManual") return "Step 2 of 5 - Clarifying the project type";
    if (step === "websiteGoal" || step === "appAudience" || step === "aiBusiness" || step === "autoChannel") return "Step 3 of 5 - Understanding the business goal";
    if (step === "websiteFeatures" || step === "appFeatures" || step === "aiProcess" || step === "autoTools") return "Step 4 of 5 - Capturing key requirements";
    if (step === "aiDepartment") return "Step 4 of 5 - Confirming the team focus";
    if (step === "review") return "Step 5 of 5 - Reviewing the brief";
    if (step === "sent") return "Done - Brief sent";
    return "";
  };
  const buildWhyDirection = (brief) => {
    const direction = (brief.projectType || brief.requirement || "").toLowerCase();
    const features = (brief.features || []).map((item) => item.toLowerCase());
    const company = (brief.company || brief.industry || "").toLowerCase();
    if (direction.includes("website") && (features.some((item) => item.includes("admin")) || features.some((item) => item.includes("dashboard")) || features.some((item) => item.includes("login")))) {
      return "Because you need accounts, admin control, and workflow visibility, this looks more like a structured business system than a simple brochure website.";
    }
    if (direction.includes("website") && (features.some((item) => item.includes("lead")) || features.some((item) => item.includes("enquiry")) || features.some((item) => item.includes("form")))) {
      return "Because your main goal is lead capture and business visibility, a focused business website is likely the smarter first step.";
    }
    if ((direction.includes("app") || direction.includes("mobile")) && (features.some((item) => item.includes("login")) || features.some((item) => item.includes("admin")) || features.some((item) => item.includes("subscription")))) {
      return "Because this needs user access, control layers, and dashboard logic, it likely belongs in a web app or product-style build.";
    }
    if (direction.includes("ai") || features.some((item) => item.includes("ai"))) {
      return "Because the value is in automating a workflow or improving response quality, the AI layer should be designed around the process first, not as a generic add-on.";
    }
    if (direction.includes("automation") || features.some((item) => item.includes("automation"))) {
      return "Because you are replacing manual work with a guided workflow, the best result is usually a focused automation system with clear triggers and handoff rules.";
    }
    if (company.includes("startup") || company.includes("idea") || company.includes("mvp")) {
      return "Because this is still idea-stage and speed matters, an MVP approach is likely better than building the full platform immediately.";
    }
    return "Based on the scope, this direction gives you the highest chance of solving the core business problem without overbuilding the first version.";
  };
  const buildWhatsAppMessage = (brief) => {
    const lines = [
      "Hi Revanta, I want to discuss a project brief.",
      "",
      `Name: ${brief.name || "Not specified"}`,
      `Company: ${brief.company || "Not specified"}`,
      `Email: ${brief.email || "Not specified"}`,
      `Business Type: ${brief.industry || "Not specified"}`,
      `Project Direction: ${brief.projectType || brief.requirement || "Not specified"}`,
      `Main Requirements: ${brief.features?.length ? brief.features.join(", ") : "Not specified"}`,
      `Budget Direction: ${brief.budget || "Not specified"}`,
      `Timeline: ${brief.timeline || "Not specified"}`,
      `Why This Direction: ${brief.why || buildWhyDirection(brief)}`,
      `AI Opportunities: ${brief.aiSuggestions?.length ? brief.aiSuggestions.join(", ") : "Not specified"}`
    ];
    return lines.join("\n");
  };
  const buildWhatsAppUrl = (brief) => `https://wa.me/919014719422?text=${encodeURIComponent(buildWhatsAppMessage(brief))}`;
  const discoveryCards = () => {
    const currentIntent = state.profile.project?.name || "discovery";
    const cards = [
      { label: "Current read", value: currentIntent === "discovery" ? "Discovery" : currentIntent.toUpperCase(), detail: "I'm narrowing the scope." },
      { label: "Role", value: "Solution architect", detail: "Discovery-first guidance." },
      { label: "Output", value: "Scope + direction", detail: "Then budget and timeline." }
    ];
    if (state.profile.industry) {
      cards.unshift({ label: "Business", value: state.profile.industry.name, detail: "Used for context." });
    }
    return cards.slice(0, 3);
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
    "Why This Direction:",
    lead.why || "Not specified",
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
    if (project) {
      if (project.name === "website") {
        const subtype = detectWebsiteSubtype(t);
        if (subtype || !lead.projectType || lead.projectType === "Website") {
          lead.projectType = subtype || "Website";
        }
      } else if (project.name === "mobile app") {
        const platform = detectAppPlatform(t);
        if (platform || !lead.projectType || lead.projectType === "Mobile App") {
          lead.projectType = platform || "Mobile App";
        }
      } else if (project.name === "ai automation") {
        const aiType = detectAIType(t);
        if (aiType || !lead.projectType || lead.projectType === "AI Automation") {
          lead.projectType = aiType || "AI Automation";
        }
      } else if (project.name === "fine tuning") {
        lead.projectType = "Fine-Tuning";
      } else if (!lead.projectType) {
        lead.projectType = project.fit;
      }
    }
    if (!lead.requirement) {
      if (project?.name === "mobile app") {
        lead.requirement = detectAppAudience(t) || detectGoal(t);
      } else if (project?.name === "ai automation" || project?.name === "fine tuning") {
        lead.requirement = detectAIProcess(t) || detectGoal(t);
      } else if (project?.name === "automation") {
        lead.requirement = detectAutomationManual(t) || detectGoal(t);
      } else {
        lead.requirement = detectGoal(t);
      }
    }
    const budget = normalizeBudget(t);
    if (!lead.budget && has(norm(t), ["50k", "1l", "2l", "budget", "â‚¹"])) lead.budget = budget;
    const industry = findIndustry(t) || state.profile.industry;
    if (!lead.industry) {
      if (project?.name === "ai automation" || project?.name === "fine tuning") {
        lead.industry = detectAIBusiness(t) || industry?.name || "";
      } else if (industry) {
        lead.industry = industry.name;
      }
    }
    if (project?.name === "ai automation" || project?.name === "fine tuning") {
      const department = detectAIDepartment(t);
      if (department) lead.department = department;
    }
    if (project?.name === "automation") {
      const channel = detectAutomationChannel(t);
      if (channel) lead.channel = channel;
      const tools = detectAutomationTools(t);
      if (tools.length) lead.tools = Array.from(new Set([...(lead.tools || []), ...tools]));
    }
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
      why: lead.why || buildWhyDirection({
        projectType,
        requirement: lead.requirement,
        features: lead.features.length ? lead.features : featureScope(state.profile, lead.userMessage || ""),
        company: lead.company,
        industry: lead.industry || state.profile.industry?.name
      }),
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
      why: lead.why || buildWhyDirection({
        projectType,
        requirement: lead.requirement,
        features: lead.features.length ? lead.features : featureScope(state.profile, lead.userMessage || ""),
        company: lead.company,
        industry: lead.industry || state.profile.industry?.name
      }),
      summary
    };
  };
  const leadPrompt = (field) => ({
    kicker: progressText() || "Discovery",
    tag: "REVIX",
    title: "Let's scope this properly",
    text: discoveryQuestion(field),
    cards: discoveryCards(),
    followUp: "Pick the closest option and I'll narrow the next question."
  });
  const leadReview = () => {
    const brief = getLeadPreview();
    const projectDirection = brief.projectType || brief.requirement || "Custom digital build";
    const likelyNeeds = brief.features?.length ? brief.features.slice(0, 5) : [];
    const why = brief.why || buildWhyDirection(brief);
    const whatsappUrl = buildWhatsAppUrl({ ...brief, why });
    state.lead.why = why;
    state.lead.summary = buildLeadSummary({ ...brief, why });
    save();
    return {
      kicker: progressText() || "Project direction ready",
      tag: "REVIX",
      title: "Your project brief is ready",
      text: "I’ve organized the discovery into a cleaner consultant-style brief. Review the direction below before you hand anything off to the team.",
      cards: [
        { label: "Project Direction", value: projectDirection, detail: brief.industry || brief.company || "Discovery complete" },
        { label: "Likely Needs", value: likelyNeeds.length ? likelyNeeds.join(" + ") : "Discovery captured", detail: brief.aiSuggestions?.length ? brief.aiSuggestions.slice(0, 3).join(", ") : "Priority items" },
        { label: "Estimated Complexity", value: brief.complexity || "Medium", detail: brief.timeline || "Timeline estimate" },
        { label: "Indicative Budget", value: brief.budget || "Not specified", detail: "Direction, not a hard quote." }
      ],
      bullets: [
        `Why this direction: ${why}`,
        `Estimated timeline: ${brief.timeline || "Not specified"}`,
        `AI / automation opportunities: ${brief.aiSuggestions.length ? brief.aiSuggestions.slice(0, 3).join(", ") : "Not specified"}`
      ],
      why,
      chips: [
        { label: "Send brief on WhatsApp", action: "url", value: whatsappUrl },
        { label: "Edit details", action: "edit", value: "edit" },
        { label: "Open contact form", action: "section", value: "contact" }
      ],
      ctas: [
        { label: "Send This Project Brief to Our Team", action: "send", href: "#", value: "send", target: "action", variant: "btn-primary" },
        { label: "Send on WhatsApp", href: whatsappUrl, target: "url", variant: "btn-secondary" },
        { label: "Edit Details", action: "edit", href: "#", value: "edit", target: "action", variant: "btn-secondary" }
      ],
      followUp: "You can send it now, share it on WhatsApp, or refine one more detail before we lock it in."
    };
  };
  const leadPayloadForEmail = () => {
    const brief = getLeadPreview();
    const why = brief.why || buildWhyDirection(brief);
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
      why,
      additionalNotes: state.lead.userMessage || "",
      message: buildLeadSummary({ ...brief, why })
    };
  };
  const sendBotLead = async () => {
    if (!window.revantaQuoteBridge?.sendLeadViaEmailJS) {
      throw new Error("Email bridge unavailable.");
    }
    const result = await window.revantaQuoteBridge.sendLeadViaEmailJS(leadPayloadForEmail());
    return result;
  };
  const handleAssistantControl = (action) => {
    if (action === "send") {
      return sendBotLead()
        .then(() => {
          state.leadStage = "sent";
          save();
          render("bot", {
            kicker: "REVIX",
            tag: "EmailJS",
            title: "Brief sent to our team",
            text: "Your structured project brief has been delivered to our team. We’ll review the scope and get back to you with the next step.",
            cards: [
              { label: "Status", value: "Sent", detail: "Delivered through the existing EmailJS flow." },
              { label: "Next", value: "Review", detail: "Our team will check the brief." },
              { label: "Follow-up", value: "Reply-ready", detail: "You can keep refining it here." }
            ],
            followUp: "You can still use REVIX to refine the brief."
          });
          setQuickReplies([
            { label: "Refine brief", action: "reply", value: "I want to edit the brief" },
            { label: "Open contact", action: "section", value: "contact" }
          ]);
          updateInsights(state.profile, "Sent", "Reply-ready");
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
          setQuickReplies([
            { label: "Open contact", action: "section", value: "contact" },
            { label: "Try again", action: "reply", value: "send to our team" }
          ]);
          updateInsights(state.profile, "Discovery", "Try sending again");
        });
    }

    if (action === "edit") {
      const brief = getLeadPreview();
      state.leadStage = "edit";
      save();
      updateInsights(state.profile, "Discovery", "Refine the brief");
      render("bot", {
        kicker: progressText() || "REVIX",
        tag: "Refine",
        title: "What would you like to change?",
        text: "You do not need to start over. Tell me the part you want to refine and I will keep the rest of the brief intact.",
        cards: [
          { label: "Current direction", value: brief.projectType || "Pending", detail: "We can refine this first." },
          { label: "Current budget", value: brief.budget || "Pending", detail: "You can adjust the range." },
          { label: "Current timeline", value: brief.timeline || "Pending", detail: "We can tighten or expand it." }
        ],
        chips: [
          { label: "Project type", action: "reply", value: "I want to refine the project type" },
          { label: "Requirements", action: "reply", value: "I want to refine the requirements" },
          { label: "Budget", action: "reply", value: "I want to refine the budget" },
          { label: "Timeline", action: "reply", value: "I want to refine the timeline" }
        ],
        followUp: "Reply with the change you want and I’ll update the brief without clearing everything."
      });
      return Promise.resolve();
    }

    return Promise.resolve();
  };
  const leadBranch = (text) => {
    const lead = syncLeadFromText(text);
    const project = state.profile.project || findProject(text);
    const broad = detectBroadIntent(text) || project?.name || "";
    if (!broad) {
      state.leadStage = "intro";
      save();
      return {
        kicker: "Discovery",
        tag: "REVIX",
        title: "Let’s map the build",
        text: "Before I estimate anything, I need to understand what kind of build you’re planning. Tell me the project type, and I’ll start with the right question.",
        cards: discoveryCards(),
        chips: DISCOVERY_CHIPS
      };
    }
    if (broad === "website") {
      if (!lead.projectType || lead.projectType === "Website") {
        state.leadStage = "websiteSubtype";
        save();
        return leadPrompt("websiteSubtype");
      }
      if (!lead.requirement) {
        state.leadStage = "websiteGoal";
        save();
        return leadPrompt("websiteGoal");
      }
      if (!(lead.features || []).length) {
        state.leadStage = "websiteFeatures";
        save();
        return leadPrompt("websiteFeatures");
      }
    }
    if (broad === "mobile app") {
      if (!lead.projectType || lead.projectType === "Mobile App") {
        state.leadStage = "appPlatform";
        save();
        return leadPrompt("appPlatform");
      }
      if (!lead.requirement) {
        state.leadStage = "appAudience";
        save();
        return leadPrompt("appAudience");
      }
      if (!(lead.features || []).length) {
        state.leadStage = "appFeatures";
        save();
        return leadPrompt("appFeatures");
      }
    }
    if (broad === "ai automation" || broad === "fine tuning") {
      if (!lead.projectType || lead.projectType === "AI Automation" || lead.projectType === "Fine-Tuning") {
        state.leadStage = "aiType";
        save();
        return leadPrompt("aiType");
      }
      if (!lead.industry) {
        state.leadStage = "aiBusiness";
        save();
        return leadPrompt("aiBusiness");
      }
      if (!lead.requirement) {
        state.leadStage = "aiProcess";
        save();
        return leadPrompt("aiProcess");
      }
      if (!lead.department) {
        state.leadStage = "aiDepartment";
        save();
        return leadPrompt("aiDepartment");
      }
    }
    if (broad === "automation") {
      if (!lead.requirement) {
        state.leadStage = "autoManual";
        save();
        return leadPrompt("autoManual");
      }
      if (!lead.channel) {
        state.leadStage = "autoChannel";
        save();
        return leadPrompt("autoChannel");
      }
      if (!(lead.tools || []).length) {
        state.leadStage = "autoTools";
        save();
        return leadPrompt("autoTools");
      }
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
  const showTyping = (label) => {
    clearTyping();
    const row = document.createElement("article");
    row.className = "assistant-message bot";
    const bubble = document.createElement("div");
    bubble.className = "assistant-response glass-card assistant-typing";
    bubble.innerHTML = `<span class="assistant-typing-label">${label || "REVIX is analyzing your requirements..."}</span><div class="assistant-typing-dots"><span class="assistant-typing-dot"></span><span class="assistant-typing-dot"></span><span class="assistant-typing-dot"></span></div>`;
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
    if (payload.why) {
      const why = document.createElement("div");
      why.className = "assistant-why";
      const whyLabel = document.createElement("span");
      whyLabel.className = "assistant-why-label";
      whyLabel.textContent = "Why this direction";
      const whyText = document.createElement("p");
      whyText.textContent = payload.why;
      why.append(whyLabel, whyText);
      bubble.appendChild(why);
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
          if (x.action === "mode") {
            state.mode = x.value in MODE ? x.value : "ask";
            modes.forEach((m) => m.classList.toggle("is-active", m.dataset.mode === state.mode));
            save();
            sendPrompt(x.prompt || x.label, true);
          } else if (x.action === "section") {
            scrollToSection(x.value);
          } else if (x.action === "url") {
            window.open(x.value, "_blank", "noopener,noreferrer");
          } else if (x.action === "edit") {
            handleAssistantControl("edit");
          } else if (x.action === "send") {
            handleAssistantControl("send");
          } else {
            sendPrompt(x.value, true);
          }
        });
        row.appendChild(b);
      });
      bubble.appendChild(row);
    }
    if (payload.ctas?.length) {
      const row = document.createElement("div");
      row.className = "assistant-cta-row";
      payload.ctas.forEach((x) => {
        if (x.kind === "button" || x.target === "action" || x.action === "send" || x.action === "edit") {
          const button = document.createElement("button");
          button.type = "button";
          button.className = `btn ${x.variant || "btn-secondary"} assistant-cta`;
          button.textContent = x.label;
          button.addEventListener("click", () => {
            if (x.action === "send") handleAssistantControl("send");
            else if (x.action === "edit") handleAssistantControl("edit");
          });
          row.appendChild(button);
          return;
        }

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
  const sendPrompt = (text, auto) => { input.value = text; if (auto) submit(text); };
  const build = (text) => {
    const t = norm(text);
    const industry = findIndustry(text) || state.profile.industry || null;
    const project = findProject(text) || state.profile.project || null;
    const feat = new Map(state.profile.features.map((x) => [x.key, x]));
    findFeatures(text).forEach((x) => feat.set(x.key, x));
    state.profile.features = Array.from(feat.values());
    if (industry) state.profile.industry = industry;
    if (project) state.profile.project = project;

    const broadIntent = detectBroadIntent(text);
    const serviceQuery = has(t, ["service", "services", "what do you do", "what can you do"]);
    const leadFlowActive = !!(broadIntent || project || state.mode !== "ask" || state.leadStage !== "idle");

    if (leadFlowActive) {
      const brief = leadBranch(text);
      updateInsights(
        state.profile,
        state.leadStage === "review" ? band(complexityScore(state.profile, text))[0] : "Discovery",
        state.leadStage === "review" ? "Send to team" : "Continue discovery"
      );
      if (state.leadStage === "sent") {
        return {
          kicker: "REVIX",
          tag: "EmailJS",
          title: "Project brief sent successfully",
          text: "Your project brief has been delivered to our team. We’ll review it and get back to you with the next step.",
          cards: [
            { label: "Status", value: "Sent", detail: "Delivered through the existing EmailJS flow." },
            { label: "Next", value: "Review", detail: "Our team will check the brief." },
            { label: "Follow-up", value: "Reply-ready", detail: "You can keep refining it here." }
          ],
          followUp: "You can still use REVIX to refine the brief."
        };
      }
      return brief;
    }

    if (serviceQuery && !broadIntent && !project && !industry) {
        return {
          kicker: "Overview",
          tag: "REVIX",
          title: "Here’s how I can help",
          text: "I can scope websites, mobile apps, AI systems, automations, and MVPs. The goal is to understand the project properly first, then give you a useful recommendation instead of a rushed quote.",
          cards: [
            { label: "Focus", value: "Discovery-first", detail: "Better recommendations." },
            { label: "Tone", value: "Strategic", detail: "Business-aware and concise." },
            { label: "Outcome", value: "Direction + range", detail: "Not a cheap instant quote." }
          ],
          chips: DISCOVERY_CHIPS
        };
      }

      return {
        kicker: "Discovery",
        tag: "REVIX",
        title: "Let’s narrow it down",
        text: "I can help with websites, apps, AI systems, automation, and MVP planning. Tell me what you want to build, and I’ll ask the right discovery question instead of jumping to pricing too early.",
        cards: [
          { label: "What I do", value: "Scope first", detail: "Then estimate direction." },
          { label: "What to share", value: "Goal + features", detail: "One line is enough." },
          { label: "Best next step", value: "Discovery", detail: "I will guide the rest." }
        ],
        chips: DISCOVERY_CHIPS
      };
    };
  function submit(text) {
    const clean = (text || "").trim();
    if (!clean) return;
    const lower = norm(clean);
    if (has(lower, ["send to our team", "send brief", "send it", "send this"])) {
      showAssistantPanel();
      render("user", { text: clean });
      handleAssistantControl("send");
      return;
    }
    if (has(lower, ["edit details", "change details", "refine brief", "edit the brief"])) {
      showAssistantPanel();
      render("user", { text: clean });
      handleAssistantControl("edit");
      return;
    }
    if (has(lower, ["open contact", "quote form", "contact section"])) {
      showAssistantPanel();
      render("user", { text: clean });
      scrollToSection("contact");
      return;
    }
    showAssistantPanel();
    render("user", { text: clean });
    const reply = build(clean);
    showTyping(reply.why ? BRIEF_LABEL : THINKING_LABEL);
    const delay = reply.why ? 760 : reply.cards?.length ? 520 : 380;
    setTimeout(() => {
      clearTyping();
      render("bot", reply);
    }, delay);
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
        tag: "AI Business Assistant",
        title: "Hi, I’m REVIX",
        text: "Tell me what you’re planning to build, and I’ll map the smartest direction before we talk pricing.",
        cards: [
          { label: "Role", value: "Business consultant", detail: "Discovery first." }
        ],
        chips: DISCOVERY_CHIPS
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














