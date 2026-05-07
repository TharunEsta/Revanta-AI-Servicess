export const coreServiceHighlights = [
  {
    slug: "ai-automation",
    href: "/ai-automation",
    title: "AI Automation",
    eyebrow: "Fix manual operations",
    description:
      "When leads, follow-ups, approvals, and internal work depend on people remembering every step, things get missed. We build systems that keep work moving automatically.",
    outcomes: ["Fewer missed leads", "Less manual work", "Faster execution"]
  },
  {
    slug: "crm-systems",
    href: "/crm-systems",
    title: "CRM Systems",
    eyebrow: "Take control of sales",
    description:
      "If your team is tracking customers across chats, sheets, and scattered tools, your pipeline gets messy fast. We build CRM systems that bring structure back.",
    outcomes: ["Clearer pipeline", "Better follow-up", "More sales visibility"]
  },
  {
    slug: "custom-software",
    href: "/custom-software",
    title: "Custom Software",
    eyebrow: "Replace broken workflows",
    description:
      "Generic tools often create more work than they remove. We build custom software around your actual process so your team can move faster and with less confusion.",
    outcomes: ["Cleaner operations", "Better team control", "Less process friction"]
  },
  {
    slug: "web-mobile-development",
    href: "/web-mobile-development",
    title: "Web + Mobile Development",
    eyebrow: "Turn your product into something people trust",
    description:
      "If your website or app feels weak, confusing, or outdated, it hurts trust and slows conversion. We build web and mobile products that feel clear and ready to buy from.",
    outcomes: ["Stronger first impression", "Better conversion", "More confident users"]
  },
  {
    slug: "api-integrations",
    href: "/api-integrations",
    title: "API Integrations",
    eyebrow: "Connect disconnected systems",
    description:
      "When teams copy data between tools or chase updates across platforms, mistakes and delays grow. We connect your systems so information moves cleanly.",
    outcomes: ["Fewer manual updates", "Cleaner data flow", "Better visibility"]
  }
] as const;

