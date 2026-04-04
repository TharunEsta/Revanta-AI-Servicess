const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const revealItems = document.querySelectorAll(".reveal");
const quoteForm = document.querySelector("#quote-form");
const formStatus = document.querySelector(".form-status");
const serviceNavItems = document.querySelectorAll(".service-nav-item");
const faqSearch = document.querySelector("#faq-search");
const faqItems = document.querySelectorAll(".faq-item");
const featureChips = document.querySelectorAll(".feature-chip");
const estimateTier = document.querySelector("#estimate-tier");
const estimateRange = document.querySelector("#estimate-range");
const estimateTimeline = document.querySelector("#estimate-timeline");
const estimateSummary = document.querySelector("#estimate-summary");
const assistantLauncher = document.querySelector("#assistant-launcher");
const assistantPanel = document.querySelector("#assistant-panel");
const assistantClose = document.querySelector("#assistant-close");
const assistantMessages = document.querySelector("#assistant-messages");
const assistantForm = document.querySelector("#assistant-form");
const assistantInput = document.querySelector("#assistant-input");
const assistantSuggestions = document.querySelectorAll(".assistant-chip");

const featureLabels = {
  website: "Website",
  dashboard: "Dashboard",
  auth: "Login / Auth",
  ai: "AI Integration",
  automation: "Automation",
  payments: "Payments",
  crm: "CRM",
  mobile: "Mobile App"
};

const featureWeights = {
  website: 1,
  dashboard: 2,
  auth: 1,
  ai: 2,
  automation: 2,
  payments: 2,
  crm: 2,
  mobile: 3
};

const EMAILJS_PUBLIC_KEY = "jAlfgHRCxsV2_Mlrb";
const EMAILJS_SERVICE_ID = "service_adwk38d";
const EMAILJS_TEMPLATE_ID = "template_mvlzwoj";

function buildQuoteMessage(details) {
  const lines = [
    "Project Summary:",
    "",
    `Business / Industry:`,
    details.industry || details.company || "Not specified",
    "",
    `Project Type:`,
    details.projectType || details.requirement || "Not specified",
    "",
    "Main Requirements:"
  ];

  const requirements = Array.isArray(details.features) && details.features.length
    ? details.features
    : [details.requirement || "Not specified"];
  requirements.forEach((item) => lines.push(`- ${item}`));

  lines.push(
    "",
    "AI / Automation Opportunities:"
  );
  const aiItems = Array.isArray(details.aiSuggestions) && details.aiSuggestions.length
    ? details.aiSuggestions
    : ["Not specified"];
  aiItems.forEach((item) => lines.push(`- ${item}`));

  lines.push(
    "",
    `Estimated Complexity:`,
    details.complexity || "Not specified",
    "",
    `Estimated Budget Direction:`,
    details.budget || "Not specified",
    "",
    `Estimated Timeline:`,
    details.timeline || "Not specified",
    "",
    "Additional Notes:",
    details.additionalNotes || details.message || "Not specified"
  );

  return lines.join("\n");
}

async function sendLeadViaEmailJS(details) {
  if (!window.emailjs) {
    throw new Error("EmailJS is not available.");
  }

  const payload = {
    name: details.name || "",
    email: details.email || "",
    company: details.company || "",
    budget: details.budget || "",
    requirement: details.requirement || "",
    message: buildQuoteMessage(details)
  };

  return window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payload);
}

window.revantaQuoteBridge = {
  serviceId: EMAILJS_SERVICE_ID,
  templateId: EMAILJS_TEMPLATE_ID,
  publicKey: EMAILJS_PUBLIC_KEY,
  buildQuoteMessage,
  sendLeadViaEmailJS
};

