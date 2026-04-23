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

Business forms are handled inside Next.js and sent through Resend from secure server routes.

Active forms:

- Book Consultation
- Contact Form
- Quote Request
- Future Review Request

Required production environment variables:

- `RESEND_API_KEY`
- `FORMS_NOTIFICATION_TO_EMAIL`
- `FORMS_NOTIFICATION_FROM_EMAIL`
