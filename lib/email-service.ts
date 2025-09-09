import { prisma } from './prisma';
import { NotificationType, EmailStatus } from '@prisma/client';
import nodemailer from 'nodemailer';

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

// Email service configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailData {
  userEmail: string;
  userName: string;
  postTitle?: string;
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
  const { userName, postTitle, authorName, authorAvatar, postUrl, siteUrl, commentContent, postPreview, category, timeAgo } = data;

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
                      ${(postTitle && postTitle.length > 3 && postTitle !== 'Post' && postTitle !== 'Untitled Post') || (postPreview && postPreview.length > 10) ? `
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
                            ${postTitle && postTitle.length > 3 && postTitle !== 'Post' && postTitle !== 'Untitled Post' ? `
                            <h3 style="
                              margin: 0 0 8px 0; 
                              font-size: 16px; 
                              font-weight: 600; 
                              color: #1f2937;
                              line-height: 1.4;
                            ">
                              ${postTitle.length > 60 ? postTitle.substring(0, 60) + '…' : postTitle}
                            </h3>
                            ` : ''}
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
      text: `${authorName} liked your post${postTitle && postTitle.length > 3 && postTitle !== 'Post' && postTitle !== 'Untitled Post' ? `: "${postTitle}"` : ''}${postPreview && postPreview.length > 10 ? `\n\n"${postPreview}${postPreview.length > 100 ? '...' : ''}"` : ''}. View your post: ${postUrl}`
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
                      ${(postTitle && postTitle.length > 3 && postTitle !== 'Post' && postTitle !== 'Untitled Post') || (postPreview && postPreview.length > 10) ? `
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
                            ${postTitle && postTitle.length > 3 && postTitle !== 'Post' && postTitle !== 'Untitled Post' ? `
                            <h4 style="
                              margin: 0 0 8px 0; 
                              font-size: 16px; 
                              font-weight: 600; 
                              color: #1f2937;
                              line-height: 1.4;
                            ">
                              ${postTitle.length > 60 ? postTitle.substring(0, 60) + '…' : postTitle}
                            </h4>
                            ` : ''}
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
      text: `Hi ${userName}, ${authorName} commented on your post "${postTitle}": "${commentContent}". Reply: ${postUrl}`
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
                      ${(postTitle && postTitle.length > 3 && postTitle !== 'Post' && postTitle !== 'Untitled Post') || (postPreview && postPreview.length > 10) ? `
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
                            ${postTitle && postTitle.length > 3 && postTitle !== 'Post' && postTitle !== 'Untitled Post' ? `
                            <h4 style="
                              margin: 0 0 8px 0; 
                              font-size: 16px; 
                              font-weight: 600; 
                              color: #1f2937;
                              line-height: 1.4;
                            ">
                              ${postTitle.length > 60 ? postTitle.substring(0, 60) + '…' : postTitle}
                            </h4>
                            ` : ''}
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
      text: `Hi ${userName}, ${authorName} replied to your comment on "${postTitle}": "${commentContent}". View: ${postUrl}`
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
                      ${(postTitle && postTitle.length > 3 && postTitle !== 'Post' && postTitle !== 'Untitled Post') || (postPreview && postPreview.length > 10) ? `
                      <div style="text-align: center; margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
                        ${postTitle && postTitle.length > 3 && postTitle !== 'Post' && postTitle !== 'Untitled Post' ? `
                        <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #333;">
                          ${postTitle}
                        </h4>
                        ` : ''}
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
      text: `Hi ${userName}, ${authorName} mentioned you in "${postTitle}": "${commentContent}". View: ${postUrl}`
    },

    BEST_ANSWER: {
      subject: `Your comment was marked as the best answer!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Congratulations! 🏆</h2>
          <p>Hi ${userName},</p>
          <p>Your comment on "<strong>${postTitle}</strong>" was marked as the best answer!</p>
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
      text: `Hi ${userName}, your comment on "${postTitle}" was marked as the best answer! View: ${postUrl}`
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
      subject: `New post in category you follow: "${postTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New post in your followed category! 📝</h2>
          <p>Hi ${userName},</p>
          <p><strong>${authorName}</strong> posted "${postTitle}" in a category you follow.</p>
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
      text: `Hi ${userName}, ${authorName} posted "${postTitle}" in a category you follow. Read: ${postUrl}`
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
    }
  };

  return templates[type];
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
  };

  return preferenceMap[type] ?? false;
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
    // Check if user wants this type of email
    const shouldSend = await shouldSendEmail(userId, type);
    if (!shouldSend) {
      console.log(`User ${userId} has disabled ${type} email notifications`);
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

    if (!user?.email) {
      console.log(`User ${userId} has no email address`);
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
          title: true, 
          content: true, 
          createdAt: true,
          categories: {
            select: { name: true }
          }
        }
      });
      category = post?.categories?.name;
    }

    // Prepare email data
    const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const postUrl = data.customUrl || (data.postId ? `${siteUrl}/posts/${data.postId}` : siteUrl);
    
    // Create post preview (first 200 characters of content, clean HTML)
    const postPreview = post?.content ? 
      post.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 200) : '';
    
    // Use post title or create one from content - avoid "Untitled Post"
    const finalPostTitle = data.postTitle || post?.title || (postPreview && postPreview.length > 10 ? 
      (postPreview.length > 50 ? postPreview.substring(0, 50) + '...' : postPreview) : 
      null);
    
    // Calculate time ago for activity
    const timeAgo = post?.createdAt ? 
      getTimeAgo(post.createdAt) : undefined;

    const emailData: EmailData = {
      userEmail: user.email,
      userName: user.name || 'User',
      postTitle: finalPostTitle || undefined,
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

    try {
      // Send email
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'Forum'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to: user.email,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });

      // Update log as sent
      await prisma.emailLogs.update({
        where: { id: emailLog.id },
        data: {
          status: EmailStatus.SENT,
          sentAt: new Date(),
        }
      });

      console.log(`Email sent successfully to ${user.email} for ${type}`);
      return true;

    } catch (emailError) {
      // Update log as failed
      await prisma.emailLogs.update({
        where: { id: emailLog.id },
        data: {
          status: EmailStatus.FAILED,
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
        }
      });

      console.error(`Failed to send email to ${user.email}:`, emailError);
      return false;
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
