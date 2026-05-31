export type PlatformModule = {
  name: string;
  summary: string;
  architecture: string;
  database: string;
  api: string;
  frontend: string;
  automation: string;
  security: string;
  deployment: string;
};

export type WorkflowBlueprint = {
  title: string;
  steps: string[];
  outcome: string;
};

export type IndustryTemplate = {
  name: string;
  workflows: string[];
  dashboards: string[];
  automations: string[];
  kpis: string[];
  crmCustomizations: string[];
};

export const platformPrinciples = [
  "Modular monolith first, so the product stays maintainable before scale adds more services.",
  "Multi-tenant org isolation on every business table and every server decision.",
  "Async side effects for WhatsApp, AI, webhooks, notifications, and scheduled follow-ups.",
  "Operational UX first: dense, fast, task-oriented screens instead of marketing-style dashboards.",
  "Provider abstraction for AI and communications so the product can swap vendors without rewrites."
] as const;

export const platformModules: PlatformModule[] = [
  {
    name: "Executive Dashboard",
    summary: "The command layer for leadership to see what needs action now.",
    architecture: "Reads from tenant-scoped rollups and queue states instead of raw event noise.",
    database: "Uses denormalized summaries for leads, deals, tasks, messages, invoices, and alerts.",
    api: "Serves summary, queue, risk, and drilldown endpoints for live operational views.",
    frontend: "Dense widgets, overdue queues, next-step cards, and fast drill-in panels.",
    automation: "Feeds escalation checks, follow-up reminders, and priority routing.",
    security: "Tenant-scoped and role-filtered with auditability on every decision.",
    deployment: "Background refresh jobs keep the dashboard fast without blocking the app."
  },
  {
    name: "Smart CRM",
    summary: "The system of record for leads, contacts, companies, deals, and activities.",
    architecture: "Centralized CRM workflow with inline edits and event-based activity tracking.",
    database: "Lead, contact, company, deal, task, timeline, and assignment tables with tenant ownership.",
    api: "CRUD plus stage updates, assignment, merge, archive, and timeline endpoints.",
    frontend: "Table-first execution workspace with inline edits, filters, and quick actions.",
    automation: "Triggers lead scoring, routing, follow-up creation, and task generation.",
    security: "Server-side RBAC and field-level control for sensitive customer data.",
    deployment: "Optimistic UI with server reconciliation to keep the workspace responsive."
  },
  {
    name: "WhatsApp Command Center",
    summary: "The inbox and automation hub for message-driven sales and support.",
    architecture: "Webhook-first message ingestion with thread state and human takeover controls.",
    database: "Conversation, message, template, webhook event, and thread ownership tables.",
    api: "Webhook ingest, send reply, template send, assign, mark read, and takeover endpoints.",
    frontend: "Inbox on the left, thread center, customer context on the right.",
    automation: "Routes messages, sends replies, and escalates to humans when confidence is low.",
    security: "Webhook signature validation, idempotency, and org-level phone isolation.",
    deployment: "Queue-backed sends and retries keep messaging reliable under load."
  },
  {
    name: "AI Brain",
    summary: "The provider router and policy layer for internal AI actions.",
    architecture: "Model abstraction on top of OpenAI, OpenRouter, Claude, and Gemini.",
    database: "Stores agents, prompts, tool calls, inference logs, and retrieval references.",
    api: "Chat, qualify, summarize, retrieve, and decision-support endpoints.",
    frontend: "Exposed through operational actions instead of a chat-only interface.",
    automation: "Generates replies, summaries, recommendations, and qualification signals.",
    security: "Tool permissions and prompt versioning keep the AI controlled and auditable.",
    deployment: "Fallback routing and usage tracking protect the system from provider issues."
  },
  {
    name: "N8N Workflow Center",
    summary: "The orchestration layer for business triggers and scheduled actions.",
    architecture: "Registry of workflows, triggers, rules, runs, and retry state.",
    database: "Tracks workflow definitions, executions, errors, secrets, and rule ownership.",
    api: "Create, update, inspect, retry, and disable workflow endpoints.",
    frontend: "Workflow list, run history, failure queue, and credential visibility.",
    automation: "Lead creation, message received, no reply, payment overdue, and booking flows.",
    security: "Scoped secrets, approval rules, and audit logging for sensitive operations.",
    deployment: "N8N is isolated internally and accessed through signed application requests."
  },
  {
    name: "Customer 360",
    summary: "One operational view that merges sales, support, billing, and delivery context.",
    architecture: "Composes data from CRM, conversations, payments, projects, and documents.",
    database: "Customer profile, summary snapshots, health indicators, and relationship links.",
    api: "Profile, timeline, related objects, health, and action endpoints.",
    frontend: "Single-page account view with timeline, status, and next-step context.",
    automation: "Raises renewal reminders, escalation flags, and follow-up tasks.",
    security: "Tenant isolation with visibility controls for sensitive account data.",
    deployment: "Precomputed snapshots keep profile pages fast and operationally useful."
  },
  {
    name: "Knowledge Base",
    summary: "The source for help content, internal answers, and retrieval-backed AI responses.",
    architecture: "Documents are versioned, chunked, indexed, and published by state.",
    database: "Document, version, chunk, category, and embedding records.",
    api: "Ingest, search, publish, deprecate, and retrieval APIs.",
    frontend: "Editor, category tree, article state, and search surface.",
    automation: "Detects stale content and surfaces relevant articles to AI and support.",
    security: "Draft and published access controls with source traceability.",
    deployment: "Background indexing jobs keep retrieval current without blocking edits."
  },
  {
    name: "Analytics",
    summary: "Operational reporting that helps teams decide and act, not just stare at charts.",
    architecture: "Event capture plus rollups for funnel, channel, team, and time dimensions.",
    database: "Event tables, rollup tables, and org-scoped materialized metrics.",
    api: "Metrics endpoints for pipeline, response time, workload, and revenue views.",
    frontend: "Compact charts with filters and drill-down into operational records.",
    automation: "Anomaly detection can generate alerts and escalation tasks.",
    security: "PII masking and tenant-scoped metrics access protect sensitive data.",
    deployment: "Incremental rollups keep metrics responsive and cheap to query."
  },
  {
    name: "Project Management",
    summary: "A delivery workspace tied to customers, work, and accountability.",
    architecture: "Projects, milestones, tasks, comments, and attachments linked to customer records.",
    database: "Project, milestone, task, checklist, comment, and attachment tables.",
    api: "Project CRUD, task board updates, assignee changes, and progress endpoints.",
    frontend: "List and board views with quick detail drawers for execution.",
    automation: "Creates work from wins, support issues, and onboarding events.",
    security: "Project-level access rules and org membership enforcement.",
    deployment: "Real-time updates can degrade gracefully to polling when needed."
  },
  {
    name: "Team Management",
    summary: "Simple, internal operator control for owners, managers, and execution teams.",
    architecture: "Users, teams, roles, permissions, queues, and ownership assignments.",
    database: "Membership, invite, queue, role, and assignment records.",
    api: "Invite, deactivate, role change, team mapping, and assignment endpoints.",
    frontend: "Admin surfaces for teams, operators, and workload visibility.",
    automation: "Load balancing and assignment routing keep execution moving.",
    security: "RBAC enforced server-side with audit logging.",
    deployment: "Admin-only routes and org-specific settings keep the area contained."
  },
  {
    name: "Billing System",
    summary: "Stripe-backed subscriptions, invoices, payments, and usage tracking.",
    architecture: "Subscription and billing state are stored separately from product content.",
    database: "Plans, subscriptions, invoices, payments, and usage ledger records.",
    api: "Checkout, portal, invoice, usage, and webhook endpoints.",
    frontend: "Subscription status, invoice history, and plan management screens.",
    automation: "Payment failure, renewal, and delinquency workflows protect revenue.",
    security: "Signed webhooks and no client-side trust for billing state.",
    deployment: "Webhook retries and idempotency keep billing state accurate."
  },
  {
    name: "Multi-Tenant Layer",
    summary: "The isolation and governance layer that keeps the SaaS safe at scale.",
    architecture: "Every request resolves organization context before reading or writing data.",
    database: "Organization, membership, invite, tenant setting, and audit log tables.",
    api: "Tenant-aware middleware and org-scoped resource APIs.",
    frontend: "Org switcher, branding, permissions, and settings experiences.",
    automation: "Onboarding, routing, and default settings can be tenant-specific.",
    security: "Strict row ownership, permissions, secrets isolation, and audit trails.",
    deployment: "Single codebase, horizontal scaling, and cache keyed by tenant."
  }
];

