import { prisma } from './prisma';
import { NotificationType, EmailStatus } from '@prisma/client';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';


// Utility function to get time ago string
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

// Email validation function
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Configuration validation
const validateEmailConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!process.env.SMTP_HOST) errors.push('SMTP_HOST is required');
  if (!process.env.SMTP_PORT) errors.push('SMTP_PORT is required');
  if (!process.env.SMTP_USER) errors.push('SMTP_USER is required');
  if (!process.env.SMTP_PASSWORD) errors.push('SMTP_PASSWORD is required');
  if (!process.env.EMAIL_FROM) errors.push('EMAIL_FROM is required');
  
  if (process.env.EMAIL_FROM && !isValidEmail(process.env.EMAIL_FROM)) {
    errors.push('EMAIL_FROM must be a valid email address');
  }
  
  return { isValid: errors.length === 0, errors };
};

// Create transporter with retry logic and error handling
let transporter: nodemailer.Transporter | null = null;
let transporterError: string | null = null;

// Initialize Resend as fallback
let resend: Resend | null = null;
let resendError: string | null = null;

const createResendClient = (): Resend | null => {
  try {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your-resend-api-key') {
      resendError = 'Resend API key not configured';
      return null;
    }
    
    const client = new Resend(process.env.RESEND_API_KEY);
    resendError = null;
    console.log('✅ Resend client initialized successfully');
    return client;
  } catch (error) {
    resendError = error instanceof Error ? error.message : 'Unknown Resend error';
    console.error('❌ Failed to initialize Resend:', resendError);
    return null;
  }
};

