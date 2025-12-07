import nodemailer from 'nodemailer';

/**
 * Create email transporter
 */
const createTransporter = (): nodemailer.Transporter | null => {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn('Email configuration missing');
      return null;
    }

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    return null;
  }
};

/**
 * Send brief download link email
 */
export async function sendBriefDownloadLinkEmail(
  email: string,
  downloadUrl: string
): Promise<boolean> {
  try {
    const subject = 'Download Competition Brief - Archalley Competition 2025 - Christmas in Future 📋';
    
    // Email header matching competition email style
    const getEmailHeader = () => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
    <!-- Header -->
    <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #FFA000;">
      <h1 style="color: #FFA000; margin: 0; font-size: 32px;">ARCHALLEY</h1>
    </div>
`;

    // Email footer matching competition email style
    const getEmailFooter = () => `
    <!-- Footer -->
    <div style="background: #f9f9f9; padding: 25px; text-align: center; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 12px; margin: 0 0 10px 0;">
        Need help? Contact us at <a href="mailto:competitions@archalley.com" style="color: #FFA000; text-decoration: none;">competitions@archalley.com</a>
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
`;

    const html = `
    ${getEmailHeader()}
    
    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hello,
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Thank you for your interest in <strong>Archalley Competition 2025 - Christmas in Future</strong>. As requested, please find your unique download link for the competition brief below.
      </p>

      <!-- Download Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${downloadUrl}" 
           style="background: #FFA000; 
                  color: white; 
                  padding: 15px 40px; 
                  text-decoration: none; 
                  border-radius: 8px; 
                  display: inline-block; 
                  font-weight: bold; 
                  font-size: 16px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          Download Competition Brief
        </a>
      </div>

      <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
        If the button doesn't work, you can copy and paste this link into your browser:<br>
        <a href="${downloadUrl}" style="color: #FFA000; word-break: break-all; text-decoration: none;">${downloadUrl}</a>
      </p>

      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 40px 0 0 0;">
        Good luck with your submission!
      </p>
    </div>
    ${getEmailFooter()}
    `;

    const text = `
Download Competition Brief - Archalley Competition 2025 - Christmas in Future

Hello,

Thank you for your interest in Archalley Competition 2025 - Christmas in Future. As requested, please find your unique download link for the competition brief below.

Download Link: ${downloadUrl}

Good luck with your submission!

Need help? Contact us at competitions@archalley.com

Follow us on:
- Facebook: https://facebook.com/archalley
- Instagram: https://www.instagram.com/archalley_insta/
- LinkedIn: https://www.linkedin.com/company/archalleypage/

© ${new Date().getFullYear()} Archalley. All rights reserved.
    `.trim();

    return sendEmail(email, subject, html, text);

  } catch (error) {
    console.error('❌ Error sending brief download email:', error);
    return false;
  }
}

// Helper function to send email
const sendEmail = async (to: string, subject: string, html: string, text: string): Promise<boolean> => {
  try {
    // In development, just log the email
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_EMAIL_SEND === 'true') {
      console.log('📧 [DEV] Brief download email would be sent:');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('---');
      return true;
    }

    const transporter = createTransporter();
    if (!transporter) {
      console.error('❌ No email transporter available');
      return false;
    }
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Archalley'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Brief download email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending brief download email:', error);
    return false;
  }
};

