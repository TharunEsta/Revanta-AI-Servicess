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

Business forms are handled inside Next.js and sent through EmailJS.

Active forms:

- Book Consultation
- Contact Form
- Quote Request
- Future Review Request

Optional environment variables:

- `EMAILJS_PUBLIC_KEY`
- `EMAILJS_SERVICE_ID`
- `EMAILJS_TEMPLATE_ID`

If these are not set, the project falls back to the migrated EmailJS values from the legacy site.
