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
const heroShell = document.querySelector(".dashboard-shell");

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

if (window.emailjs && EMAILJS_PUBLIC_KEY) {
  window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
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

if (heroShell) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let heroState = 0;
  const applyHeroState = () => {
    heroShell.dataset.heroState = String(heroState);
  };
  applyHeroState();

  if (!reducedMotion.matches) {
    window.setInterval(() => {
      heroState = (heroState + 1) % 3;
      applyHeroState();
    }, 4800);
  }
}

