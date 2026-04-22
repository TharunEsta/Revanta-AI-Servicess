# Reviews Admin Workflow

## Current architecture

The review system now uses Supabase as the primary database layer.

- Public review submissions are written to Supabase with `pending` status.
- Pending reviews do not appear on the homepage or `/reviews`.
- Only `approved` reviews are publicly visible.
- Admin approval and rejection happen through the protected moderation API.

## What you need to configure

Set these environment variables:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
REVIEW_ADMIN_SECRET=your-secure-admin-secret
RESEND_API_KEY=your-resend-api-key
REVIEW_NOTIFICATION_TO_EMAIL=you@revantaai.com
REVIEW_NOTIFICATION_FROM_EMAIL=reviews@revantaai.com
```

## Supabase setup

Run the SQL file in Supabase SQL Editor:

`supabase/reviews.sql`

That creates the `reviews` table, indexes, and the public read policy for approved reviews.

## Review lifecycle

1. A client submits a review from the public form.
2. The review is validated server-side.
3. The review is stored in Supabase with `pending` status.
4. A notification email is sent through Resend.
5. An admin approves or rejects the review manually.
6. Only approved reviews appear publicly.

## Approve a review

```bash
curl -X POST http://localhost:3000/api/reviews/approve \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: your-secure-admin-secret" \
  -d "{\"reviewId\":\"REVIEW_ID_HERE\",\"action\":\"approve\"}"
```

## Reject a review

```bash
curl -X POST http://localhost:3000/api/reviews/approve \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: your-secure-admin-secret" \
  -d "{\"reviewId\":\"REVIEW_ID_HERE\",\"action\":\"reject\"}"
```

## Finding pending review IDs

Open your Supabase table editor and check the `reviews` table for rows with `status = pending`.
