# Revanta AI

Premium multi-page marketing website for Revanta AI, rebuilt with Next.js 15, React, TypeScript, Tailwind CSS, and Framer Motion.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production build

```bash
npm run build
npm run start
```

## Lead capture

The contact form posts to `/api/contact`.

Optional environment variables:

- `LEAD_WEBHOOK_URL`: webhook endpoint for incoming leads
- `LEAD_WEBHOOK_SECRET`: optional bearer token for the webhook

If no webhook is configured, the API still returns success and logs the lead payload server-side so the site remains deployable without extra services.
