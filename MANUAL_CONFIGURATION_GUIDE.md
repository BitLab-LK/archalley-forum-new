# Manual Configuration Guide

This guide lists all manual configurations needed to fully enable the features added during the 4 phases.

---

## 📋 Table of Contents

1. [Database Migrations](#database-migrations)
2. [Environment Variables](#environment-variables)
3. [Cron Job Setup](#cron-job-setup)
4. [Optional Database Fields](#optional-database-fields)
5. [Third-Party Service Setup](#third-party-service-setup)
6. [Verification Checklist](#verification-checklist)

---

## 🗄️ Database Migrations

### Required Migrations

#### 1. Password History Table (Feature #26)
**Status:** Required for Advanced Password History

**Migration File:** `prisma/migrations/add_password_history.sql`

**Run Migration:**
```bash
# Option 1: Using Prisma Migrate
npx prisma migrate dev --name add_password_history

# Option 2: Using Prisma DB Push (for development)
npx prisma db push

# Option 3: Manual SQL execution
# Execute the SQL in prisma/migrations/add_password_history.sql
```

**Prisma Schema Addition:**
```prisma
model PasswordHistory {
  id          String   @id @default(cuid())
  userId      String
  passwordHash String
  createdAt   DateTime @default(now())
  user        users    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
}
```

**Note:** Without this migration, Feature #26 (Advanced Password History) will not work, but Feature #22 (Basic Password History) will still work.

---

## 🔐 Environment Variables

### Required Environment Variables

Add these to your `.env` file (or `.env.local` for Next.js):

#### 1. NextAuth Configuration
```env
# NextAuth Secret (REQUIRED)
NEXTAUTH_SECRET=your-secret-key-here
# Generate with: openssl rand -base64 32

# NextAuth URL (REQUIRED)
NEXTAUTH_URL=http://localhost:3000
# For production: https://yourdomain.com
```

#### 2. Email Service Configuration
**Choose ONE of the following:**

**Option A: SMTP (Nodemailer)**
```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Archalley Forum
```

**Option B: Resend API**
```env
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Archalley Forum
```

**Note:** The system will try SMTP first, then fall back to Resend if SMTP fails.

#### 3. reCAPTCHA v3 (Feature #20)
**Status:** Optional but recommended

```env
# reCAPTCHA v3 Keys
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key

# Optional: Minimum score threshold (default: 0.3)
RECAPTCHA_MIN_SCORE=0.3
```

**Setup Steps:**
1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Create a new site (reCAPTCHA v3)
3. Add your domain
4. Copy the Site Key and Secret Key
5. Add to `.env` file

**Note:** If not configured, registration will still work (for development).

#### 4. Cron Job Secret (Feature #21)
**Status:** Optional but recommended for production

```env
# Cron Secret for securing email verification reminders endpoint
CRON_SECRET=your-random-secret-key-here
# Generate with: openssl rand -base64 32
```

**Note:** If not set, the cron endpoint will still work but won't be protected.

---

## ⏰ Cron Job Setup

### Email Verification Reminders (Feature #21)

**Status:** Required for automated email verification reminders

**Endpoint:** `POST /api/cron/email-verification-reminders`

**Setup Options:**

#### Option 1: Vercel Cron (Recommended for Vercel deployments)

Create or update `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/email-verification-reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Schedule:** Runs every hour (`0 * * * *`)

#### Option 2: External Cron Service

Use services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Cronitor](https://cronitor.io)

**Configuration:**
- **URL:** `https://yourdomain.com/api/cron/email-verification-reminders`
- **Method:** POST
- **Schedule:** Every hour (`0 * * * *`)
- **Headers (if CRON_SECRET is set):**
  ```
  Authorization: Bearer your-cron-secret
  ```

#### Option 3: Manual Testing

You can manually trigger the endpoint:
```bash
# Without authentication
curl -X POST https://yourdomain.com/api/cron/email-verification-reminders

# With authentication (if CRON_SECRET is set)
curl -X POST https://yourdomain.com/api/cron/email-verification-reminders \
  -H "Authorization: Bearer your-cron-secret"
```

---

## 📊 Optional Database Fields

### 1. 2FA Backup Codes (Feature #28)

**Status:** Optional - Feature works but codes are returned to user (not stored)

**Prisma Schema Addition:**
```prisma
model users {
  // ... existing fields ...
  twoFactorBackupCodes String[] @default([])
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_two_factor_backup_codes
```

**Note:** Without this field, backup codes will be generated and returned to the user, but won't be stored in the database for verification.

### 2. IP Whitelisting (Feature #30)

**Status:** Optional - Foundation code ready, currently commented out

**Prisma Schema Addition:**
```prisma
model users {
  // ... existing fields ...
  ipWhitelist          String[] @default([])
  ipWhitelistEnabled   Boolean  @default(false)
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_ip_whitelisting
```

**To Enable:**
1. Add the database fields (above)
2. Uncomment the IP whitelist check in `lib/auth.ts` (around line 136-151)

**Note:** Currently commented out in the auth flow. Uncomment after adding database fields.

### 3. Audit Log Table (Feature #12)

**Status:** Optional - Currently logs to console, can be stored in database

**Prisma Schema Addition:**
```prisma
model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  email       String?
  ipAddress   String?
  userAgent   String?
  eventType   String
  details     Json?
  success     Boolean
  errorMessage String?
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([email])
  @@index([eventType])
  @@index([createdAt])
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_audit_log
```

**To Enable Database Storage:**
1. Add the AuditLog model to Prisma schema
2. Uncomment database storage code in `lib/audit-log.ts`

**Note:** Currently logs to console. Database storage is optional but recommended for production.

---

## 🔧 Third-Party Service Setup

### 1. Google reCAPTCHA v3

**Required for:** Feature #20 (reCAPTCHA for Registration)

**Setup Steps:**
1. Visit [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click "Create" to add a new site
3. Select "reCAPTCHA v3"
4. Add your domain(s):
   - `localhost` (for development)
   - `yourdomain.com` (for production)
5. Accept the reCAPTCHA Terms of Service
6. Submit and copy your keys:
   - **Site Key** → `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   - **Secret Key** → `RECAPTCHA_SECRET_KEY`
7. Add keys to `.env` file

**Note:** Registration will work without reCAPTCHA, but bot protection won't be active.

### 2. Email Service Provider

**Required for:** All email features (verification, password reset, login notifications, magic links)

**Options:**

#### Option A: Gmail SMTP
1. Enable 2-Step Verification
2. Generate App Password: [Google Account Settings](https://myaccount.google.com/apppasswords)
3. Use App Password as `SMTP_PASS`

#### Option B: Resend
1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Get API key from dashboard
4. Add to `.env` as `RESEND_API_KEY`

#### Option C: Other SMTP Providers
- SendGrid
- Mailgun
- AWS SES
- Postmark

Configure with standard SMTP settings.

---

## ✅ Verification Checklist

### Phase 1 Features (Critical)
- [ ] `NEXTAUTH_SECRET` is set
- [ ] `NEXTAUTH_URL` is set
- [ ] Email service is configured (SMTP or Resend)
- [ ] Password complexity requirements are working
- [ ] Rate limiting is working
- [ ] Account lockout is working
- [ ] Email verification is enforced
- [ ] Password reset flow is working

### Phase 2 Features (Audit & Input)
- [ ] Audit logging is working (check console)
- [ ] Input sanitization is active
- [ ] Password strength meter displays correctly
- [ ] Session management API is accessible
- [ ] Session lifetime is 7 days (check `lib/auth.ts`)

### Phase 3 Features (Advanced)
- [ ] 2FA integration works (if 2FA is enabled)
- [ ] reCAPTCHA is configured (optional)
- [ ] Email verification reminders cron is set up
- [ ] Login notifications are being sent
- [ ] Security dashboard is accessible at `/profile/security`

### Phase 4 Features (Nice-to-Have)
- [ ] Password history migration is run (for Feature #26)
- [ ] Magic link authentication works
- [ ] Device fingerprinting displays in security dashboard
- [ ] 2FA backup codes endpoint works (optional database field)
- [ ] IP whitelisting is configured (if needed)

---

## 🚀 Quick Start Configuration

### Minimum Required Configuration

For the system to work, you need:

1. **NextAuth Configuration:**
   ```env
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000
   ```

2. **Email Service (at least one):**
   ```env
   # Option 1: SMTP
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   
   # OR Option 2: Resend
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

3. **Database Migration (for Feature #26):**
   ```bash
   npx prisma migrate dev --name add_password_history
   ```

### Recommended Additional Configuration

1. **reCAPTCHA v3** (Feature #20)
2. **Cron Job** for email reminders (Feature #21)
3. **Audit Log Table** for production logging (Feature #12)

---

## 📝 Configuration Priority

### Critical (Must Configure)
1. ✅ NextAuth Secret & URL
2. ✅ Email Service (SMTP or Resend)
3. ✅ Database Migration for Password History (Feature #26)

### Important (Should Configure)
4. ⚠️ reCAPTCHA v3 (Feature #20)
5. ⚠️ Cron Job for Email Reminders (Feature #21)
6. ⚠️ Cron Secret (Feature #21)

### Optional (Nice to Have)
7. 🔵 Audit Log Database Table (Feature #12)
8. 🔵 2FA Backup Codes Database Field (Feature #28)
9. 🔵 IP Whitelisting Database Fields (Feature #30)

---

## 🔍 Testing Your Configuration

### Test Email Service
```bash
# Check if email service is working
# Try registering a new account - you should receive a verification email
```

### Test reCAPTCHA
```bash
# Try registering a new account
# Check browser console for reCAPTCHA errors
# Check server logs for reCAPTCHA verification
```

### Test Password History
```bash
# 1. Reset your password
# 2. Try to reset to the same password again
# 3. Should fail with "cannot reuse current password"
# 4. Try to reset to a previous password (if migration is run)
# 5. Should fail with "cannot reuse last 5 passwords"
```

### Test Cron Job
```bash
# Manually trigger the endpoint
curl -X POST http://localhost:3000/api/cron/email-verification-reminders
```

### Test Magic Link
```bash
# 1. Go to /auth/magic-link
# 2. Enter your verified email
# 3. Check email for magic link
# 4. Click link to login
```

---

## 🆘 Troubleshooting

### Email Not Sending
- Check SMTP credentials
- Check Resend API key
- Check email service logs
- Verify `EMAIL_FROM` is set correctly

### reCAPTCHA Not Working
- Verify keys are correct
- Check domain is added in reCAPTCHA console
- Check browser console for errors
- Verify `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is accessible

### Password History Not Working
- Verify migration is run: `npx prisma migrate status`
- Check database for `PasswordHistory` table
- Check server logs for errors

### Cron Job Not Running
- Verify cron job is set up correctly
- Check cron service logs
- Test endpoint manually
- Verify `CRON_SECRET` if authentication is enabled

---

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org)
- [Prisma Migrations Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [Vercel Cron Documentation](https://vercel.com/docs/cron-jobs)

---

**Last Updated:** After Phase 4 Implementation
**Status:** All features implemented, configuration guide complete