export const coreServicePages = {
  "ai-automation": {
    title: "AI Automation",
    path: "/ai-automation",
    metaTitle: "AI Automation for Businesses Losing Time to Manual Work",
    metaDescription:
      "Revanta AI builds automation systems that reduce missed leads, remove repetitive work, and help businesses run with more speed and control.",
    keywords: [
      "AI automation",
      "business automation systems",
      "workflow automation for service businesses",
      "lead follow-up automation"
    ],
    hero: {
      headline: "When your business runs on reminders and manual follow-up, growth starts breaking",
      subheadline:
        "We build AI automation systems that reduce missed leads, remove repetitive work, and keep operations moving without constant chasing.",
      cta: "Book Consultation"
    },
    problem: [
      "Most businesses do not have a lead problem first. They have a follow-through problem. A good inquiry comes in, no one responds fast enough, the next step is delayed, and the opportunity cools off.",
      "Inside the business, the same pattern shows up everywhere. Staff are copying updates between tools, checking status in chats, following up manually, and relying on memory to keep work moving.",
      "That creates delays, mistakes, missed revenue, and a team that stays busy without actually becoming more efficient."
    ],
    solution: [
      "We build automation systems that take the repeatable parts of your business and make them dependable. That can include lead response, task routing, internal approvals, reminders, updates, reporting, and customer follow-up.",
      "Instead of your team remembering every step, the system handles the flow. The right action happens at the right time, the right person gets notified, and work moves forward with less friction."
    ],
    flow: [
      {
        title: "Input",
        description: "A lead comes in, a form is submitted, a task is created, or a customer action triggers the next step."
      },
      {
        title: "System",
        description: "The automation routes the task, updates records, sends alerts, triggers follow-up, and keeps the workflow moving."
      },
      {
        title: "Output",
        description: "Your team responds faster, fewer steps get missed, and the business runs with more consistency."
      }
    ],
    impact: [
      "You stop losing time to repeat work that never should have been manual in the first place.",
      "Leads are handled faster, internal work becomes easier to track, and managers get clearer visibility into what is actually happening.",
      "The result is a business that feels more organized, more responsive, and easier to grow."
    ],
    outcomes: [
      "Automated lead capture and follow-up",
      "Task routing and internal workflow movement",
      "Approval flows and reminder systems",
      "Cleaner reporting and operational visibility",
      "Less admin work across day-to-day operations"
    ],
    audience: ["SaaS founders", "service businesses", "growing companies"],
    cta: {
      title: "If your team is still doing repeat work by hand, you are already paying for the delay",
      description:
        "Every missed follow-up, late response, and manual handoff costs time and revenue. Book a call and we will show you where automation can make the biggest difference first.",
      label: "Book Consultation"
    }
  },
  "crm-systems": {
    title: "CRM Systems",
    path: "/crm-systems",
    metaTitle: "CRM Systems for Teams Losing Leads and Pipeline Visibility",
    metaDescription:
      "Revanta AI builds CRM systems for businesses that need cleaner lead tracking, stronger follow-up, and better visibility across the sales process.",
    keywords: [
      "CRM systems",
      "custom CRM for businesses",
      "lead management system",
      "sales pipeline system"
    ],
    hero: {
      headline: "If your team cannot see where leads stand, sales starts slipping quietly",
      subheadline:
        "We build CRM systems that bring lead tracking, follow-up, and pipeline visibility into one place so your team can stop guessing and start moving faster.",
      cta: "Talk to Founder"
    },
    problem: [
      "A lot of businesses think they need more leads when the real issue is weaker sales control. Leads come in, but follow-up is inconsistent, ownership is unclear, and no one has a reliable view of what is moving or stuck.",
      "Teams end up using spreadsheets, message threads, and scattered notes to manage active opportunities. That means missed callbacks, duplicate work, and deals going cold because the next step was not clear.",
      "When this keeps happening, revenue becomes unpredictable and managers lose confidence in the pipeline."
    ],
    solution: [
      "We build CRM systems that organize your sales process around how your business actually works. Every lead has a place, every stage is visible, and every next step is easier to manage.",
      "The system helps your team track inquiries, assign ownership, log activity, monitor follow-up, and keep the pipeline moving without relying on scattered tools."
    ],
    flow: [
      {
        title: "Input",
        description: "A new lead comes from your website, ad campaign, referral, WhatsApp, or sales team."
      },
      {
        title: "System",
        description: "The CRM captures the lead, assigns the right person, tracks the stage, and keeps follow-up visible."
      },
      {
        title: "Output",
        description: "Your team has clearer control, fewer missed opportunities, and a pipeline you can actually trust."
      }
    ],
    impact: [
      "Sales becomes easier to manage because everyone is working from the same system instead of their own notes.",
      "Follow-up improves, lead leakage drops, and leadership gets a clearer picture of what is driving revenue and what is slowing it down.",
      "That brings more consistency to the sales process and more confidence in growth decisions."
    ],
    outcomes: [
      "Lead tracking from first inquiry to close",
      "Clear pipeline stages and follow-up visibility",
      "Sales ownership and team accountability",
      "Customer records in one organized place",
      "Reporting that helps management spot delays and opportunities"
    ],
    audience: ["SaaS founders", "service businesses", "growing companies"],
    cta: {
      title: "If leads are sitting in chats, sheets, or memory, you are already losing money",
      description:
        "A weak CRM process does not fail loudly. It fails one missed follow-up at a time. Book a call and we will help you bring structure back to the pipeline.",
      label: "Talk to Founder"
    }
  },
  "custom-software": {
    title: "Custom Software",
    path: "/custom-software",
    metaTitle: "Custom Software for Businesses Outgrowing Generic Tools",
    metaDescription:
      "Revanta AI builds custom software for businesses that need cleaner operations, better visibility, and systems that fit the way they actually work.",
    keywords: [
      "custom software",
      "business software development",
      "internal operations software",
      "custom business systems"
    ],
    hero: {
      headline: "When your team is forcing the business into bad tools, work gets slower and messier",
      subheadline:
        "We build custom software around your actual workflow so your team can stop patching broken processes and start operating with more clarity.",
      cta: "Book Consultation"
    },
    problem: [
      "Many growing businesses reach a point where their process no longer fits the tools they are using. Teams add more spreadsheets, more manual workarounds, and more back-and-forth just to keep things moving.",
      "Instead of simplifying operations, the software stack starts creating more confusion. Staff waste time updating multiple places, tracking progress manually, and trying to work around systems that were never built for them.",
      "That slows delivery, weakens accountability, and makes it harder for leadership to see what is really going on."
    ],
    solution: [
      "We build custom software that matches your real workflow. That can mean internal tools, business dashboards, approval systems, service management platforms, customer portals, or role-based operational systems.",
      "The goal is simple: give your business one cleaner way to run important work so teams stop fighting the process and start moving through it with confidence."
    ],
    flow: [
      {
        title: "Input",
        description: "Your business process, team roles, customer actions, and daily operational tasks define what the system needs to support."
      },
      {
        title: "System",
        description: "We build software around that workflow so tasks, approvals, visibility, and communication happen in one structured place."
      },
      {
        title: "Output",
        description: "The business runs with less confusion, fewer workarounds, and much better control."
      }
    ],
    impact: [
      "Your team spends less time managing the process and more time actually moving it forward.",
      "Leaders get better visibility, staff deal with fewer bottlenecks, and important work becomes easier to track and improve.",
      "The business feels less reactive and much more in control of execution."
    ],
    outcomes: [
      "Software built around your real workflow",
      "Clearer roles, approvals, and task movement",
      "Less dependence on scattered spreadsheets and chats",
      "Better reporting and operational visibility",
      "A system that supports growth without creating more chaos"
    ],
    audience: ["SaaS founders", "service businesses", "growing companies"],
    cta: {
      title: "If your process depends on workarounds, the cost is already showing up in time and lost momentum",
      description:
        "The longer your team works around bad systems, the more hidden friction builds up. Book a call and we will help you map the right software around the way your business actually runs.",
      label: "Book Consultation"
    }
  },
  "web-mobile-development": {
    title: "Web + Mobile Development",
    path: "/web-mobile-development",
    metaTitle: "Web and Mobile Development That Improves Trust and Conversion",
    metaDescription:
      "Revanta AI builds web and mobile products for businesses that need a stronger first impression, better usability, and clearer conversion paths.",
    keywords: [
      "web and mobile development",
      "website and app development",
      "custom web application development",
      "mobile app development for businesses"
    ],
    hero: {
      headline: "If your website or app feels weak, buyers assume the business is weak too",
      subheadline:
        "We build web and mobile experiences that make your offer easier to understand, easier to trust, and easier to act on.",
      cta: "Talk to Founder"
    },
    problem: [
      "A confusing website or clunky app does more damage than most businesses realize. Visitors leave without understanding the offer, trust drops quickly, and good prospects hesitate before taking the next step.",
      "Sometimes the issue is outdated design. Sometimes it is weak structure, poor mobile experience, or a product flow that makes simple actions feel harder than they should be.",
      "Either way, the result is the same: lower conversion, weaker brand perception, and lost momentum at the exact moment people are deciding whether to trust you."
    ],
    solution: [
      "We build websites, web platforms, and mobile apps that make the experience clearer from the first interaction. The messaging is easier to follow, the structure makes more sense, and the product feels more ready for real users.",
      "Whether you need a stronger sales website, a customer-facing platform, or a mobile app that supports daily use, the build is shaped around business goals and user clarity."
    ],
    flow: [
      {
        title: "Input",
        description: "Your offer, audience, user journey, and conversion goals define what the experience needs to do."
      },
      {
        title: "System",
        description: "We design and build the website or app so the experience feels clear, credible, and easy to use."
      },
      {
        title: "Output",
        description: "Visitors understand your value faster, trust the business more, and are more likely to take action."
      }
    ],
    impact: [
      "A stronger digital experience changes how people see the business. It improves trust, reduces confusion, and supports better conversion from the first visit onward.",
      "It also gives your team a cleaner foundation for sales, onboarding, support, and future growth instead of trying to scale around a weak product experience.",
      "That means better user response now and better business positioning over time."
    ],
    outcomes: [
      "Websites that explain the offer clearly and convert better",
      "Mobile and web experiences that feel easier to use",
      "Stronger first impression for buyers and customers",
      "Cleaner customer journeys from first visit to next step",
      "A more credible digital presence that supports growth"
    ],
    audience: ["SaaS founders", "service businesses", "growing companies"],
    cta: {
      title: "If your website or app is causing hesitation, it is already costing you opportunities",
      description:
        "When people feel confused or unsure, they leave. Book a call and we will help you rebuild the experience around trust, clarity, and conversion.",
      label: "Talk to Founder"
    }
  },
  "api-integrations": {
    title: "API Integrations",
    path: "/api-integrations",
    metaTitle: "API Integrations for Businesses Using Too Many Disconnected Tools",
    metaDescription:
      "Revanta AI connects business systems so data moves cleanly, teams stop copying information manually, and operations become easier to manage.",
    keywords: [
      "API integrations",
      "system integrations for businesses",
      "CRM and software integrations",
      "business data automation"
    ],
    hero: {
      headline: "When your tools do not talk to each other, your team becomes the connector",
      subheadline:
        "We build API integrations that connect your systems, reduce manual updates, and make the business easier to run.",
      cta: "Book Consultation"
    },
    problem: [
      "A lot of operational waste comes from disconnected systems. One team updates the CRM, another checks spreadsheets, someone else copies data into a dashboard, and no one fully trusts the numbers.",
      "This creates delays, duplicate work, mistakes, and constant confusion about what is current. Teams stay busy just moving information around instead of using it to make better decisions.",
      "Over time, that slows response, weakens visibility, and makes the business harder to scale."
    ],
    solution: [
      "We build integrations that connect the tools your business already relies on. That might mean syncing leads, customer records, order data, operational updates, or reporting inputs across the systems your team uses every day.",
      "Instead of staff manually moving information between tools, the systems stay aligned and the process becomes much cleaner."
    ],
    flow: [
      {
        title: "Input",
        description: "Data enters one of your business systems through sales, support, operations, forms, or customer activity."
      },
      {
        title: "System",
        description: "The integration sends that information where it needs to go and keeps connected tools in sync."
      },
      {
        title: "Output",
        description: "Teams spend less time copying data, reporting becomes more reliable, and decisions get easier."
      }
    ],
    impact: [
      "Your team gets time back because they are no longer acting as a bridge between disconnected tools.",
      "Data becomes more reliable, updates happen faster, and leadership can work from a clearer view of what is happening across the business.",
      "That improves efficiency today and gives you a stronger operating foundation as the company grows."
    ],
    outcomes: [
      "Connected systems that reduce manual updates",
      "Cleaner data flow across sales and operations",
      "Fewer mistakes caused by duplicate entry",
      "Better reporting from more reliable information",
      "A business that is easier to manage across tools"
    ],
    audience: ["SaaS founders", "service businesses", "growing companies"],
    cta: {
      title: "If your team is still copying data between tools, you are already paying for the disconnect",
      description:
        "Every manual sync creates delay, risk, and wasted effort. Book a call and we will show you how to connect the systems that matter most first.",
      label: "Book Consultation"
    }
  }
} as const;