// Send email via Resend API (HTTP-based, works when SMTP is blocked)
const sendEmailViaResend = async (
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> => {
  try {
    // Check if Resend is configured (but send emails even in development mode)
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your-resend-api-key') {
      console.log(`📧 [EMAIL DEBUG] Resend API key not configured - Email that would be sent:`);
      console.log(`📧 [EMAIL DEBUG] To: ${to}`);
      console.log(`📧 [EMAIL DEBUG] Subject: ${subject}`);
      console.log(`📧 [EMAIL DEBUG] Text: ${text}`);
      console.log(`📧 [EMAIL DEBUG] HTML Length: ${html.length} characters`);
      console.log(`⚠️ [EMAIL DEBUG] Email NOT sent - Resend API key not configured`);
      return false;
    }

    if (!resend) {
      resend = createResendClient();
    }
    
    if (!resend) {
      console.error('❌ [EMAIL DEBUG] Resend client not available:', resendError);
      console.log(`📧 [EMAIL DEBUG] FALLBACK - Email that would be sent:`);
      console.log(`📧 [EMAIL DEBUG] To: ${to}, Subject: ${subject}`);
      return false;
    }

    console.log(`📧 [EMAIL DEBUG] Sending email via Resend to ${to}`);
    
    const result = await resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME || 'Archalley'} <${process.env.EMAIL_FROM || 'noreply@archalley.com'}>`,
      to: [to],
      subject,
      html,
      text
    });

    if (result.error) {
      console.error('❌ [EMAIL DEBUG] Resend API error:', result.error);
      return false;
    }

    console.log(`✅ [EMAIL DEBUG] Email sent via Resend successfully. ID: ${result.data?.id}`);
    return true;

  } catch (error) {
    console.error('❌ [EMAIL DEBUG] Resend send failed:', error);
    console.log(`📧 [EMAIL DEBUG] FINAL FALLBACK - Email could not be sent: To: ${to}, Subject: ${subject}`);
    return false;
  }
};

const createEmailTransporter = async (): Promise<nodemailer.Transporter | null> => {
  try {
    const config = validateEmailConfig();
    if (!config.isValid) {
      transporterError = `Email configuration invalid: ${config.errors.join(', ')}`;
      console.error('❌ Email service configuration error:', transporterError);
      return null;
    }

    const newTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT!, 10),
      secure: false, // true for 465, false for other ports like 587
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASSWORD!,
      },
      pool: true, // Enable connection pooling
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 10, // Max 10 messages per second
      connectionTimeout: 60000, // 60 second connection timeout
      greetingTimeout: 30000, // 30 second greeting timeout
      socketTimeout: 60000, // 60 second socket timeout
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    });

    // Test the connection
    await newTransporter.verify();
    console.log('✅ Email service connected successfully');
    transporterError = null;
    return newTransporter;
    
  } catch (error) {
    transporterError = error instanceof Error ? error.message : 'Unknown SMTP error';
    console.error('❌ Email service connection failed:', transporterError);
    return null;
  }
};

// Initialize transporter
const initializeTransporter = async () => {
  if (!transporter && !transporterError) {
    transporter = await createEmailTransporter();
  }
};

// Get transporter with lazy initialization
const getTransporter = async (): Promise<nodemailer.Transporter | null> => {
  if (!transporter) {
    await initializeTransporter();
  }
  return transporter;
};

// Initialize email service on startup
export const initializeEmailService = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔄 Initializing email service...');
    const emailTransporter = await createEmailTransporter();
    
    if (emailTransporter) {
      transporter = emailTransporter;
      console.log('✅ Email service initialized successfully');
      return { success: true };
    } else {
      return { success: false, error: transporterError || 'Unknown error' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to initialize email service:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

// Get email service status
export const getEmailServiceStatus = (): { 
  isInitialized: boolean; 
  error: string | null; 
  config: Record<string, any> 
} => {
  const config = validateEmailConfig();
  return {
    isInitialized: transporter !== null,
    error: transporterError,
    config: {
      isValid: config.isValid,
      errors: config.errors,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 5) + '***' : 'Not set',
      from: process.env.EMAIL_FROM
    }
  };
};

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailData {
  userEmail: string;
  userName: string;
  postContent?: string;
  commentContent?: string;
  authorName?: string;
  authorAvatar?: string;
  postUrl?: string;
  siteUrl: string;
  postPreview?: string;
  category?: string;
  timeAgo?: string;
}

// Email templates
export const getEmailTemplate = (type: NotificationType, data: EmailData): EmailTemplate => {
  const { userName, authorName, authorAvatar, postUrl, siteUrl, commentContent, postPreview, category, timeAgo } = data;

  const templates: Record<NotificationType, EmailTemplate> = {
    POST_LIKE: {
      subject: `${authorName} liked your post`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${authorName} liked your post</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f7f7f7;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0077b5 0%, #005885 100%); padding: 30px; text-align: center;">
                      <div style="width: 80px; height: 80px; border-radius: 50%; background: #ffffff; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                        ${authorAvatar ? `
                          <img src="${authorAvatar}" alt="${authorName}" style="width: 76px; height: 76px; border-radius: 50%; object-fit: cover;">
                        ` : `
                          <span style="color: #0077b5; font-weight: bold; font-size: 32px;">${(authorName || 'U').charAt(0).toUpperCase()}</span>
                        `}
                      </div>
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                        ${authorName} liked your post
                      </h1>
                      <p style="margin: 8px 0 0 0; color: #e6f4ff; font-size: 16px; opacity: 0.9;">
                        ${timeAgo || 'Just now'} • Great content gets recognition
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 32px;">
                      
                      <!-- Post Preview Card -->
                      ${postPreview && postPreview.length > 10 ? `
                      <div style="
                        margin: 24px 0; 
                        border: 2px solid #e9ecef; 
                        border-radius: 12px; 
                        padding: 20px; 
                        background: #ffffff;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        text-align: left;
                      ">
                        <div style="display: flex; align-items: flex-start; gap: 12px;">
                          <div style="
                            width: 4px; 
                            height: 40px; 
                            background: linear-gradient(135deg, #0077b5 0%, #005885 100%); 
                            border-radius: 2px; 
                            flex-shrink: 0;
                          "></div>
                          <div style="flex: 1;">
                            ${postPreview && postPreview.length > 10 ? `
                            <p style="
                              margin: 0; 
                              color: #6b7280; 
                              font-size: 14px; 
                              line-height: 1.5;
                              overflow: hidden;
                              display: -webkit-box;
                              -webkit-line-clamp: 3;
                              -webkit-box-orient: vertical;
                            ">
                              ${postPreview.length > 120 ? postPreview.substring(0, 120) + '…' : postPreview}
                            </p>
                            ` : ''}
                            ${category ? `
                            <div style="margin-top: 12px;">
                              <span style="background: #e7f3ff; color: #0077b5; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                                ${category}
                              </span>
                            </div>
                            ` : ''}
                          </div>
                        </div>
                      </div>
                      ` : ''}
                      
                      <!-- Call to Action -->
                      <div style="text-align: center; margin-bottom: 24px;">
                        <a href="${postUrl}" style="
                          display: inline-block;
                          background: linear-gradient(135deg, #0077b5 0%, #005885 100%);
                          color: #ffffff;
                          text-decoration: none;
                          padding: 16px 40px;
                          border-radius: 8px;
                          font-weight: 600;
                          font-size: 16px;
                          transition: all 0.3s ease;
                          box-shadow: 0 4px 16px rgba(0,119,181,0.3);
                        ">
                          View Post & Respond
                        </a>
                      </div>
                      
                      <!-- Engagement Encouragement -->
                      <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
                        <p style="margin: 0; color: #495057; font-size: 15px; font-weight: 500;">
                          Keep creating great content to engage your community!
                        </p>
                      </div>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background: #f8f9fa; padding: 24px; border-top: 1px solid #e1e5e9;">
                      <table role="presentation" style="width: 100%;">
                        <tr>
                          <td style="text-align: center;">
                            <p style="margin: 0 0 8px 0; color: #666; font-size: 12px;">
                              You received this email because you have notifications enabled.
                            </p>
                            <p style="margin: 0;">
                              <a href="${siteUrl}/profile/email-preferences" style="color: #0077b5; text-decoration: none; font-size: 12px; font-weight: 500;">
                                Manage email preferences
                              </a>
                              <span style="color: #ccc; margin: 0 8px;">|</span>
                              <a href="${siteUrl}" style="color: #0077b5; text-decoration: none; font-size: 12px; font-weight: 500;">
                                Visit Forum
                              </a>
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `${authorName} liked your post${postPreview && postPreview.length > 10 ? `\n\n"${postPreview}${postPreview.length > 100 ? '...' : ''}"` : ''}. View your post: ${postUrl}`
    },

    POST_COMMENT: {
      subject: `${authorName} commented on your post`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New comment on your post</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f7f7f7;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%); padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                         New comment on your post!
                      </h1>
                      <p style="margin: 8px 0 0 0; color: #e6f4ff; font-size: 16px; opacity: 0.9;">
                        Someone engaged with your content
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 32px;">
                      
                      <!-- Activity Summary -->
                      <div style="text-align: center; margin-bottom: 24px;">
                        <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #28a745, #1e7e34); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                          ${authorAvatar ? `
                            <img src="${authorAvatar}" alt="${authorName}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">
                          ` : `
                            <span style="color: white; font-weight: bold; font-size: 24px;">${(authorName || 'U').charAt(0).toUpperCase()}</span>
                          `}
                        </div>
                        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">
                          <strong>${authorName}</strong> commented on your post
                        </p>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">
                          ${timeAgo || 'Just now'}
                        </p>
                      </div>
                      
                      <!-- Comment Content -->
                      ${commentContent ? `
                      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
                        <p style="margin: 0; color: #555; font-size: 16px; line-height: 1.5; font-style: italic;">
                          "${commentContent}"
                        </p>
                      </div>
                      ` : ''}
                      
                      <!-- Post Preview Card -->
                      ${postPreview && postPreview.length > 10 ? `
                      <div style="
                        margin: 24px 0; 
                        border: 2px solid #e9ecef; 
                        border-radius: 12px; 
                        padding: 20px; 
                        background: #ffffff;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        text-align: left;
                      ">
                        <div style="display: flex; align-items: flex-start; gap: 12px;">
                          <div style="
                            width: 4px; 
                            height: 40px; 
                            background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%); 
                            border-radius: 2px; 
                            flex-shrink: 0;
                          "></div>
                          <div style="flex: 1;">
                            ${postPreview && postPreview.length > 10 ? `
                            <p style="
                              margin: 0; 
                              color: #6b7280; 
                              font-size: 14px; 
                              line-height: 1.5;
                              overflow: hidden;
                              display: -webkit-box;
                              -webkit-line-clamp: 3;
                              -webkit-box-orient: vertical;
                            ">
                              ${postPreview.length > 120 ? postPreview.substring(0, 120) + '…' : postPreview}
                            </p>
                            ` : ''}
                          </div>
                        </div>
                      </div>
                      ` : ''}
                      
                      <!-- Call to Action -->
                      <div style="text-align: center; margin-bottom: 24px;">
                        <a href="${postUrl}" style="
                          display: inline-block;
                          background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
                          color: #ffffff;
                          text-decoration: none;
                          padding: 14px 32px;
                          border-radius: 6px;
                          font-weight: 600;
                          font-size: 16px;
                          transition: all 0.3s ease;
                          box-shadow: 0 2px 8px rgba(40,167,69,0.3);
                        ">
                          Reply to Comment
                        </a>
                      </div>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background: #f8f9fa; padding: 24px; border-top: 1px solid #e1e5e9;">
                      <table role="presentation" style="width: 100%;">
                        <tr>
                          <td style="text-align: center;">
                            <p style="margin: 0 0 8px 0; color: #666; font-size: 12px;">
                              You received this email because you have notifications enabled.
                            </p>
                            <p style="margin: 0;">
                              <a href="${siteUrl}/profile/email-preferences" style="color: #28a745; text-decoration: none; font-size: 12px;">
                                Manage email preferences
                              </a>
                              <span style="color: #ccc; margin: 0 8px;">|</span>
                              <a href="${siteUrl}" style="color: #28a745; text-decoration: none; font-size: 12px;">
                                Visit Forum
                              </a>
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Hi ${userName}, ${authorName} commented on your post: "${commentContent}". Reply: ${postUrl}`
    },

    COMMENT_REPLY: {
      subject: `${authorName} replied to your comment`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Someone replied to your comment</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f7f7f7;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #6f42c1 0%, #5a2d91 100%); padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                         Someone replied to your comment!
                      </h1>
                      <p style="margin: 8px 0 0 0; color: #e6f4ff; font-size: 16px; opacity: 0.9;">
                        The conversation continues
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 32px;">
                      
                      <!-- Activity Summary -->
                      <div style="text-align: center; margin-bottom: 24px;">
                        <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #6f42c1, #5a2d91); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                          ${authorAvatar ? `
                            <img src="${authorAvatar}" alt="${authorName}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">
                          ` : `
                            <span style="color: white; font-weight: bold; font-size: 24px;">${(authorName || 'U').charAt(0).toUpperCase()}</span>
                          `}
                        </div>
                        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">
                          <strong>${authorName}</strong> replied to your comment
                        </p>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">
                          ${timeAgo || 'Just now'}
                        </p>
                      </div>
                      
                      <!-- Reply Content -->
                      ${commentContent ? `
                      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
                        <p style="margin: 0; color: #555; font-size: 16px; line-height: 1.5; font-style: italic;">
                          "${commentContent}"
                        </p>
                      </div>
                      ` : ''}
                      
                      <!-- Post Preview Card -->
                      ${postPreview && postPreview.length > 10 ? `
                      <div style="
                        margin: 24px 0; 
                        border: 2px solid #e9ecef; 
                        border-radius: 12px; 
                        padding: 20px; 
                        background: #ffffff;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        text-align: left;
                      ">
                        <div style="display: flex; align-items: flex-start; gap: 12px;">
                          <div style="
                            width: 4px; 
                            height: 40px; 
                            background: linear-gradient(135deg, #6f42c1 0%, #5a2d91 100%); 
                            border-radius: 2px; 
                            flex-shrink: 0;
                          "></div>
                          <div style="flex: 1;">
                            ${postPreview && postPreview.length > 10 ? `
                            <p style="
                              margin: 0; 
                              color: #6b7280; 
                              font-size: 14px; 
                              line-height: 1.5;
                              overflow: hidden;
                              display: -webkit-box;
                              -webkit-line-clamp: 3;
                              -webkit-box-orient: vertical;
                            ">
                              ${postPreview.length > 120 ? postPreview.substring(0, 120) + '…' : postPreview}
                            </p>
                            ` : ''}
                          </div>
                        </div>
                      </div>
                      ` : ''}
                      
                      <!-- Call to Action -->
                      <div style="text-align: center; margin-bottom: 24px;">
                        <a href="${postUrl}" style="
                          display: inline-block;
                          background: linear-gradient(135deg, #6f42c1 0%, #5a2d91 100%);
                          color: #ffffff;
                          text-decoration: none;
                          padding: 14px 32px;
                          border-radius: 6px;
                          font-weight: 600;
                          font-size: 16px;
                          transition: all 0.3s ease;
                          box-shadow: 0 2px 8px rgba(111,66,193,0.3);
                        ">
                          View Conversation
                        </a>
                      </div>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background: #f8f9fa; padding: 24px; border-top: 1px solid #e1e5e9;">
                      <table role="presentation" style="width: 100%;">
                        <tr>
                          <td style="text-align: center;">
                            <p style="margin: 0 0 8px 0; color: #666; font-size: 12px;">
                              You received this email because you have notifications enabled.
                            </p>
                            <p style="margin: 0;">
                              <a href="${siteUrl}/profile/email-preferences" style="color: #6f42c1; text-decoration: none; font-size: 12px;">
                                Manage email preferences
                              </a>
                              <span style="color: #ccc; margin: 0 8px;">|</span>
                              <a href="${siteUrl}" style="color: #6f42c1; text-decoration: none; font-size: 12px;">
                                Visit Forum
                              </a>
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Hi ${userName}, ${authorName} replied to your comment: "${commentContent}". View: ${postUrl}`
    },

    MENTION: {
      subject: `${authorName} mentioned you`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>You were mentioned</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f7f7f7;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                        📢 You were mentioned!
                      </h1>
                      <p style="margin: 8px 0 0 0; color: #fff3e0; font-size: 16px; opacity: 0.9;">
                        Someone wanted to get your attention
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 32px;">
                      
                      <!-- Activity Summary -->
                      <div style="text-align: center; margin-bottom: 24px;">
                        <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #ff6b35, #f7931e); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                          ${authorAvatar ? `
                            <img src="${authorAvatar}" alt="${authorName}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">
                          ` : `
                            <span style="color: white; font-weight: bold; font-size: 24px;">${(authorName || 'U').charAt(0).toUpperCase()}</span>
                          `}
                        </div>
                        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">
                          <strong>${authorName}</strong> mentioned you
                        </p>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">
                          ${timeAgo || 'Just now'}
                        </p>
                      </div>
                      
                      <!-- Mention Content -->
                      ${commentContent ? `
                      <div style="background: #fff5e6; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
                        <p style="margin: 0; color: #555; font-size: 16px; line-height: 1.5; font-style: italic;">
                          "${commentContent}"
                        </p>
                      </div>
                      ` : ''}
                      
                      <!-- Post Context -->
                      ${postPreview && postPreview.length > 10 ? `
                      <div style="text-align: center; margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
                        ${postPreview && postPreview.length > 10 ? `
                        <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">
                          ${postPreview}${postPreview.length > 100 ? '...' : ''}
                        </p>
                        ` : ''}
                      </div>
                      ` : ''}
                      
                      <!-- Call to Action -->
                      <div style="text-align: center; margin-bottom: 24px;">
                        <a href="${postUrl}" style="
                          display: inline-block;
                          background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
                          color: #ffffff;
                          text-decoration: none;
                          padding: 14px 32px;
                          border-radius: 6px;
                          font-weight: 600;
                          font-size: 16px;
                          transition: all 0.3s ease;
                          box-shadow: 0 2px 8px rgba(255,107,53,0.3);
                        ">
                          View Post
                        </a>
                      </div>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background: #f8f9fa; padding: 24px; border-top: 1px solid #e1e5e9;">
                      <table role="presentation" style="width: 100%;">
                        <tr>
                          <td style="text-align: center;">
                            <p style="margin: 0 0 8px 0; color: #666; font-size: 12px;">
                              You received this email because you have notifications enabled.
                            </p>
                            <p style="margin: 0;">
                              <a href="${siteUrl}/profile/email-preferences" style="color: #ff6b35; text-decoration: none; font-size: 12px;">
                                Manage email preferences
                              </a>
                              <span style="color: #ccc; margin: 0 8px;">|</span>
                              <a href="${siteUrl}" style="color: #ff6b35; text-decoration: none; font-size: 12px;">
                                Visit Forum
                              </a>
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `Hi ${userName}, ${authorName} mentioned you: "${commentContent}". View: ${postUrl}`
    },

    BEST_ANSWER: {
      subject: `Your comment was marked as the best answer!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Congratulations! 🏆</h2>
          <p>Hi ${userName},</p>
          <p>Your comment was marked as the best answer!</p>
          <div style="margin: 20px 0;">
            <a href="${postUrl}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Your Answer</a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            You received this email because you have notifications enabled. 
            <a href="${siteUrl}/profile/edit">Update your preferences</a>
          </p>
        </div>
      `,
      text: `Hi ${userName}, your comment was marked as the best answer! View: ${postUrl}`
    },

    SYSTEM: {
      subject: `System Notification`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">System Notification 🔔</h2>
          <p>Hi ${userName},</p>
          <p>${commentContent}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            You received this email because you have system notifications enabled. 
            <a href="${siteUrl}/profile/edit">Update your preferences</a>
          </p>
        </div>
      `,
      text: `Hi ${userName}, ${commentContent}`
    },

    EMAIL_VERIFICATION: {
      subject: `Verify your email address`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verify your email address 📧</h2>
          <p>Hi ${userName},</p>
          <p>Please verify your email address to receive notifications and secure your account.</p>
          <div style="margin: 20px 0;">
            <a href="${postUrl}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
          </div>
          <p style="color: #666; font-size: 12px;">
            If you didn't create this account, you can safely ignore this email.
          </p>
        </div>
      `,
      text: `Hi ${userName}, please verify your email address: ${postUrl}`
    },

    NEW_POST_IN_CATEGORY: {
      subject: `New post in category you follow`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New post in your followed category! 📝</h2>
          <p>Hi ${userName},</p>
          <p><strong>${authorName}</strong> posted in a category you follow.</p>
          <div style="margin: 20px 0;">
            <a href="${postUrl}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Read Post</a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            You received this email because you follow this category. 
            <a href="${siteUrl}/profile/edit">Update your preferences</a>
          </p>
        </div>
      `,
      text: `Hi ${userName}, ${authorName} posted in a category you follow. Read: ${postUrl}`
    },

    NEW_FOLLOWER: {
      subject: `${authorName} started following you`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You have a new follower! 👥</h2>
          <p>Hi ${userName},</p>
          <p><strong>${authorName}</strong> started following you.</p>
          <div style="margin: 20px 0;">
            <a href="${postUrl}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Profile</a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            You received this email because you have notifications enabled. 
            <a href="${siteUrl}/profile/edit">Update your preferences</a>
          </p>
        </div>
      `,
      text: `Hi ${userName}, ${authorName} started following you. View profile: ${postUrl}`
    },

    MODERATION_ACTION: {
      subject: `Moderation action taken on your content`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Moderation Notice 🛡️</h2>
          <p>Hi ${userName},</p>
          <p>A moderator has taken action on your content: ${commentContent}</p>
          ${postUrl ? `
          <div style="margin: 20px 0;">
            <a href="${postUrl}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a>
          </div>
          ` : ''}
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            You received this email because moderation action was taken on your content. 
            <a href="${siteUrl}/community-guidelines">Review Community Guidelines</a>
          </p>
        </div>
      `,
      text: `Hi ${userName}, a moderator has taken action on your content: ${commentContent}. ${postUrl ? `View details: ${postUrl}` : ''}`
    }
  };

  return templates[type];
};

