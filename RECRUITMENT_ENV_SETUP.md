# Recruitment System - Environment Variable Setup

## Required Environment Variables

Add these to your `.env.local` file (or production equivalent):

```env
# SMTP Configuration (for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@revanta-ai.com
SMTP_SECURE=false

# Admin Settings
ADMIN_EMAIL=admin@revanta-ai.com

# Public URL (for admin links in emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Job ID (if not set, system creates default)
INTERNSHIP_JOB_ID=intern-2024
```

## Setup Instructions

### 1. Database Migration

Run Prisma migration to create the new tables:

```bash
npx prisma migrate dev --name add_recruitment_system
```

This will:
- Create Job table
- Create JobApplication table
- Create Assessment tables
- Create ProctoringEvent table
- Create ApplicationAttachment table

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Email Configuration (Gmail Example)

For Gmail SMTP:
1. Enable 2-Factor Authentication on Gmail account
2. Generate App Password at: https://myaccount.google.com/apppasswords
3. Use that App Password as `SMTP_PASSWORD`

For other providers, use their SMTP credentials:
- SendGrid: `smtp.sendgrid.net:587`
- Mailgun: `smtp.mailgun.org:587`
- AWS SES: `email-smtp.region.amazonaws.com:587`

### 4. File Upload Directory

The system automatically creates:
```
public/uploads/resumes/
```

Make sure this directory is writable or will be created on first upload.

### 5. Organization Setup

The system automatically:
- Creates a default "RevantaAI" organization if it doesn't exist
- Creates the "Software Development Intern" job if it doesn't exist
- Uses these for all applications

No manual seeding required.

## Testing the Setup

### 1. Test Database Connection

```bash
npx prisma db push
```

### 2. Test Email (Optional - Direct Script)

Create a test script:
```typescript
// test-email.ts
import { sendSmtpEmail } from '@/lib/revanta-os/email';

const result = await sendSmtpEmail({
  from: process.env.SMTP_FROM || 'noreply@revanta-ai.com',
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<h1>Test</h1>'
});

console.log(result);
```

### 3. Test Application Submission

```bash
curl -X POST http://localhost:3000/api/applications \
  -F "fullName=John Doe" \
  -F "email=john@test.com" \
  -F "phone=+919876543210" \
  -F "city=Bangalore" \
  -F "state=Karnataka" \
  -F "degree=B.Tech" \
  -F "specialization=AI & DS" \
  -F "graduationYear=2027" \
  -F "primaryInterest=Backend Development" \
  -F "technologiesKnown=[\"Node.js\",\"PostgreSQL\"]" \
  -F "motivation=I want to learn" \
  -F "learningGoals=Fullstack development" \
  -F "resume=@resume.pdf"
```

## Troubleshooting

### Email Not Sending

1. Check SMTP credentials in `.env.local`
2. Verify firewall isn't blocking SMTP port 587/465
3. Check email logs: `SELECT * FROM "EmailLog" ORDER BY "createdAt" DESC;`

### Resume Upload Failing

1. Ensure `public/uploads/resumes/` directory exists and is writable
2. Check file size < 5MB
3. Check file type is PDF/DOC/DOCX

### Applications Not Appearing

1. Check Prisma migration ran successfully: `npx prisma migrate status`
2. Check database has `JobApplication` table: `\dt` in psql
3. Verify organization was created: `SELECT * FROM "Organization";`
4. Verify job was created: `SELECT * FROM "Job";`

## File Structure After Setup

```
public/
  uploads/
    resumes/
      [random-filename-timestamp].pdf
      [random-filename-timestamp].docx
      ...

prisma/
  schema.prisma                 # ✅ Updated with recruitment models
  migrations/
    [timestamp]_add_recruitment_system/

app/
  careers/                      # ✅ New
  admin/applications/           # ✅ New
  api/applications/             # ✅ New

components/
  internship/                   # ✅ New
```

## URLs After Deployment

- Public Careers Page: `/careers`
- Internship Details: `/careers/software-development-intern`
- Application Form: `/careers/software-development-intern/apply`
- Success Page: `/careers/software-development-intern/apply/success?id=...`
- Admin Dashboard: `/admin/applications`
- Admin Detail: `/admin/applications/[id]`

## Database Models

All models in `prisma/schema.prisma`:
- ✅ Job
- ✅ JobApplication
- ✅ Assessment
- ✅ AssessmentQuestion
- ✅ AssessmentResponse
- ✅ ProctoringEvent
- ✅ ApplicationAttachment

Organization already has relationships:
- ✅ jobs
- ✅ jobApplications
- ✅ assessments
- ✅ assessmentQuestions
- ✅ assessmentResponses
- ✅ proctoringEvents
- ✅ applicationAttachments

## Next: Assessment System

When ready to implement technical assessments:

1. Create `/careers/software-development-intern/assessment` routes
2. Create assessment delivery pages
3. Implement timer logic (60s per MCQ, 5m per coding)
4. Implement proctoring event logging
5. Create scoring system
6. Generate assessment reports

All database infrastructure is already ready.

---

**Status**: ✅ System is ready to deploy once environment variables are configured
