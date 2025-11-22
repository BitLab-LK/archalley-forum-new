# Authentication System Testing Guide

## Overview
This guide helps you test all the Phase 1 security improvements that were implemented.

## Prerequisites
1. Ensure your development server is running: `npm run dev`
2. Have access to email (for verification and password reset)
3. Clear browser cache/cookies if testing multiple scenarios

---

## Test Checklist

### ✅ Test 1: Password Requirements (Registration)

**Objective**: Verify password complexity requirements are enforced

**Steps**:
1. Navigate to `/auth/register`
2. Fill in registration form
3. Try passwords that should fail:
   - `password` (no uppercase, number, special char) ❌
   - `Password` (no number, special char) ❌
   - `Password1` (no special char) ❌
   - `Password!` (no number) ❌
   - `pass123!` (no uppercase) ❌
   - `PASS123!` (no lowercase) ❌
   - `Pass1!` (too short - 7 chars) ❌
4. Try a valid password:
   - `Password123!` ✅

**Expected Results**:
- All invalid passwords should show error: "Password must contain uppercase, lowercase, number, and special character"
- Valid password should be accepted
- Server-side validation should also reject weak passwords

---

### ✅ Test 2: Rate Limiting (Registration)

**Objective**: Verify registration rate limiting works

**Steps**:
1. Navigate to `/auth/register`
2. Attempt to register 6 times rapidly (within 15 minutes)
3. Use different email addresses each time
4. On the 6th attempt, you should be rate limited

**Expected Results**:
- First 5 attempts should work normally
- 6th attempt should show: "Too many registration attempts. Please try again later."
- Status code should be 429
- After 15 minutes, should be able to register again

---

### ✅ Test 3: Email Verification Enforcement

**Objective**: Verify users cannot login without verifying email

**Steps**:
1. Register a new account with email/password (NOT social login)
2. DO NOT verify the email
3. Try to log in with the new credentials

**Expected Results**:
- Login should fail with error: "Please verify your email address before logging in. Check your inbox for the verification email."
- User should NOT be able to access the application
- After verifying email, login should work

---

### ✅ Test 4: Account Enumeration Fix

**Objective**: Verify account enumeration vulnerability is fixed

**Steps**:
1. Try to register with an email that already exists
2. Try to register with a phone number that already exists

**Expected Results**:
- Should show generic message: "If this email is not already registered, a verification email will be sent to your inbox."
- Should NOT reveal whether the email/phone exists
- Same message for both existing and non-existing accounts

---

### ✅ Test 5: Account Lockout

**Objective**: Verify account lockout after failed login attempts

**Steps**:
1. Navigate to `/auth/register?tab=login`
2. Enter a valid email but wrong password
3. Attempt to login 5 times with wrong password
4. On 6th attempt, account should be locked

**Expected Results**:
- First 5 attempts should show: "Invalid email or password"
- 6th attempt should show: "Account locked due to too many failed attempts. Please try again in X minutes."
- Account should be locked for 15 minutes
- After lockout period, should be able to try again
- Successful login should clear failed attempts

---

### ✅ Test 6: Rate Limiting (Login)

**Objective**: Verify login rate limiting works

**Steps**:
1. Navigate to `/auth/register?tab=login`
2. Attempt to login 11 times rapidly (within 15 minutes)
3. Use the same email address

**Expected Results**:
- First 10 attempts should work (or fail with normal error)
- 11th attempt should show: "Too many login attempts. Please try again later."
- Status code should be 429

---

### ✅ Test 7: Password Reset Flow

**Objective**: Verify password reset functionality works end-to-end

**Steps**:
1. Navigate to `/auth/forgot-password`
2. Enter a valid email address
3. Click "Send Reset Link"
4. Check email for reset link
5. Click reset link (or copy token)
6. Navigate to `/auth/reset-password?token=YOUR_TOKEN`
7. Enter new password (must meet complexity requirements)
8. Confirm password
9. Submit
10. Try to login with new password

**Expected Results**:
- Should show success message: "If an account with that email exists, a password reset link has been sent to your inbox."
- Email should contain reset link and 6-digit code
- Reset link should work and show password reset form
- New password must meet complexity requirements
- After reset, should redirect to login
- Old password should NOT work
- New password should work

---

### ✅ Test 8: Password Reset Rate Limiting

**Objective**: Verify password reset rate limiting

**Steps**:
1. Navigate to `/auth/forgot-password`
2. Request password reset 6 times rapidly