// Send verification email directly (for registration)
export const sendVerificationEmail = async (
  email: string,
  userName: string,
  token: string
): Promise<boolean> => {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    // Verification URL points to the verify page, which will use sessionStorage for callbackUrl
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`
    
    // Generate a 6-digit code from token (for display in email)
    const code = token.slice(0, 6).toUpperCase()
    
    const subject = 'Verify your email address'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Verify your email address 📧</h2>
        <p>Hi ${userName},</p>
        <p>Thank you for registering! Please verify your email address to complete your registration and access your account.</p>
        
        <div style="margin: 30px 0;">
          <p style="margin-bottom: 15px;"><strong>Verification Code:</strong></p>
          <div style="background: #f5f5f5; border: 2px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0066cc;">
            ${code}
          </div>
        </div>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${verificationUrl}" style="background: #0066cc; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email Address</a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Or copy and paste this link into your browser:<br/>
          <a href="${verificationUrl}" style="color: #0066cc; word-break: break-all;">${verificationUrl}</a>
        </p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This verification link will expire in 24 hours. If you didn't create this account, you can safely ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 11px;">
          If you're having trouble clicking the button, copy and paste the URL above into your web browser.
        </p>
      </div>
    `
    
    const text = `
Hi ${userName},

Thank you for registering! Please verify your email address to complete your registration.

Verification Code: ${code}

Verify your email by clicking this link:
${verificationUrl}

Or copy and paste the link into your browser.

This verification link will expire in 24 hours. If you didn't create this account, you can safely ignore this email.
    `.trim()

    // Get transporter
    const emailTransporter = await getTransporter()
    if (!emailTransporter) {
      console.error('❌ Email service not available for verification email')
      // Try Resend as fallback
      return await sendEmailViaResend(email, subject, html, text)
    }

    // Send email
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Archalley'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject,
      text,
      html,
    }

    try {
      await emailTransporter.sendMail(mailOptions)
      console.log(`✅ Verification email sent to ${email}`)
      
      // Also try Resend as backup
      await sendEmailViaResend(email, subject, html, text)
      
      return true
    } catch (error) {
      console.error('❌ Error sending verification email via SMTP:', error)
      // Fallback to Resend
      return await sendEmailViaResend(email, subject, html, text)
    }
  } catch (error) {
    console.error('❌ Error in sendVerificationEmail:', error)
    return false
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  userName: string,
  token: string
): Promise<boolean> => {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    // Password reset URL
    const resetUrl = `${baseUrl}/auth/reset-password?token=${encodeURIComponent(token)}`
    
    // Generate a 6-digit code from token (for display in email)
    const code = token.slice(0, 6).toUpperCase()
    
    const subject = 'Reset your password'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Reset your password 🔒</h2>
        <p>Hi ${userName},</p>
        <p>We received a request to reset your password. Click the button below to create a new password.</p>
        
        <div style="margin: 30px 0;">
          <p style="margin-bottom: 15px;"><strong>Reset Code:</strong></p>
          <div style="background: #f5f5f5; border: 2px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0066cc;">
            ${code}
          </div>
        </div>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetUrl}" style="background: #0066cc; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Or copy and paste this link into your browser:<br/>
          <a href="${resetUrl}" style="color: #0066cc; word-break: break-all;">${resetUrl}</a>
        </p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
        
        <p style="color: #d32f2f; font-size: 12px; margin-top: 20px; font-weight: bold;">
          ⚠️ If you didn't request this password reset, please contact support immediately.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 11px;">
          If you're having trouble clicking the button, copy and paste the URL above into your web browser.
        </p>
      </div>
    `
    
    const text = `
