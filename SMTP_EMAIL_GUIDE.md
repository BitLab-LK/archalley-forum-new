# SMTP Email Configuration Guide

## Overview
This document explains how the SMTP email notification system works in the Archalley Forum application.

## Configuration Details

### Current SMTP Settings
```env
SMTP_HOST="outlook.office365.com"
SMTP_PORT=587
SMTP_USER="alert@archalley.com"
SMTP_PASSWORD="rkwdhmhfmzgjvtjy"
EMAIL_FROM="alert@archalley.com"
EMAIL_FROM_NAME="Archalley Forum"
```

### What Each Setting Does

1. **SMTP_HOST**: `outlook.office365.com`
   - This is Microsoft's Office 365 SMTP server
   - Used for sending emails through Microsoft's email infrastructure
   - Reliable and professional email delivery service

2. **SMTP_PORT**: `587`
   - Standard port for SMTP with STARTTLS encryption
   - Secure connection that starts as plain text and upgrades to encrypted
   - Alternative to port 25 (unencrypted) and 465 (SSL/TLS)

3. **SMTP_USER**: `alert@archalley.com`
   - The email account used to authenticate with the SMTP server
   - This is your company's email address for sending notifications

4. **SMTP_PASSWORD**: `rkwdhmhfmzgjvtjy`
   - App-specific password for the alert@archalley.com account
   - **Security Note**: This should be an App Password, not the regular email password
   - App passwords are more secure for automated systems

5. **EMAIL_FROM**: `alert@archalley.com`
   - The "From" address that appears in recipient's inbox
   - Should match or be authorized by the SMTP_USER account

6. **EMAIL_FROM_NAME**: `Archalley Forum`
   - The friendly name that appears alongside the email address
   - Recipients will see "Archalley Forum <alert@archalley.com>"

## How It Works

### Email Notification Flow
1. **Trigger Event**: User likes a post, comments, or replies
2. **Database Notification**: System creates a notification record in the database
3. **Email Preparation**: System generates HTML email template with professional styling
4. **SMTP Connection**: Application connects to outlook.office365.com:587
5. **Authentication**: Logs in using alert@archalley.com credentials
6. **Email Sending**: Sends formatted email to the recipient
7. **Logging**: Records success/failure for debugging

### Email Types Sent
- **Post Likes**: "Someone liked your post" notifications
- **Comments**: "Someone commented on your post" notifications
- **Replies**: "Someone replied to your comment" notifications
- **Mentions**: "@username" mention notifications

### Professional Email Templates
The system uses LinkedIn-style professional email templates with:
- Clean, modern design
- Company branding (Archalley Forum)
- Responsive layout for mobile devices
- Clear call-to-action buttons
- Proper email headers and formatting

## Security Best Practices

### App Password Setup
1. Go to Microsoft 365 Admin Center or Outlook Account Settings
2. Enable 2-Factor Authentication on alert@archalley.com
3. Generate an App Password specifically for this application
4. Use the App Password (not regular password) in SMTP_PASSWORD

### Environment Variables
- Never commit actual passwords to version control
- Use `.env` files for local development
- Use secure environment variable storage in production
- Rotate passwords regularly

## Testing Email Configuration

### Quick Test
You can test the email configuration by:
1. Starting the development server
2. Creating a test post
3. Liking the post from another account
4. Check if the notification email is received

### Debug Email Issues
If emails aren't working, check:
1. SMTP credentials are correct
2. App password is properly configured
3. Office 365 account has sending permissions
4. Firewall/network allows outbound SMTP traffic
5. Check application logs for SMTP errors

### Email Service File
The email logic is handled in `/lib/email-service.ts` which:
- Connects to SMTP server
- Formats email templates
- Handles email sending with error handling
- Logs email delivery status

## Production Considerations

### Rate Limiting
- Office 365 has sending limits (typically 10,000 emails/day)
- Application includes rate limiting to prevent spam
- Consider queuing system for high-volume applications

### Monitoring
- Monitor email delivery rates
- Set up alerts for SMTP failures
- Track bounce rates and spam complaints
- Log email activity for compliance

### Backup Email Service
Consider configuring a backup email service (like Resend) in case of SMTP issues:
```env
RESEND_API_KEY="your-resend-api-key"
```

## Troubleshooting Common Issues

### Authentication Errors
- Verify App Password is correct
- Ensure 2FA is enabled on the account
- Check if account is locked or suspended

### Connection Timeouts
- Verify SMTP_HOST and SMTP_PORT
- Check network connectivity
- Ensure firewall allows SMTP traffic

### Emails Going to Spam
- Set up proper SPF/DKIM records for archalley.com
- Use consistent "From" name and address
- Avoid spam trigger words in email content

### Rate Limiting
- Monitor sending frequency
- Implement exponential backoff for retries
- Consider using email queues for bulk notifications

## Email Templates

The system includes professional templates for:
- Post like notifications
- Comment notifications  
- Reply notifications
- Mention notifications

All templates are:
- Mobile-responsive
- Professionally styled
- Include proper unsubscribe links
- Follow email best practices

This configuration ensures reliable, professional email notifications for your Archalley Forum users.