**Expected Results**:
- First 5 requests should work
- 6th request should show: "Too many password reset requests. Please try again later."
- Status code should be 429

---

### ✅ Test 9: Email Verification Rate Limiting

**Objective**: Verify email verification rate limiting

**Steps**:
1. Register a new account
2. Try to verify email 11 times rapidly (with wrong token)

**Expected Results**:
- First 10 attempts should work (or fail with normal error)
- 11th attempt should show: "Too many verification attempts. Please try again later."
- Status code should be 429

---

### ✅ Test 10: Timing Attack Prevention

**Objective**: Verify timing attacks are prevented

**Steps**:
1. Try to login with non-existent email
2. Try to login with existing email but wrong password
3. Measure response times (should be similar)

**Expected Results**:
- Response times should be similar for both cases
- System should always perform password hash comparison
- Should not reveal whether email exists through timing

---

### ✅ Test 11: Password Reset Token Expiration

**Objective**: Verify reset tokens expire after 1 hour

**Steps**:
1. Request password reset
2. Wait 1 hour (or manually expire token in database)
3. Try to use the reset token

**Expected Results**:
- Token should be invalid after 1 hour
- Should show: "Reset token has expired. Please request a new one."
- Should NOT allow password reset with expired token

---

### ✅ Test 12: Social Login (OAuth) - Email Verification

**Objective**: Verify social login users don't need email verification

**Steps**:
1. Register using Google/Facebook/LinkedIn
2. Complete registration form
3. Try to login immediately (without email verification)

**Expected Results**:
- Social login users should be auto-verified
- Should be able to login immediately after registration
- No email verification required for OAuth users

---

## Manual Testing Commands

### Test Registration with Weak Password
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "weak",
    "agreeToTerms": true
  }'
```

### Test Registration with Strong Password
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "Password123!",
    "agreeToTerms": true
  }'
```

### Test Rate Limiting
```bash
# Run this 6 times rapidly
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"firstName\": \"Test\", \"lastName\": \"User\", \"email\": \"test$i@example.com\", \"password\": \"Password123!\", \"agreeToTerms\": true}"
  echo "Attempt $i"
done
```

### Test Forgot Password
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Test Reset Password
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_RESET_TOKEN",
    "password": "NewPassword123!"
  }'
```

---

## Database Checks

### Check Failed Login Attempts
```sql
-- Check if account lockout is working
-- This is stored in memory (Map), but you can verify by testing
```

### Check Verification Tokens
```sql
SELECT * FROM "VerificationToken" 
WHERE "identifier" = 'test@example.com' 
ORDER BY "expires" DESC;
```

### Check User Verification Status
```sql
SELECT id, email, "isVerified", "emailVerified" 
FROM "Users" 
WHERE email = 'test@example.com';
```

---

## Common Issues & Solutions

### Issue: Rate limiting not working
**Solution**: Check that `checkRateLimit` is imported and called correctly

### Issue: Password validation too strict
**Solution**: Verify regex patterns match your requirements

### Issue: Email verification not enforced
**Solution**: Check that `isVerified` and `emailVerified` are checked in authorize function

### Issue: Account lockout not working
**Solution**: Verify `recordFailedLoginAttempt` is called on failed attempts

### Issue: Password reset email not sending
**Solution**: Check email service configuration (SMTP/Resend)

---

## Test Results Template

```
Date: ___________
Tester: ___________

[ ] Test 1: Password Requirements - PASS/FAIL
[ ] Test 2: Rate Limiting (Registration) - PASS/FAIL
[ ] Test 3: Email Verification Enforcement - PASS/FAIL
[ ] Test 4: Account Enumeration Fix - PASS/FAIL
[ ] Test 5: Account Lockout - PASS/FAIL
[ ] Test 6: Rate Limiting (Login) - PASS/FAIL
[ ] Test 7: Password Reset Flow - PASS/FAIL
[ ] Test 8: Password Reset Rate Limiting - PASS/FAIL
[ ] Test 9: Email Verification Rate Limiting - PASS/FAIL
[ ] Test 10: Timing Attack Prevention - PASS/FAIL
[ ] Test 11: Password Reset Token Expiration - PASS/FAIL
[ ] Test 12: Social Login Email Verification - PASS/FAIL

Notes:
_________________________________________________
_________________________________________________
_________________________________________________
```

---

## Next Steps After Testing

1. Document any bugs found
2. Fix critical issues before Phase 2
3. Proceed with Phase 2 improvements if all tests pass
4. Consider adding automated tests for these scenarios

---

**Good luck with testing!** 🧪