Hi ${userName},

We received a request to reset your password. Click the link below to create a new password.

Reset Code: ${code}

Reset your password by clicking this link:
${resetUrl}

Or copy and paste the link into your browser.

This reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.

⚠️ If you didn't request this password reset, please contact support immediately.
    `.trim()

    // Get transporter
    const emailTransporter = await getTransporter()
    if (!emailTransporter) {
      console.error('❌ Email service not available for password reset email')
      // Try Resend as fallback
      return await sendEmailViaResend(email, subject, html, text)
    }

    // Send email
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Archalley'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject,
      text,
      html,
    }

    try {
      await emailTransporter.sendMail(mailOptions)
      console.log(`✅ Password reset email sent to ${email}`)
      
      // Also try Resend as backup
      await sendEmailViaResend(email, subject, html, text)
      
      return true
    } catch (error) {
      console.error('❌ Error sending password reset email via SMTP:', error)
      // Fallback to Resend
      return await sendEmailViaResend(email, subject, html, text)
    }
  } catch (error) {
    console.error('❌ Error in sendPasswordResetEmail:', error)
    return false
  }
};

/**
 * Send login notification email
 */
export const sendLoginNotificationEmail = async (
  email: string,
  userName: string,
  loginDetails: {
    ipAddress?: string
    userAgent?: string
    location?: string
    timestamp: Date
  }
): Promise<boolean> => {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const subject = 'New login detected'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">New login detected 🔐</h2>
        <p>Hi ${userName},</p>
        <p>We detected a new login to your account. If this was you, you can safely ignore this email.</p>
        
        <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Login Details:</h3>
          <p style="margin: 8px 0;"><strong>Time:</strong> ${loginDetails.timestamp.toLocaleString()}</p>
          ${loginDetails.ipAddress ? `<p style="margin: 8px 0;"><strong>IP Address:</strong> ${loginDetails.ipAddress}</p>` : ''}
          ${loginDetails.location ? `<p style="margin: 8px 0;"><strong>Location:</strong> ${loginDetails.location}</p>` : ''}
          ${loginDetails.userAgent ? `<p style="margin: 8px 0;"><strong>Device:</strong> ${loginDetails.userAgent.substring(0, 100)}</p>` : ''}
        </div>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${baseUrl}/profile" style="background: #0066cc; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Account Settings</a>
        </div>
        
        <p style="color: #d32f2f; font-size: 12px; margin-top: 20px; font-weight: bold;">
          ⚠️ If you didn't log in, please secure your account immediately:
        </p>
        <ul style="color: #666; font-size: 12px;">
          <li>Change your password immediately</li>
          <li>Review your account settings</li>
          <li>Revoke any suspicious sessions</li>
          <li>Contact support if needed</li>
        </ul>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 11px;">
          This is an automated security notification. If you have any concerns, please contact support.
        </p>
      </div>
    `
    
    const text = `
Hi ${userName},

We detected a new login to your account. If this was you, you can safely ignore this email.

Login Details:
- Time: ${loginDetails.timestamp.toLocaleString()}
${loginDetails.ipAddress ? `- IP Address: ${loginDetails.ipAddress}` : ''}
${loginDetails.location ? `- Location: ${loginDetails.location}` : ''}
${loginDetails.userAgent ? `- Device: ${loginDetails.userAgent.substring(0, 100)}` : ''}

View your account: ${baseUrl}/profile

⚠️ If you didn't log in, please secure your account immediately:
- Change your password immediately
- Review your account settings
- Revoke any suspicious sessions
- Contact support if needed

This is an automated security notification. If you have any concerns, please contact support.
    `.trim()

    // Get transporter
    const emailTransporter = await getTransporter()
    if (!emailTransporter) {
      console.error('❌ Email service not available for login notification email')
      // Try Resend as fallback
      return await sendEmailViaResend(email, subject, html, text)
    }

    // Send email
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Archalley'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject,
      text,
      html,
    }

    try {
      await emailTransporter.sendMail(mailOptions)
      console.log(`✅ Login notification email sent to ${email}`)
      
      // Also try Resend as backup
      await sendEmailViaResend(email, subject, html, text)
      
      return true
    } catch (error) {
      console.error('❌ Error sending login notification email via SMTP:', error)
      // Fallback to Resend
      return await sendEmailViaResend(email, subject, html, text)
    }
  } catch (error) {
    console.error('❌ Error in sendLoginNotificationEmail:', error)
    return false
  }
};