const assistantResponses = [
  {
    match: ["service", "services", "build"],
    reply:
      "Revanta builds custom websites, software solutions, AI automation systems, and full-stack apps. If you want, I can also point you to the exact service section."
  },
  {
    match: ["website", "websites", "web app", "web apps"],
    reply:
      "We create premium websites and web apps designed for clarity, speed, and conversions. The usual timeline is 2 to 4 weeks depending on scope.",
    action: { label: "View website builds", target: "service-web" }
  },
  {
    match: ["mobile", "android", "ios", "app"],
    reply:
      "Yes, Revanta can build mobile apps for Android and iOS, including product apps, business apps, and connected admin systems. For a full app build, timelines usually start around 4 to 10 weeks.",
    action: { label: "View full stack apps", target: "service-products" }
  },
  {
    match: ["ai automation", "automation", "ai"],
    reply:
      "AI automation is one of our core offers. We map the workflow, add AI logic where it matters, and ship a cleaner system that reduces manual work. Typical delivery is 1 to 3 weeks.",
    action: { label: "See AI automation", target: "service-automation" }
  },
  {
    match: ["fine tuning", "finetuning", "fine-tuning", "model"],
    reply:
      "We can support AI model fine-tuning and custom AI workflows when the use case needs a more tailored response style or domain behavior. Share the dataset and goal in the quote form for the best next step."
  },
  {
    match: ["price", "pricing", "budget", "cost", "quote"],
    reply:
      "Pricing depends on scope and features. For startup-friendly projects, the range usually starts under ₹50k and can move up based on complexity. You can also use the quote form at the bottom of the page.",
    action: { label: "Open quote form", target: "contact" }
  },
  {
    match: ["timeline", "time", "how fast", "delivery"],
    reply:
      "Smaller website projects can move in 2 to 4 weeks. Software and product builds usually take longer depending on features, integrations, and testing."
  },
  {
    match: ["contact", "reach", "call", "email"],
    reply:
      "You can use the quote form on the Contact section, or reach the team at +91 9014719422. The footer also links to our LinkedIn, Instagram, and X profiles.",
    action: { label: "Open contact section", target: "contact" }
  }
];

const assistantDefaults = [
  "I’m REVIX. Ask me about services, pricing, timelines, mobile apps, AI automation, or quoting a project.",
  "I can help you understand what Revanta builds and guide you to the right section on the page."
];

let assistantOpenedOnce = false;
let assistantMessageCount = 0;

