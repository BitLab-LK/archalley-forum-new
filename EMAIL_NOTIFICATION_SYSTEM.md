# Email Notification System Documentation

## Overview
A comprehensive email notification system has been implemented for the forum, providing real-time email alerts for various user activities and periodic digest emails.

## Features Implemented

### 📧 Real-time Email Notifications
- **Post Comments**: Email when someone comments on your posts
- **Post Likes**: Email when someone likes your posts 
- **Comment Replies**: Email when someone replies to your comments
- **Mentions**: Email when someone mentions you (@username)
- **Best Answer**: Email when your comment is marked as best answer
- **System Notifications**: Important announcements and updates

### 📊 Email Digest System
- **Daily Digest**: Summary of yesterday's activity
- **Weekly Digest**: Summary of the past week's activity  
- **Monthly Digest**: Summary of the past month's activity
- **Customizable**: Users can choose their preferred frequency or disable

### 🎛️ User Preferences
- **Master Toggle**: Enable/disable all email notifications
- **Individual Controls**: Fine-grained control over each notification type
- **Email Verification**: Only send to verified email addresses
- **Preference Management**: Easy-to-use settings page

## Technical Implementation

### Database Schema Updates
- Added email notification preferences to `users` table:
  - `emailNotifications`: Global toggle
  - `notifyOnComment`, `notifyOnLike`, `notifyOnMention`, `notifyOnReply`: Activity-specific toggles
  - `notifyOnNewPost`, `notifyOnSystem`: Additional notification types
  - `emailDigest`: Digest frequency preference

- Added `EmailLogs` table for tracking sent emails:
  - Email delivery status and error tracking
  - Metadata for debugging and analytics
  - Prevention of duplicate emails

- Extended `NotificationType` enum with new types:
  - `EMAIL_VERIFICATION`, `NEW_POST_IN_CATEGORY`, `NEW_FOLLOWER`

### Core Services

#### Email Service (`lib/email-service.ts`)
- **SMTP Integration**: Supports Gmail, Outlook, and custom SMTP servers
- **Template System**: HTML and text email templates for each notification type
- **Preference Checking**: Respects user preferences before sending
- **Error Handling**: Comprehensive logging and error recovery
- **Rate Limiting**: Prevents email spam

#### Digest Service (`lib/email-digest-service.ts`)
- **Activity Aggregation**: Summarizes user activity over specified periods
- **Smart Templates**: Dynamic content based on activity levels
- **Batch Processing**: Efficient bulk email sending
- **Cron Integration**: Automated periodic sending

### API Endpoints

#### Email Notifications (`/api/notifications/email`)
- `POST`: Send individual notification emails
- `PUT`: Send mention notifications by parsing content

#### User Preferences (`/api/users/preferences/email`)
- `GET`: Fetch user's email preferences
- `PUT`: Update user's email preferences

#### Test Email (`/api/test/email`)
- `POST`: Send test email to verify configuration

#### Cron Jobs (`/api/cron/digest`)
- `POST`: Trigger digest emails (manual or automatic)
- `GET`: API documentation

### Frontend Components

#### Email Preferences Page (`/profile/email-preferences`)
- **Intuitive UI**: Toggle switches for easy preference management
- **Live Preview**: Test email functionality
- **Responsive Design**: Works on all devices
- **Real-time Validation**: Immediate feedback on changes

## Integration Points

### Post Creation
- Automatically sends mention notifications when posts contain @username
- Triggers notifications for followed categories (if implemented)

### Comment System
- Notifies post authors of new comments
- Notifies parent comment authors of replies
- Processes mentions in comment content

### Voting System
- Sends like notifications when posts receive upvotes
- Respects user preferences and self-vote exclusions

### User Settings
- Integrated with profile edit page
- Easy navigation between settings sections

## Configuration

### Environment Variables Required
```env
# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"
EMAIL_FROM_NAME="Forum Notifications"

# Security
CRON_SECRET="your-secure-cron-secret-key"
```