/**
 * Send magic link email for passwordless login
 */
export const sendMagicLinkEmail = async (
  email: string,
  userName: string,
  token: string
): Promise<boolean> => {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    // Magic link URL
    const magicLinkUrl = `${baseUrl}/api/auth/verify-magic-link?token=${encodeURIComponent(token)}`
    
    // Generate a 6-digit code from token (for display in email)
    const code = token.slice(0, 6).toUpperCase()
    
    const subject = 'Your magic link to sign in'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Sign in with magic link ✨</h2>
        <p>Hi ${userName},</p>
        <p>Click the button below to sign in to your account. No password required!</p>
        
        <div style="margin: 30px 0;">
          <p style="margin-bottom: 15px;"><strong>Login Code:</strong></p>
          <div style="background: #f5f5f5; border: 2px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0066cc;">
            ${code}
          </div>
        </div>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${magicLinkUrl}" style="background: #0066cc; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Sign In</a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Or copy and paste this link into your browser:<br/>
          <a href="${magicLinkUrl}" style="color: #0066cc; word-break: break-all;">${magicLinkUrl}</a>
        </p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This magic link will expire in 15 minutes. If you didn't request this, you can safely ignore this email.
        </p>
        
        <p style="color: #d32f2f; font-size: 12px; margin-top: 20px; font-weight: bold;">
          ⚠️ If you didn't request this magic link, please contact support immediately.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 11px;">
          If you're having trouble clicking the button, copy and paste the URL above into your web browser.
        </p>
      </div>
    `
    
    const text = `
Hi ${userName},

Click the link below to sign in to your account. No password required!

Login Code: ${code}

Sign in by clicking this link:
${magicLinkUrl}

Or copy and paste the link into your browser.

This magic link will expire in 15 minutes. If you didn't request this, you can safely ignore this email.

⚠️ If you didn't request this magic link, please contact support immediately.
    `.trim()

    // Get transporter
    const emailTransporter = await getTransporter()
    if (!emailTransporter) {
      console.error('❌ Email service not available for magic link email')
      // Try Resend as fallback
      return await sendEmailViaResend(email, subject, html, text)
    }

    // Send email
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Archalley'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject,
      text,
      html,
    }

    try {
      await emailTransporter.sendMail(mailOptions)
      console.log(`✅ Magic link email sent to ${email}`)
      
      // Also try Resend as backup
      await sendEmailViaResend(email, subject, html, text)
      
      return true
    } catch (error) {
      console.error('❌ Error sending magic link email via SMTP:', error)
      // Fallback to Resend
      return await sendEmailViaResend(email, subject, html, text)
    }
  } catch (error) {
    console.error('❌ Error in sendMagicLinkEmail:', error)
    return false
  }
};

/**
 * Send welcome email after successful registration
 */
export const sendWelcomeEmail = async (
  email: string,
  userName: string
): Promise<boolean> => {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const archalleyHomeUrl = 'https://archalley.com'
    
    const subject = 'Welcome to Archalley! 🎉'
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <!-- Header -->
        <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #FFA000;">
          <h1 style="color: #FFA000; margin: 0; font-size: 32px;">Welcome to Archalley! 🎉</h1>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 30px 20px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi ${userName},
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Welcome to Archalley! We're thrilled to have you join our online platform dedicated to architecture and design, with a particular focus on innovative tropical architecture in Sri Lanka.
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Archalley is your source for information and inspiration, connecting architects, designers, and creative minds who are passionate about tropical architecture and sustainable design practices.
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Get started by exploring our community, sharing your projects, and connecting with fellow professionals. We're here to support your creative journey and inspire innovation in tropical architecture!
          </p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${archalleyHomeUrl}" 
               style="background: #FFA000; 
                      color: white; 
                      padding: 15px 40px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block; 
                      font-weight: bold; 
                      font-size: 16px;
                      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                      transition: background 0.3s;">
              Visit Archalley.com
            </a>
          </div>
          
          <!-- Features Section -->
          <div style="background: #f9f9f9; padding: 25px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0;">What you can do:</h3>
            <ul style="color: #666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Discover innovative tropical architecture projects from Sri Lanka and beyond</li>
              <li>Share your architectural designs and get valuable feedback</li>
              <li>Participate in discussions with industry professionals</li>
              <li>Explore design inspiration and sustainable building practices</li>
              <li>Connect with like-minded architects and designers</li>
              <li>Stay updated with the latest trends, competitions, and architectural news</li>
            </ul>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9f9f9; padding: 25px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0 0 10px 0;">
            Need help? Contact us at <a href="mailto:projects@archalley.com" style="color: #FFA000; text-decoration: none;">projects@archalley.com</a>
          </p>
          <p style="color: #999; font-size: 12px; margin: 0;">
            Follow us on 
            <a href="https://facebook.com/archalley" style="color: #FFA000; text-decoration: none; margin: 0 5px;">Facebook</a> |
            <a href="https://www.instagram.com/archalley_insta/" style="color: #FFA000; text-decoration: none; margin: 0 5px;">Instagram</a> |
            <a href="https://www.linkedin.com/company/archalleypage/" style="color: #FFA000; text-decoration: none; margin: 0 5px;">LinkedIn</a>
          </p>
          <p style="color: #999; font-size: 11px; margin: 15px 0 0 0;">
            © ${new Date().getFullYear()} Archalley. All rights reserved.
          </p>
        </div>
      </div>
    `
    
    const text = `
Welcome to Archalley! 🎉

Hi ${userName},

Welcome to Archalley! We're thrilled to have you join our online platform dedicated to architecture and design, with a particular focus on innovative tropical architecture in Sri Lanka.

Archalley is your source for information and inspiration, connecting architects, designers, and creative minds who are passionate about tropical architecture and sustainable design practices.

Get started by exploring our community, sharing your projects, and connecting with fellow professionals. We're here to support your creative journey and inspire innovation in tropical architecture!

Visit Archalley.com: ${archalleyHomeUrl}

What you can do:
- Discover innovative tropical architecture projects from Sri Lanka and beyond
- Share your architectural designs and get valuable feedback
- Participate in discussions with industry professionals
- Explore design inspiration and sustainable building practices
- Connect with like-minded architects and designers
- Stay updated with the latest trends, competitions, and architectural news

Need help? Contact us at support@archalley.com

Follow us on:
- Facebook: https://facebook.com/archalley
- Instagram: https://www.instagram.com/archalley_insta/
- LinkedIn: https://www.linkedin.com/company/archalleypage/

© ${new Date().getFullYear()} Archalley. All rights reserved.
    `.trim()

    // Get transporter
    const emailTransporter = await getTransporter()
    if (!emailTransporter) {
      console.error('❌ Email service not available for welcome email')
      // Try Resend as fallback
      return await sendEmailViaResend(email, subject, html, text)
    }

    // Send email
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Archalley'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject,
      text,
      html,
    }

    try {
      await emailTransporter.sendMail(mailOptions)
      console.log(`✅ Welcome email sent to ${email}`)
      
      // Also try Resend as backup
      await sendEmailViaResend(email, subject, html, text)
      
      return true
    } catch (error) {
      console.error('❌ Error sending welcome email via SMTP:', error)
      // Fallback to Resend
      return await sendEmailViaResend(email, subject, html, text)
    }
  } catch (error) {
    console.error('❌ Error in sendWelcomeEmail:', error)
    return false
  }
};