if (window.emailjs && EMAILJS_PUBLIC_KEY) {
  window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

function scrollToSection(id) {
  const target = id ? document.getElementById(id) : null;
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function addAssistantMessage(role, text, action) {
  if (!assistantMessages) return;

  assistantMessageCount += 1;
  const row = document.createElement("div");
  row.className = `assistant-message ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "assistant-bubble";
  bubble.textContent = text;
  row.appendChild(bubble);

  if (action) {
    const actionButton = document.createElement("button");
    actionButton.type = "button";
    actionButton.className = "assistant-action";
    actionButton.textContent = action.label;
    actionButton.addEventListener("click", () => {
      scrollToSection(action.target);
      openAssistant();
    });
    row.appendChild(actionButton);
  }

  assistantMessages.appendChild(row);
  assistantMessages.scrollTop = assistantMessages.scrollHeight;
}

function openAssistant() {
  if (!assistantPanel || !assistantLauncher) return;
  assistantPanel.classList.add("is-open");
  assistantPanel.setAttribute("aria-hidden", "false");
  assistantLauncher.setAttribute("aria-expanded", "true");

  if (!assistantOpenedOnce) {
    assistantOpenedOnce = true;
    assistantDefaults.forEach((text, index) => {
      window.setTimeout(() => addAssistantMessage("bot", text), index * 120);
    });
  }
}

function closeAssistant() {
  if (!assistantPanel || !assistantLauncher) return;
  assistantPanel.classList.remove("is-open");
  assistantPanel.setAttribute("aria-hidden", "true");
  assistantLauncher.setAttribute("aria-expanded", "false");
}

function normalizeText(value) {
  return value.toLowerCase().trim();
}

function getAssistantResponse(message) {
  const normalized = normalizeText(message);
  const matched = assistantResponses.find((item) => item.match.some((word) => normalized.includes(word)));

  if (matched) {
    return matched;
  }

  return {
    reply:
      "I can help with websites, web apps, mobile apps, AI automation, pricing, timelines, and quote requests. Try asking what Revanta builds, how fast delivery is, or how to request a quote."
  };
}

if (assistantLauncher) {
  assistantLauncher.addEventListener("click", openAssistant);
}

if (assistantClose) {
  assistantClose.addEventListener("click", closeAssistant);
}

assistantSuggestions.forEach((chip) => {
  chip.addEventListener("click", () => {
    openAssistant();
    const prompt = chip.textContent || "";
    addAssistantMessage("user", prompt);
    const response = getAssistantResponse(prompt);
    window.setTimeout(() => addAssistantMessage("bot", response.reply, response.action), 280);
  });
});

if (assistantForm && assistantInput) {
  assistantForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = assistantInput.value.trim();

    if (!value) return;

    openAssistant();
    addAssistantMessage("user", value);
    assistantInput.value = "";

    const response = getAssistantResponse(value);
    window.setTimeout(() => addAssistantMessage("bot", response.reply, response.action), 320);
  });
}

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
}

if (quoteForm) {
  quoteForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!window.emailjs || !EMAILJS_PUBLIC_KEY) {
      if (formStatus) {
        formStatus.textContent = "Add your EmailJS public key in script.js to enable sending.";
      }
      return;
    }

    const submitButton = quoteForm.querySelector("button[type='submit']");
    const originalText = submitButton ? submitButton.textContent : "Request a Quote";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    try {
      const result = await window.emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, quoteForm);
      if (result.status === 200 || result.text === "OK") {
        if (formStatus) {
          formStatus.textContent = "Quote request sent successfully. We’ll get back to you soon.";
        }
        quoteForm.reset();
      } else if (formStatus) {
        formStatus.textContent = "Sent, but the response was unexpected. Please check your inbox settings.";
      }
    } catch (error) {
      if (formStatus) {
        const message =
          error?.text || error?.message || `Something went wrong sending the request${error?.status ? ` (${error.status})` : ""}.`;
        formStatus.textContent = message;
      }
      console.error(error);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  });
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

serviceNavItems.forEach((item) => {
  item.addEventListener("click", () => {
    const targetId = item.dataset.target;
    const target = targetId ? document.getElementById(targetId) : null;

    serviceNavItems.forEach((other) => other.classList.remove("is-active"));
    item.classList.add("is-active");

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

faqItems.forEach((item, index) => {
  const button = item.querySelector(".faq-question");
  const answer = item.querySelector(".faq-answer");

  if (index === 0) {
    item.classList.add("is-open");
    if (button) button.setAttribute("aria-expanded", "true");
    if (answer) answer.style.maxHeight = `${answer.scrollHeight}px`;
  }

  if (button) {
    button.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      faqItems.forEach((other) => {
        const otherButton = other.querySelector(".faq-question");
        const otherAnswer = other.querySelector(".faq-answer");
        other.classList.remove("is-open");
        if (otherButton) otherButton.setAttribute("aria-expanded", "false");
        if (otherAnswer) otherAnswer.style.maxHeight = "0px";
      });

      if (!isOpen) {
        item.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
        if (answer) answer.style.maxHeight = `${answer.scrollHeight}px`;
      }
    });
  }
});

if (faqSearch) {
  faqSearch.addEventListener("input", () => {
    const query = faqSearch.value.trim().toLowerCase();

    faqItems.forEach((item) => {
      const question = item.querySelector(".faq-question");
      const answer = item.querySelector(".faq-answer");
      const text = `${question ? question.textContent : ""} ${answer ? answer.textContent : ""}`.toLowerCase();
      const match = text.includes(query);

      item.style.display = match ? "" : "none";

      if (!match) {
        item.classList.remove("is-open");
        const button = item.querySelector(".faq-question");
        if (button) button.setAttribute("aria-expanded", "false");
        if (answer) answer.style.maxHeight = "0px";
      }
    });
  });
}

function updateEstimate() {
  const activeFeatures = Array.from(featureChips)
    .filter((chip) => chip.classList.contains("is-active"))
    .map((chip) => chip.dataset.feature);

  const score = activeFeatures.reduce((sum, feature) => sum + (featureWeights[feature] || 0), 0);

  let tier = "Starter";
  let range = "₹25k - ₹50k";
  let timeline = "2 - 4 weeks";

  if (score >= 3 && score <= 4) {
    tier = "Professional";
    range = "₹50k - ₹1L";
    timeline = "3 - 6 weeks";
  } else if (score >= 5 && score <= 7) {
    tier = "Professional+";
    range = "₹1L - ₹2L";
    timeline = "4 - 8 weeks";
  } else if (score >= 8) {
    tier = "Premium";
    range = "₹2L+";
    timeline = "6 - 12 weeks";
  }

  if (estimateTier) estimateTier.textContent = tier;
  if (estimateRange) estimateRange.textContent = range;
  if (estimateTimeline) estimateTimeline.textContent = timeline;
  if (estimateSummary) {
    estimateSummary.textContent = activeFeatures.map((feature) => featureLabels[feature]).join(", ") || "Website";
  }
}

featureChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chip.classList.toggle("is-active");
    if (!Array.from(featureChips).some((item) => item.classList.contains("is-active"))) {
      chip.classList.add("is-active");
    }
    updateEstimate();
  });
});

updateEstimate();
