# Quick Test Checklist

## 🚀 Quick Start Testing

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test Registration Password Requirements
- [ ] Try weak password: `password` → Should fail
- [ ] Try medium password: `Password1` → Should fail (needs special char)
- [ ] Try strong password: `Password123!` → Should pass ✅

### 3. Test Rate Limiting (Registration)
- [ ] Register 5 times rapidly → Should work
- [ ] Register 6th time → Should show rate limit error (429)

### 4. Test Email Verification Enforcement
- [ ] Register new account (email/password)
- [ ] Try to login WITHOUT verifying email → Should fail with verification message
- [ ] Verify email via link
- [ ] Try to login AFTER verification → Should work ✅

### 5. Test Account Lockout
- [ ] Try to login with wrong password 5 times
- [ ] 6th attempt → Should show account locked message
- [ ] Wait 15 minutes OR clear lockout in code
- [ ] Try again → Should work

### 6. Test Password Reset Flow
- [ ] Go to `/auth/forgot-password`
- [ ] Enter email → Should send reset email
- [ ] Click reset link in email
- [ ] Enter new password: `NewPassword123!`
- [ ] Confirm password
- [ ] Submit → Should redirect to login
- [ ] Login with new password → Should work ✅

### 7. Test Account Enumeration Fix
- [ ] Try to register with existing email
- [ ] Should show generic message (not "email exists")
- [ ] Try to register with new email
- [ ] Should show same generic message

---

## 🔍 Key URLs to Test

- Registration: `http://localhost:3000/auth/register`
- Login: `http://localhost:3000/auth/register?tab=login`
- Forgot Password: `http://localhost:3000/auth/forgot-password`
- Reset Password: `http://localhost:3000/auth/reset-password?token=YOUR_TOKEN`
- Verify Email: `http://localhost:3000/auth/verify?token=YOUR_TOKEN`

---

## ⚠️ Common Issues to Watch For

1. **Password validation too strict?** Check regex in `app/api/auth/register/route.ts`
2. **Rate limiting not working?** Check `checkRateLimit` is imported
3. **Email verification not enforced?** Check `lib/auth.ts` authorize function
4. **Account lockout not working?** Check `recordFailedLoginAttempt` is called
5. **Password reset email not sending?** Check email service config

---

## 📝 Test Results

Date: ___________

- [ ] Password Requirements: ✅ / ❌
- [ ] Rate Limiting: ✅ / ❌
- [ ] Email Verification: ✅ / ❌
- [ ] Account Lockout: ✅ / ❌
- [ ] Password Reset: ✅ / ❌
- [ ] Account Enumeration Fix: ✅ / ❌

Notes:
_________________________________________________