// Check if user wants email notifications for this type
export const shouldSendEmail = async (userId: string, type: NotificationType): Promise<boolean> => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      email: true,
      emailVerified: true,
      emailNotifications: true,
      notifyOnComment: true,
      notifyOnLike: true,
      notifyOnMention: true,
      notifyOnReply: true,
      notifyOnNewPost: true,
      notifyOnSystem: true,
    }
  });

  if (!user) {
    return false;
  }

  // For development, allow emails even if not verified (but user must have email address)
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasEmail = !!user.email;
  const isVerifiedOrDev = user.emailVerified || isDevelopment;
  
  if (!hasEmail || !user.emailNotifications || !isVerifiedOrDev) {
    console.log(`Email blocked for user ${userId}: hasEmail=${hasEmail}, notifications=${user.emailNotifications}, verified=${!!user.emailVerified}, isDev=${isDevelopment}`);
    return false;
  }

  const preferenceMap: Record<NotificationType, boolean> = {
    POST_COMMENT: user.notifyOnComment,
    POST_LIKE: user.notifyOnLike,
    MENTION: user.notifyOnMention,
    COMMENT_REPLY: user.notifyOnReply,
    NEW_POST_IN_CATEGORY: user.notifyOnNewPost,
    SYSTEM: user.notifyOnSystem,
    BEST_ANSWER: true, // Always send for best answer
    EMAIL_VERIFICATION: true, // Always send for verification
    NEW_FOLLOWER: true, // Always send for new followers
    MODERATION_ACTION: true, // Always send for moderation actions
  };

  return preferenceMap[type] ?? false;
};

