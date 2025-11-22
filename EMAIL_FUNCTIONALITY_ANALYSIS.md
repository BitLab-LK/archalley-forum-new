# Email Functionality Analysis - Registration & Login

## Overview
This document outlines all email sending occasions during the registration and login processes, and their current functionality status.

---

## 📧 Email Occasions During Registration

### 1. **Welcome Email** ✅
**When:** After successful registration (BOTH email/password AND social/OAuth registration)

**Location:**
- Function: `sendWelcomeEmail()` in `lib/email-service.ts`
- Called from: `app/api/auth/register/route.ts`

**What it contains:**
- Welcome message describing Archalley as an online platform for architecture and design, with focus on innovative tropical architecture in Sri Lanka
- Button linking to archalley.com homepage
- Features overview highlighting tropical architecture, sustainable design, and community
- Links to social media
- Link to access the platform

**Functionality Status:**
- ✅ **Implemented and functional**
- Sends via SMTP (primary) with Resend fallback
- Sent asynchronously (doesn't block registration)
- Errors are caught and logged but don't block registration

**Conditions:**
- Sent for ALL registrations (email/password and social/OAuth)
- Sent after successful user creation

### 2. **Email Verification Email** ✅
**When:** After successful email/password registration (NOT for social/OAuth registration)

**Location:**
- Function: `sendVerificationEmail()` in `lib/email-service.ts`
- Called from: `app/api/auth/register/route.ts` (line 582)

**What it contains:**
- Verification token (32-byte hex string)
- 6-digit verification code (first 6 characters of token, uppercase)
- Verification URL: `/api/auth/verify-email?token=xxx`
- Expiration: 24 hours

**Functionality Status:**
- ✅ **Implemented and functional**
- Sends via SMTP (primary) with Resend fallback
- Token stored in `VerificationToken` table
- Errors are caught and logged but don't block registration

**Conditions:**
- Only sent for email/password registration (`!isSocialRegistration`)
- Not sent for OAuth/social registrations (Google, etc.)

---

## 📧 Email Occasions During Login

### 1. **Login Notification Email** ✅
**When:** After successful login (all login methods)

**Location:**
- Function: `sendLoginNotificationEmail()` in `lib/email-service.ts`
- Called from multiple locations:
  - `lib/auth.ts` (line 183) - Credentials login
  - `lib/auth.ts` (line 378) - OAuth login (Google, etc.)
  - `app/api/auth/verify-2fa/route.ts` (line 148) - 2FA login
  - `app/api/auth/verify-magic-link/route.ts` (line 158) - Magic link login

**What it contains:**
- Login timestamp
- IP address (if available)
- User agent / device information
- Security warning if unauthorized login
- Link to account settings

**Functionality Status:**
- ✅ **Implemented and functional**
- Sent asynchronously (doesn't block login process)
- Sends via SMTP (primary) with Resend fallback
- Errors are caught and logged but don't block login

**Conditions:**
- Only sent if `user.emailNotifications !== false` (default: `true`)
- Sent for all login methods:
  - Email/password
  - OAuth (Google, etc.)
  - 2FA
  - Magic link
- Sent asynchronously (non-blocking)

---

## 🔧 Email Service Configuration

### Primary: SMTP
**Required Environment Variables:**
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port (typically 587)
- `SMTP_USER` - SMTP username/email
- `SMTP_PASSWORD` - SMTP password
- `EMAIL_FROM` - Sender email address
- `EMAIL_FROM_NAME` - Sender display name (optional)

### Fallback: Resend API
**Required Environment Variables:**
- `RESEND_API_KEY` - Resend API key

**Behavior:**
- If SMTP fails, automatically falls back to Resend
- If both fail, emails are logged to console (in production)
- In development mode, emails are always logged to console instead of being sent

---

## ⚠️ Important Notes

### Email Sending (All Environments)
**In both development and production:**
- Emails are **SENT normally** (same behavior in all environments)
- Email service uses SMTP (primary) or Resend API (fallback)
- If SMTP is not configured, Resend is used as fallback
- If both fail, errors are logged but process continues
- Email content is also logged to console for debugging: `📧 [EMAIL DEBUG]`
- Check server logs for email sending status:
  - `✅ Email sent successfully` - Success
  - `❌ Error sending email` - Failure
  - `📧 [EMAIL DEBUG]` - Debug information

### Error Handling
- Email sending errors are **caught and logged** but don't block the registration/login process
- Users can still register/login even if email sending fails
- Check server logs for email errors:
  - `❌ Email service not available`
  - `❌ Error sending verification email`
  - `❌ Error sending login notification email`

---

## 🧪 Testing Email Functionality

### Check if Emails are Being Sent:

1. **Check Server Logs:**
   ```bash
   # Look for these log messages:
   ✅ Verification email sent to {email}
   ✅ Login notification email sent to {email}
   ✅ Email sent via Resend successfully
   ```

2. **Check Email Service Status:**
   - The email service validates configuration on startup
   - Check logs for: `✅ Email service initialized successfully`
   - Or: `❌ Email service configuration error`

3. **Development Mode:**
   - In development, emails are logged to console
   - Look for: `📧 [EMAIL DEBUG] DEVELOPMENT MODE - Email that would be sent:`

4. **Check Database:**
   - Verification tokens are stored in `VerificationToken` table
   - Check if tokens are being created after registration

### Common Issues:

1. **Emails Not Sending:**
   - Check SMTP configuration in `.env` file
   - Verify `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` are set
   - Check if Resend API key is configured as fallback
   - Check server logs for error messages

2. **Email Service Configuration:**
   - Ensure SMTP or Resend API is properly configured
   - Check that environment variables are set correctly
   - Verify email service initialization in server logs

3. **Login Notifications Not Sending:**
   - Check if user has `emailNotifications` set to `false`
   - Check server logs for errors
   - Verify email service is configured

---

## 📊 Summary

### Registration Process:
- ✅ **Welcome Email**: Sent for ALL registrations (email/password AND social/OAuth)
- ✅ **Verification Email**: Sent for email/password registration only

### Login Process:
- ✅ **Login Notification Email**: Sent for all login methods (if enabled)

### Functionality Status:
- ✅ **Implemented**: All email functions are implemented
- ✅ **Functional**: Emails are sent when configured correctly
- ✅ **Development Mode**: Emails are sent in development mode (not just logged)
- ⚠️ **Conditional**: Depends on email service configuration (SMTP or Resend)
- ⚠️ **Error Handling**: Errors are caught but don't block process

### Recommendations:
1. **Verify Email Configuration**: Ensure SMTP or Resend is properly configured
2. **Check Server Logs**: Monitor email sending status (works in both dev and production)
3. **Test Email Sending**: Test email sending in your environment (emails are sent in dev mode too)
4. **Monitor Errors**: Set up alerts for email sending failures
5. **User Settings**: Allow users to disable login notifications if desired
6. **Development Testing**: Emails are now sent in development mode, so test carefully with real email addresses

---

## 🔍 Code References

### Registration Emails:
- `app/api/auth/register/route.ts` - Registration endpoint
- `lib/email-service.ts` - `sendWelcomeEmail()` function (for all registrations)
- `lib/email-service.ts` - `sendVerificationEmail()` function (for email/password only)

### Login Notification Email:
- `lib/auth.ts` - Credentials and OAuth login
- `app/api/auth/verify-2fa/route.ts` - 2FA login
- `app/api/auth/verify-magic-link/route.ts` - Magic link login
- `lib/email-service.ts` - `sendLoginNotificationEmail()` function

### Email Service:
- `lib/email-service.ts` - Main email service implementation
- `lib/email-service.ts` - `getTransporter()` - SMTP transporter
- `lib/email-service.ts` - `sendEmailViaResend()` - Resend fallback

---

## 📝 Additional Email Types (Not Registration/Login)

### Password Reset Email:
- Sent when user requests password reset
- Function: `sendPasswordResetEmail()` in `lib/email-service.ts`
- Called from: `app/api/auth/forgot-password/route.ts`

### Magic Link Email:
- Sent when user requests magic link login
- Function: `sendMagicLinkEmail()` in `lib/email-service.ts`
- Called from: `app/api/auth/magic-link/route.ts`

---

## 🧪 Testing Welcome Email

### Test Endpoint:
A test endpoint is available to send welcome emails:

**GET Request:**
```
GET /api/test/welcome-email?email=chavindu@bitlab.lk&name=Chavindu
```

**POST Request:**
```json
POST /api/test/welcome-email
{
  "email": "chavindu@bitlab.lk",
  "name": "Chavindu"
}
```

### To Test:
1. Start your development server
2. Navigate to: `http://localhost:3000/api/test/welcome-email?email=chavindu@bitlab.lk&name=Chavindu`
3. Or use curl:
   ```bash
   curl "http://localhost:3000/api/test/welcome-email?email=chavindu@bitlab.lk&name=Chavindu"
   ```
4. Check the email inbox for chavindu@bitlab.lk
5. Verify the email contains the "Visit Archalley.com" button

---

*Last Updated: Based on current codebase analysis*