export const workflowBlueprints: WorkflowBlueprint[] = [
  {
    title: "Lead Created",
    steps: [
      "AI qualification",
      "Lead scoring",
      "CRM entry",
      "WhatsApp follow-up",
      "Appointment booking",
      "Sales notification"
    ],
    outcome: "Every new lead gets routed, scored, and followed up without manual handoff gaps."
  },
  {
    title: "Customer Message",
    steps: [
      "WhatsApp webhook",
      "AI Brain",
      "Knowledge Base search",
      "Response generation",
      "WhatsApp reply"
    ],
    outcome: "Messages are answered from the right context and escalated to humans when needed."
  },
  {
    title: "No Reply Cadence",
    steps: ["2 hours", "24 hours", "3 days"],
    outcome: "Follow-ups stay consistent without requiring the team to remember every pending conversation."
  }
];

export const industryTemplates: IndustryTemplate[] = [
  {
    name: "Fitness",
    workflows: ["Trial inquiry", "Membership renewal", "Class booking"],
    dashboards: ["Leads by source", "Active members", "No-show risk"],
    automations: ["Trial follow-up", "Renewal reminders", "Class confirmations"],
    kpis: ["Trials booked", "Renewal rate", "Attendance rate"],
    crmCustomizations: ["Membership stage", "Trainer assignment", "Class history"]
  },
  {
    name: "Wellness",
    workflows: ["Consultation request", "Treatment plan", "Follow-up care"],
    dashboards: ["Consultations", "Treatment pipeline", "Rebookings"],
    automations: ["Consult booking", "Post-visit follow-up", "Retention reminders"],
    kpis: ["Consults", "Repeat visits", "Response time"],
    crmCustomizations: ["Therapist assignment", "Plan notes", "Session cadence"]
  },
  {
    name: "Salon",
    workflows: ["Appointment booking", "Service upsell", "Loyalty follow-up"],
    dashboards: ["Open slots", "Booked services", "Returning clients"],
    automations: ["Booking confirmations", "No-show reminders", "Rebook prompts"],
    kpis: ["Fill rate", "Repeat rate", "Avg booking value"],
    crmCustomizations: ["Stylist assignment", "Service history", "Package tracking"]
  },
  {
    name: "Restaurant",
    workflows: ["Reservation", "Table inquiry", "Event booking"],
    dashboards: ["Reservations", "Peak demand", "Repeat diners"],
    automations: ["Reservation confirmations", "Event follow-up", "Review prompts"],
    kpis: ["Reservation rate", "Repeat visits", "Response time"],
    crmCustomizations: ["Guest history", "Table preferences", "Offer tags"]
  },
  {
    name: "Entertainment",
    workflows: ["Ticket inquiry", "Group booking", "VIP request"],
    dashboards: ["Events", "VIP leads", "Capacity demand"],
    automations: ["Ticket reminders", "Event confirmations", "Upsell offers"],
    kpis: ["Ticket sales", "Lead response time", "Attendance"],
    crmCustomizations: ["Venue preferences", "Booking tier", "Audience segment"]
  },
  {
    name: "Healthcare",
    workflows: ["Patient booking", "Pre-visit intake", "Follow-up care"],
    dashboards: ["Appointments", "Follow-ups", "No-show risk"],
    automations: ["Appointment reminders", "Intake follow-up", "Care reminders"],
    kpis: ["Appointments kept", "No-show rate", "Response time"],
    crmCustomizations: ["Doctor assignment", "Visit type", "Care notes"]
  },
  {
    name: "Real Estate",
    workflows: ["Lead qualification", "Site visit", "Negotiation"],
    dashboards: ["Hot leads", "Visits booked", "Deals in progress"],
    automations: ["Lead routing", "Site visit reminders", "Price update follow-up"],
    kpis: ["Visits booked", "Deal velocity", "Lead response time"],
    crmCustomizations: ["Property interest", "Budget range", "Broker assignment"]
  },
  {
    name: "Education",
    workflows: ["Admission inquiry", "Counseling call", "Enrollment"],
    dashboards: ["Applications", "Counseling queue", "Enrollment funnel"],
    automations: ["Inquiry follow-up", "Counseling reminders", "Enrollment nudges"],
    kpis: ["Applications", "Enrollment rate", "Reply speed"],
    crmCustomizations: ["Program interest", "Parent/student role", "Cohort tracking"]
  }
];