### Gmail Setup Instructions
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password: Google Account → Security → App passwords
3. Use the App Password as `SMTP_PASSWORD`
4. Set `SMTP_USER` to your Gmail address

## Usage Examples

### Manual Testing
```bash
# Test email service
curl -X POST http://localhost:3000/api/test/email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Send daily digest
curl -X POST http://localhost:3000/api/cron/digest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -d '{"action": "digest", "frequency": "DAILY"}'
```

### Cron Job Setup (Production)
```bash
# Daily at 8 AM
0 8 * * * curl -X POST https://yoursite.com/api/cron/digest -H "Authorization: Bearer YOUR_CRON_SECRET" -d '{"action": "auto"}'
```

## Email Templates

### Notification Types
- **Post Like**: "👍 Someone liked your post!"
- **Post Comment**: "💬 New comment on your post!"
- **Comment Reply**: "💭 Someone replied to your comment!"
- **Mention**: "📢 You were mentioned!"
- **Best Answer**: "🏆 Congratulations! Your comment was marked as the best answer!"

### Digest Templates
- **Activity Summary**: Overview of posts, comments, likes, mentions
- **Activity Details**: Specific examples with post titles
- **Call-to-Action**: Links back to the forum
- **Unsubscribe**: Easy preference management

## Performance Considerations

### Optimization Strategies
- **Batch Processing**: Group similar notifications
- **Async Processing**: Non-blocking email sending
- **Error Recovery**: Retry failed emails with exponential backoff
- **Database Indexing**: Optimized queries for preference checking

### Monitoring
- **Email Logs**: Track delivery status and errors
- **Performance Metrics**: Response times and success rates
- **User Feedback**: Preference analytics and engagement

## Future Enhancements

### Planned Features
- **Category Following**: Notifications for new posts in followed categories
- **User Following**: Notifications for activity from followed users
- **Email Templates**: User-customizable templates
- **Advanced Filtering**: Smart notification grouping
- **Mobile Push**: Integration with mobile app notifications

### Scalability
- **Redis Queue**: For high-volume email processing
- **Microservice**: Dedicated email service
- **Analytics**: Detailed engagement tracking
- **A/B Testing**: Template optimization

## Troubleshooting

### Common Issues
1. **Emails not sending**: Check SMTP credentials and network connectivity
2. **Emails in spam**: Configure SPF, DKIM, and DMARC records
3. **High bounce rate**: Verify email addresses and list hygiene
4. **Performance issues**: Implement email queuing and batch processing

### Debug Commands
```bash
# Check email logs
SELECT * FROM "EmailLogs" WHERE status = 'FAILED' ORDER BY "createdAt" DESC;

# Check user preferences
SELECT "emailNotifications", "notifyOnComment" FROM users WHERE email = 'user@example.com';
```

## Security Considerations

### Data Protection
- **Email Validation**: Only send to verified addresses
- **Preference Respect**: Honor user unsubscribe requests
- **Rate Limiting**: Prevent spam and abuse
- **Secure Storage**: Encrypted email logs and credentials

### Privacy Compliance
- **GDPR Compliance**: Right to be forgotten implementation
- **Opt-in Required**: Explicit consent for marketing emails
- **Data Minimization**: Store only necessary email metadata
- **Audit Trail**: Complete notification history

## Summary

The email notification system provides a comprehensive solution for keeping users engaged with the forum through timely, relevant email communications. The system is built with scalability, user preferences, and performance in mind, ensuring a positive experience for both users and administrators.

Key benefits:
- ✅ **Real-time notifications** for important activities
- ✅ **Customizable preferences** for user control
- ✅ **Periodic digests** for activity summaries
- ✅ **Professional templates** for consistent branding
- ✅ **Comprehensive logging** for monitoring and debugging
- ✅ **Scalable architecture** for future growth
