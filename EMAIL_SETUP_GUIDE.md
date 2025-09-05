# Email Notification System Setup Guide

## 🎉 System Successfully Implemented!

Your forum now has a complete email notification system that sends real-time emails for user activities and periodic digest emails.

## ✅ What's Been Implemented

### Real-time Email Notifications
- **Comments**: Email when someone comments on your posts
- **Likes**: Email when someone likes your posts
- **Replies**: Email when someone replies to your comments
- **Mentions**: Email when someone mentions you (@username)
- **Best Answer**: Email when your comment is marked as best answer
- **System**: Important announcements and updates

### Email Digest System
- **Daily**: Yesterday's activity summary
- **Weekly**: Past week's activity summary
- **Monthly**: Past month's activity summary

### User Preferences
- **Granular Control**: Users can enable/disable each notification type
- **Master Toggle**: Turn all email notifications on/off
- **Email Verification**: Only sends to verified email addresses

## 🔧 Setup Instructions

### 1. Configure Email Service
Add these environment variables to your `.env` file:

```env
# SMTP Configuration (Gmail example)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"  # Use App Password for Gmail
EMAIL_FROM="your-email@gmail.com"
EMAIL_FROM_NAME="Your Forum Name"

# Security
CRON_SECRET="your-secure-cron-secret-key"
```

### 2. Gmail Setup (Recommended)
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification** (enable if not already)
3. Go to **Security** → **App passwords**
4. Generate an app password for "Mail"
5. Use this app password as your `SMTP_PASSWORD`

### 3. Test the System
1. Start your development server: `npm run dev`
2. Log in to your forum
3. Go to `/profile/email-preferences`
4. Click "Send Test Email"
5. Check your inbox!

## 🎯 How It Works

### Automatic Triggers
The system automatically sends emails when:
- Someone comments on your post → Email to post author
- Someone likes your post → Email to post author  
- Someone replies to your comment → Email to comment author
- Someone mentions you (@username) → Email to mentioned user
- System events occur → Email to relevant users

### User Controls
Users can manage their preferences at:
- **Main Settings**: `/profile/email-preferences`
- **Profile Edit**: Link in profile edit page

### Email Templates
Professional HTML emails with:
- **Responsive Design**: Works on all devices
- **Branded Styling**: Consistent with your forum
- **Action Links**: Direct links back to content
- **Unsubscribe**: Easy preference management

## 🔍 Testing Different Scenarios

### Test Real-time Notifications
1. **Comment Notification**:
   - Create a post with User A
   - Comment on it with User B
   - User A should receive email

2. **Like Notification**:
   - Create a post with User A
   - Like it with User B
   - User A should receive email

3. **Mention Notification**:
   - Create a post mentioning @username
   - Mentioned user should receive email

4. **Reply Notification**:
   - Comment on a post with User A
   - Reply to that comment with User B
   - User A should receive email

### Test Digest Emails
Use the API endpoint to test:
```bash
curl -X POST http://localhost:3000/api/cron/digest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-cron-secret" \
  -d '{"action": "digest", "frequency": "DAILY"}'
```

## 📊 Admin Features

### Email Logs
All sent emails are logged in the database with:
- Delivery status (PENDING, SENT, FAILED, BOUNCED)
- Error messages for debugging
- Metadata for analytics

### Analytics Query Examples
```sql
-- Check email delivery rates
SELECT status, COUNT(*) FROM "EmailLogs" GROUP BY status;

-- Recent failed emails
SELECT * FROM "EmailLogs" WHERE status = 'FAILED' ORDER BY "createdAt" DESC LIMIT 10;

-- User with most notifications
SELECT "userId", COUNT(*) FROM "EmailLogs" GROUP BY "userId" ORDER BY COUNT(*) DESC LIMIT 10;
```

## 🚀 Production Setup

### 1. Email Service Providers
**Recommended Options:**
- **Gmail**: Free, reliable, good for testing
- **SendGrid**: Professional, high volume
- **Mailgun**: Developer-friendly
- **Amazon SES**: Cost-effective for large scale

### 2. Cron Jobs for Digests
Set up automated digest sending:

```bash
# Daily digest at 8 AM
0 8 * * * curl -X POST https://yoursite.com/api/cron/digest -H "Authorization: Bearer YOUR_CRON_SECRET" -d '{"action": "auto"}'

# Weekly digest on Monday at 9 AM  
0 9 * * 1 curl -X POST https://yoursite.com/api/cron/digest -H "Authorization: Bearer YOUR_CRON_SECRET" -d '{"action": "digest", "frequency": "WEEKLY"}'

# Monthly digest on 1st at 10 AM
0 10 1 * * curl -X POST https://yoursite.com/api/cron/digest -H "Authorization: Bearer YOUR_CRON_SECRET" -d '{"action": "digest", "frequency": "MONTHLY"}'
```

### 3. Email Authentication (Recommended)
Configure SPF, DKIM, and DMARC records for better deliverability:
- **SPF**: Add to DNS TXT record
- **DKIM**: Configure with your email provider
- **DMARC**: Set policy for handling failures

## 🛠️ Customization

### Modify Email Templates
Edit templates in `lib/email-service.ts`:
- Update HTML structure
- Change styling
- Add custom fields
- Modify subject lines

### Add New Notification Types
1. Add to `NotificationType` enum in `schema.prisma`
2. Add template in `getEmailTemplate()` function
3. Add preference field to user model
4. Create trigger in relevant API endpoint

### Custom Styling
Templates use inline CSS for maximum compatibility:
- Colors: Modify in template functions
- Fonts: Use web-safe fonts
- Layout: Responsive table-based design

## 📞 Support

### Common Issues
1. **Emails not sending**: Check SMTP credentials and network
2. **Emails in spam**: Configure email authentication
3. **Template issues**: Test with different email clients
4. **Performance**: Implement email queue for high volume

### Debug Commands
```bash
# Check database migration
npx prisma db push

# Regenerate Prisma client
npx prisma generate

# Test API endpoint
curl -X GET http://localhost:3000/api/test/email
```

## 🎊 Success!

Your forum now has a professional email notification system that will:
- ✅ Keep users engaged with timely notifications
- ✅ Provide activity summaries through digests  
- ✅ Respect user preferences and privacy
- ✅ Scale with your growing community
- ✅ Maintain professional branding

Users can manage their preferences, test the system, and receive beautiful HTML emails for all forum activities!