// Retry function for email sending
const retryEmailSend = async (
  transporter: nodemailer.Transporter,
  mailOptions: nodemailer.SendMailOptions,
  maxRetries = 3
): Promise<boolean> => {
  console.log(`📧 [EMAIL DEBUG] Starting retryEmailSend with ${maxRetries} max attempts`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 [EMAIL DEBUG] Attempt ${attempt}/${maxRetries} - Sending email...`);
      const result = await transporter.sendMail(mailOptions);
      console.log(`📧 [EMAIL DEBUG] Email sent successfully on attempt ${attempt}! MessageId:`, result.messageId);
      return true;
    } catch (error) {
      console.error(`📧 [EMAIL DEBUG] Email send attempt ${attempt}/${maxRetries} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error(`📧 [EMAIL DEBUG] All ${maxRetries} attempts failed. Throwing error.`);
        throw error; // Re-throw on final attempt
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`📧 [EMAIL DEBUG] Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  return false;
};

// Main email sending function
export const sendNotificationEmail = async (
  userId: string,
  type: NotificationType,
  data: {
    postId?: string;
    commentId?: string;
    authorId?: string;
    postTitle?: string;
    commentContent?: string;
    customUrl?: string;
  }
): Promise<boolean> => {
  
  try {
    console.log(`📧 [EMAIL DEBUG] Starting sendNotificationEmail for userId: ${userId}, type: ${type}`);
    console.log(`📧 [EMAIL DEBUG] Data:`, JSON.stringify(data, null, 2));
    
    // Get transporter
    const emailTransporter = await getTransporter();
    console.log(`📧 [EMAIL DEBUG] Transporter status:`, emailTransporter ? 'Available' : 'Not available');
    if (!emailTransporter) {
      console.error('❌ [EMAIL DEBUG] Email service not available:', transporterError);
      return false;
    }

    // Check if user wants this type of email
    const shouldSend = await shouldSendEmail(userId, type);
    console.log(`📧 [EMAIL DEBUG] Should send email to user ${userId}:`, shouldSend);
    if (!shouldSend) {
      console.log(`📧 User ${userId} has disabled ${type} email notifications`);
      return false;
    }

    // Get user and author data
    const [user, author] = await Promise.all([
      prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true }
      }),
      data.authorId ? prisma.users.findUnique({
        where: { id: data.authorId },
        select: { name: true, image: true }
      }) : null
    ]);

    console.log(`📧 [EMAIL DEBUG] User found:`, user ? { id: user.id, email: user.email, name: user.name } : 'Not found');
    console.log(`📧 [EMAIL DEBUG] Author found:`, author ? { name: author.name, image: author.image } : 'Not found');

    if (!user?.email) {
      console.log(`📧 [EMAIL DEBUG] User ${userId} has no email address`);
      return false;
    }
    
    if (!isValidEmail(user.email)) {
      console.log(`📧 [EMAIL DEBUG] User ${userId} has invalid email address: ${user.email}`);
      return false;
    }

    // Get post data if needed
    let post = null;
    let category = null;
    if (data.postId) {
      post = await prisma.post.findUnique({
        where: { id: data.postId },
        select: { 
          id: true, 
          content: true, 
          createdAt: true,
          primaryCategory: {
            select: { name: true }
          },
          postCategories: {
            include: {
              category: {
                select: { name: true }
              }
            }
          }
        }
      });
      category = post?.primaryCategory?.name || (post?.postCategories && post.postCategories.length > 0 ? post.postCategories[0].category.name : 'General');
    }

    // Prepare email data
    const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const postUrl = data.customUrl || (data.postId ? `${siteUrl}/posts/${data.postId}` : siteUrl);
    
    // Create post preview (first 200 characters of content, clean HTML)
    const postPreview = post?.content ? 
      post.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 200) : '';
    
    // Calculate time ago for activity
    const timeAgo = post?.createdAt ? 
      getTimeAgo(post.createdAt) : undefined;

    const emailData: EmailData = {
      userEmail: user.email,
      userName: user.name || 'User',
      postContent: post?.content,
      commentContent: data.commentContent,
      authorName: author?.name || 'Someone',
      authorAvatar: author?.image || undefined,
      postUrl,
      siteUrl,
      postPreview,
      category: category || undefined,
      timeAgo,
    };

    // Generate email template
    const template = getEmailTemplate(type, emailData);
    console.log(`📧 [EMAIL DEBUG] Generated template - Subject: ${template.subject}`);

    // Log email attempt
    const emailLog = await prisma.emailLogs.create({
      data: {
        email: user.email,
        subject: template.subject,
        template: type,
        type,
        status: EmailStatus.PENDING,
        userId,
        postId: data.postId,
        commentId: data.commentId,
        metadata: data,
      }
    });
    console.log(`📧 [EMAIL DEBUG] Created email log with ID: ${emailLog.id}`);

    try {
      // Prepare mail options
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Archalley'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to: user.email,
        subject: template.subject,
        text: template.text,
        html: template.html,
      };
      console.log(`📧 [EMAIL DEBUG] Mail options prepared - From: ${mailOptions.from}, To: ${mailOptions.to}`);

      // Send email with retry logic
      console.log(`📧 [EMAIL DEBUG] Attempting to send email with retry logic...`);
      const success = await retryEmailSend(emailTransporter, mailOptions, 3);
      console.log(`📧 [EMAIL DEBUG] Email send result: ${success ? 'SUCCESS' : 'FAILED'}`);
      
      if (success) {
        // Update log as sent
        await prisma.emailLogs.update({
          where: { id: emailLog.id },
          data: {
            status: EmailStatus.SENT,
            sentAt: new Date(),
          }
        });

        console.log(`✅ Email sent successfully to ${user.email} for ${type}`);
        return true;
      } else {
        throw new Error('All retry attempts failed');
      }

    } catch (emailError) {
      console.error(`❌ SMTP email failed to ${user.email}:`, emailError);
      
      // Try Resend as fallback when SMTP fails
      console.log(`🔄 [EMAIL DEBUG] Attempting Resend fallback for ${user.email}...`);
      
      try {
        const resendSuccess = await sendEmailViaResend(
          user.email,
          template.subject,
          template.html,
          template.text
        );
        
        if (resendSuccess) {
          // Update log as sent via Resend
          await prisma.emailLogs.update({
            where: { id: emailLog.id },
            data: {
              status: EmailStatus.SENT,
              sentAt: new Date(),
              error: `SMTP failed, sent via Resend: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`,
            }
          });

          console.log(`✅ Email sent successfully via Resend fallback to ${user.email} for ${type}`);
          return true;
        } else {
          throw new Error('Resend fallback also failed');
        }
        
      } catch (resendError) {
        // Both SMTP and Resend failed - update log as failed
        await prisma.emailLogs.update({
          where: { id: emailLog.id },
          data: {
            status: EmailStatus.FAILED,
            error: `SMTP failed: ${emailError instanceof Error ? emailError.message : 'Unknown'}. Resend failed: ${resendError instanceof Error ? resendError.message : 'Unknown'}`,
          }
        });

        console.error(`❌ Both SMTP and Resend failed for ${user.email}:`, resendError);
        return false;
      }
    }

  } catch (error) {
    console.error('Error in sendNotificationEmail:', error);
    return false;
  }
};

// Batch email sending for multiple users
export const sendBulkNotificationEmails = async (
  userIds: string[],
  type: NotificationType,
  data: {
    postId?: string;
    commentId?: string;
    authorId?: string;
    postTitle?: string;
    commentContent?: string;
    customUrl?: string;
  }
): Promise<{ sent: number; failed: number }> => {
  const results = await Promise.allSettled(
    userIds.map(userId => sendNotificationEmail(userId, type, data))
  );

  const sent = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - sent;

  console.log(`Bulk email results: ${sent} sent, ${failed} failed`);
  return { sent, failed };
};

// Helper function to extract mentions from content
export const extractMentions = (content: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // Remove duplicates
};

// Helper function to get user IDs from usernames
export const getUserIdsByUsernames = async (usernames: string[]): Promise<string[]> => {
  const users = await prisma.users.findMany({
    where: {
      name: {
        in: usernames,
        mode: 'insensitive'
      }
    },
    select: { id: true }
  });
  
  return users.map(user => user.id);
};
