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

Business forms are handled on the client and sent through EmailJS.

Active forms:

- Book Consultation
- Contact Form
- Quote Request
- Future Review Request

Required production environment variables:

- `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`
- `NEXT_PUBLIC_EMAILJS_SERVICE_ID`
- `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`
