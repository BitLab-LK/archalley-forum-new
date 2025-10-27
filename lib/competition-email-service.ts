/**
 * Competition Email Service
 * Handles all email notifications for competition registrations
 */

import nodemailer from 'nodemailer';
import { CompetitionRegistration, Competition, CompetitionRegistrationType } from '@prisma/client';

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Email templates
const getEmailHeader = () => `
  <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #FACC15 0%, #F59E0B 100%); padding: 30px; text-align: center;">
      <h1 style="color: #000000; margin: 0; font-size: 28px; font-weight: bold;">Archalley Forum</h1>
      <p style="color: #000000; margin: 10px 0 0 0; font-size: 14px;">Architecture & Design Competitions</p>
    </div>
`;

const getEmailFooter = () => `
    <div style="background-color: #f3f4f6; padding: 30px; text-align: center; border-top: 3px solid #FACC15;">
      <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
        <strong>Archalley Forum</strong><br>
        Leading Architecture & Design Community
      </p>
      <p style="color: #9ca3af; margin: 0; font-size: 12px;">
        Need help? Contact us at <a href="mailto:support@archalleyforum.com" style="color: #FACC15;">support@archalleyforum.com</a>
      </p>
      <div style="margin-top: 15px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://archalleyforum.com'}" style="color: #FACC15; text-decoration: none; margin: 0 10px;">Website</a>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/events" style="color: #FACC15; text-decoration: none; margin: 0 10px;">Competitions</a>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/registrations" style="color: #FACC15; text-decoration: none; margin: 0 10px;">My Registrations</a>
      </div>
    </div>
  </div>
`;

interface RegistrationEmailData {
  registration: CompetitionRegistration;
  competition: Competition;
  registrationType: CompetitionRegistrationType;
  userName: string;
  userEmail: string;
  members: any[];
  paymentOrderId: string;
}

// Helper to safely extract prize values from JSON
const getPrizeValue = (competition: Competition, prizeKey: 'first' | 'second' | 'third'): number | null => {
  try {
    const prizes = competition.prizes as any;
    return prizes?.[prizeKey]?.amount || null;
  } catch {
    return null;
  }
};

// 1. Registration Confirmation Email
export const sendRegistrationConfirmationEmail = async (data: RegistrationEmailData) => {
  const { registration, competition, registrationType, userName, userEmail, members } = data;

  const subject = `✅ Registration Confirmed - ${competition.title}`;

  const html = `
    ${getEmailHeader()}
    <div style="padding: 40px 30px;">
      <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Registration Confirmed! 🎉</h2>
      
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
        Dear ${userName},
      </p>
      
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
        Thank you for registering for <strong>${competition.title}</strong>! Your registration has been successfully confirmed.
      </p>

      <div style="background-color: #fef3c7; border-left: 4px solid #FACC15; padding: 20px; margin: 0 0 30px 0;">
        <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">Registration Details</h3>
        <table style="width: 100%; color: #78350f;">
          <tr>
            <td style="padding: 8px 0;"><strong>Registration Number:</strong></td>
            <td style="padding: 8px 0; text-align: right; font-family: monospace; font-weight: bold;">${registration.registrationNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Competition:</strong></td>
            <td style="padding: 8px 0; text-align: right;">${competition.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Registration Type:</strong></td>
            <td style="padding: 8px 0; text-align: right;">${registrationType.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Amount Paid:</strong></td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">LKR ${registration.amountPaid.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Country:</strong></td>
            <td style="padding: 8px 0; text-align: right;">${registration.country}</td>
          </tr>
        </table>
      </div>

      ${members && members.length > 0 ? `
        <div style="background-color: #f3f4f6; padding: 20px; margin: 0 0 30px 0; border-radius: 8px;">
          <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">Team Members (${members.length})</h3>
          ${members.map((member: any, idx: number) => `
            <div style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
              <strong style="color: #374151;">${idx === 0 ? '👤 Lead: ' : '   '}${member.name}</strong><br>
              <span style="color: #6b7280; font-size: 14px;">${member.email}</span>
              ${member.role ? `<br><span style="color: #9ca3af; font-size: 12px;">Role: ${member.role}</span>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 0 0 30px 0;">
        <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">📅 Important Dates</h3>
        <p style="color: #1e3a8a; margin: 0; line-height: 1.6;">
          <strong>Competition End Date:</strong> ${new Date(competition.endDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}<br>
          <strong>Competition Start:</strong> ${new Date(competition.startDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">Next Steps</h3>
      <ol style="color: #4b5563; line-height: 1.8; margin: 0 0 30px 0;">
        <li>Check the competition guidelines and requirements</li>
        <li>Prepare your submission according to the specifications</li>
        <li>Upload your work before the submission deadline</li>
        <li>Wait for the results announcement</li>
      </ol>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/registrations" 
           style="display: inline-block; background-color: #FACC15; color: #000000; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          View My Registrations
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <strong>Note:</strong> Keep this email for your records. You'll need your registration number for any inquiries.
      </p>
    </div>
    ${getEmailFooter()}
  `;

  const text = `
Registration Confirmed - ${competition.title}

Dear ${userName},

Thank you for registering for ${competition.title}!

Registration Details:
- Registration Number: ${registration.registrationNumber}
- Competition: ${competition.title}
- Registration Type: ${registrationType.name}
- Amount Paid: LKR ${registration.amountPaid.toLocaleString()}
- Country: ${registration.country}

${members && members.length > 0 ? `
Team Members:
${members.map((m: any, i: number) => `${i + 1}. ${m.name} (${m.email})`).join('\n')}
` : ''}

Important Dates:
- Competition End: ${new Date(competition.endDate).toLocaleDateString()}
- Competition Start: ${new Date(competition.startDate).toLocaleDateString()}

Next Steps:
1. Check the competition guidelines
2. Prepare your submission
3. Upload before the deadline
4. Wait for results

View your registrations: ${process.env.NEXT_PUBLIC_APP_URL}/profile/registrations

Best regards,
Archalley Forum Team
  `;

  return sendEmail(userEmail, subject, html, text);
};

// 2. Payment Receipt Email
export const sendPaymentReceiptEmail = async (data: RegistrationEmailData) => {
  const { registration, competition, registrationType, userName, userEmail, paymentOrderId } = data;

  const subject = `💳 Payment Receipt - ${competition.title}`;

  const html = `
    ${getEmailHeader()}
    <div style="padding: 40px 30px;">
      <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Payment Receipt 💳</h2>
      
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
        Dear ${userName},<br><br>
        This email confirms that we have received your payment for <strong>${competition.title}</strong>.
      </p>

      <div style="background-color: #f3f4f6; padding: 25px; margin: 0 0 30px 0; border-radius: 8px; border: 2px solid #FACC15;">
        <h3 style="color: #111827; margin: 0 0 20px 0; font-size: 20px; text-align: center;">Invoice</h3>
        
        <table style="width: 100%; margin-bottom: 20px;">
          <tr style="border-bottom: 2px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Order ID:</td>
            <td style="padding: 12px 0; text-align: right; font-family: monospace; font-weight: bold; color: #111827;">${paymentOrderId}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Registration Number:</td>
            <td style="padding: 12px 0; text-align: right; font-family: monospace; font-weight: bold; color: #111827;">${registration.registrationNumber}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Date:</td>
            <td style="padding: 12px 0; text-align: right; color: #111827;">${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</td>
          </tr>
        </table>

        <table style="width: 100%; margin-top: 20px;">
          <tr style="background-color: #e5e7eb;">
            <td style="padding: 12px; font-weight: bold; color: #111827;">Item</td>
            <td style="padding: 12px; text-align: right; font-weight: bold; color: #111827;">Amount</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; color: #4b5563;">
              <strong>${competition.title}</strong><br>
              <span style="font-size: 14px; color: #6b7280;">${registrationType.name}</span>
            </td>
            <td style="padding: 12px; text-align: right; color: #111827;">LKR ${registration.amountPaid.toLocaleString()}</td>
          </tr>
          <tr style="background-color: #fef3c7; border-top: 2px solid #FACC15;">
            <td style="padding: 15px; font-weight: bold; font-size: 18px; color: #111827;">Total Paid</td>
            <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px; color: #FACC15;">LKR ${registration.amountPaid.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 0 0 30px 0;">
        <p style="color: #065f46; margin: 0; line-height: 1.6;">
          ✅ <strong>Payment Status:</strong> Completed<br>
          💳 <strong>Payment Method:</strong> PayHere Gateway<br>
          📧 <strong>Billed To:</strong> ${userEmail}
        </p>
      </div>

      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
        <strong>Note:</strong> This is an automated receipt. Please keep it for your records. If you have any questions about this payment, please contact us with your order ID.
      </p>
    </div>
    ${getEmailFooter()}
  `;

  const text = `
Payment Receipt - ${competition.title}

Dear ${userName},

This confirms your payment for ${competition.title}.

Invoice Details:
- Order ID: ${paymentOrderId}
- Registration Number: ${registration.registrationNumber}
- Date: ${new Date().toLocaleDateString()}

Item: ${competition.title} - ${registrationType.name}
Amount Paid: LKR ${registration.amountPaid.toLocaleString()}

Payment Status: Completed
Payment Method: PayHere Gateway

Thank you for your payment!

Best regards,
Archalley Forum Team
  `;

  return sendEmail(userEmail, subject, html, text);
};

// 3. Competition Guidelines Email
export const sendCompetitionGuidelinesEmail = async (data: RegistrationEmailData) => {
  const { competition, userName, userEmail, registration } = data;

  const subject = `📋 Competition Guidelines - ${competition.title}`;

  const html = `
    ${getEmailHeader()}
    <div style="padding: 40px 30px;">
      <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Competition Guidelines 📋</h2>
      
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
        Dear ${userName},<br><br>
        Here are the important guidelines and requirements for <strong>${competition.title}</strong>.
      </p>

      <div style="background-color: #fef3c7; border-left: 4px solid #FACC15; padding: 20px; margin: 0 0 30px 0;">
        <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">Your Registration</h3>
        <p style="color: #78350f; margin: 0;">
          <strong>Registration Number:</strong> ${registration.registrationNumber}
        </p>
      </div>

      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">Competition Description</h3>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
        ${competition.description || 'Please visit the competition page for full details.'}
      </p>

      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">📅 Important Dates</h3>
      <div style="background-color: #dbeafe; padding: 20px; margin: 0 0 30px 0; border-radius: 8px;">
        <p style="color: #1e3a8a; margin: 0 0 10px 0;"><strong>Competition End Date:</strong></p>
        <p style="color: #1e40af; margin: 0 0 20px 0; font-size: 18px; font-weight: bold;">
          ${new Date(competition.endDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
        <p style="color: #1e3a8a; margin: 0 0 10px 0;"><strong>Competition Start:</strong></p>
        <p style="color: #1e40af; margin: 0; font-size: 16px;">
          ${new Date(competition.startDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">🏆 Prizes</h3>
      <div style="background-color: #fef3c7; padding: 20px; margin: 0 0 30px 0; border-radius: 8px;">
        ${getPrizeValue(competition, 'first') ? `<p style="color: #92400e; margin: 0 0 10px 0;">🥇 <strong>First Prize:</strong> LKR ${getPrizeValue(competition, 'first')!.toLocaleString()}</p>` : ''}
        ${getPrizeValue(competition, 'second') ? `<p style="color: #92400e; margin: 0 0 10px 0;">🥈 <strong>Second Prize:</strong> LKR ${getPrizeValue(competition, 'second')!.toLocaleString()}</p>` : ''}
        ${getPrizeValue(competition, 'third') ? `<p style="color: #92400e; margin: 0;">🥉 <strong>Third Prize:</strong> LKR ${getPrizeValue(competition, 'third')!.toLocaleString()}</p>` : ''}
      </div>

      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">📝 Submission Requirements</h3>
      <ul style="color: #4b5563; line-height: 1.8; margin: 0 0 30px 0;">
        <li>File Format: PDF, JPG, or PNG (Portfolio/Presentation format)</li>
        <li>Maximum File Size: 50 MB</li>
        <li>Include all required drawings, renders, and documentation</li>
        <li>Clearly label your submission with your registration number</li>
        <li>Submit through your dashboard before the deadline</li>
      </ul>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${competition.slug}" 
           style="display: inline-block; background-color: #FACC15; color: #000000; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin-right: 10px;">
          View Competition
        </a>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/registrations" 
           style="display: inline-block; background-color: #111827; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Upload Submission
        </a>
      </div>

      <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 30px 0 0 0;">
        <p style="color: #991b1b; margin: 0; line-height: 1.6;">
          <strong>⚠️ Important:</strong> Late submissions will not be accepted. Make sure to upload your work well before the deadline to avoid any technical issues.
        </p>
      </div>
    </div>
    ${getEmailFooter()}
  `;

  const text = `
Competition Guidelines - ${competition.title}

Dear ${userName},

Registration Number: ${registration.registrationNumber}

Important Dates:
- Competition End: ${new Date(competition.endDate).toLocaleDateString()}
- Competition Start: ${new Date(competition.startDate).toLocaleDateString()}

Prizes:
${getPrizeValue(competition, 'first') ? `- First: LKR ${getPrizeValue(competition, 'first')!.toLocaleString()}` : ''}
${getPrizeValue(competition, 'second') ? `- Second: LKR ${getPrizeValue(competition, 'second')!.toLocaleString()}` : ''}
${getPrizeValue(competition, 'third') ? `- Third: LKR ${getPrizeValue(competition, 'third')!.toLocaleString()}` : ''}

Submission Requirements:
- Format: PDF, JPG, or PNG
- Max Size: 50 MB
- Include all required documentation
- Submit through your dashboard

View competition: ${process.env.NEXT_PUBLIC_APP_URL}/events/${competition.slug}
Upload submission: ${process.env.NEXT_PUBLIC_APP_URL}/profile/registrations

Best regards,
Archalley Forum Team
  `;

  return sendEmail(userEmail, subject, html, text);
};

// 4. Submission Reminder Email (7 days before deadline)
export const sendSubmissionReminderEmail = async (
  userEmail: string,
  userName: string,
  competition: Competition,
  registrationNumber: string,
  daysRemaining: number
) => {
  const subject = `⏰ Reminder: ${daysRemaining} Days Left - ${competition.title}`;

  const html = `
    ${getEmailHeader()}
    <div style="padding: 40px 30px;">
      <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Submission Reminder ⏰</h2>
      
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
        Dear ${userName},<br><br>
        This is a friendly reminder that the submission deadline for <strong>${competition.title}</strong> is approaching.
      </p>

      <div style="background-color: #fef3c7; border: 3px solid #FACC15; padding: 30px; margin: 0 0 30px 0; border-radius: 12px; text-align: center;">
        <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">Time Remaining</h3>
        <p style="color: #78350f; margin: 0; font-size: 48px; font-weight: bold;">${daysRemaining}</p>
        <p style="color: #92400e; margin: 10px 0 0 0; font-size: 20px; font-weight: bold;">Day${daysRemaining > 1 ? 's' : ''}</p>
        <p style="color: #78350f; margin: 15px 0 0 0; font-size: 14px;">
          Competition End: ${new Date(competition.endDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      <div style="background-color: #f3f4f6; padding: 20px; margin: 0 0 30px 0; border-radius: 8px;">
        <p style="color: #4b5563; margin: 0;">
          <strong>Your Registration:</strong> ${registrationNumber}
        </p>
      </div>

      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 18px;">Before You Submit</h3>
      <ul style="color: #4b5563; line-height: 1.8; margin: 0 0 30px 0;">
        <li>✅ Review all competition requirements</li>
        <li>✅ Check file format and size limits</li>
        <li>✅ Include your registration number in the submission</li>
        <li>✅ Test your files to ensure they open correctly</li>
        <li>✅ Submit early to avoid last-minute technical issues</li>
      </ul>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/registrations" 
           style="display: inline-block; background-color: #FACC15; color: #000000; padding: 18px 50px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
          Upload Your Submission Now
        </a>
      </div>

      <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 30px 0 0 0;">
        <p style="color: #991b1b; margin: 0; line-height: 1.6; font-size: 14px;">
          <strong>⚠️ Important:</strong> Submissions received after the deadline will not be accepted. We recommend submitting at least 24 hours before the deadline.
        </p>
      </div>
    </div>
    ${getEmailFooter()}
  `;

  const text = `
Submission Reminder - ${competition.title}

Dear ${userName},

Only ${daysRemaining} day(s) remaining until the competition end!

Competition End: ${new Date(competition.endDate).toLocaleDateString()}
Your Registration: ${registrationNumber}

Before You Submit:
- Review all requirements
- Check file format and size
- Include registration number
- Test your files
- Submit early!

Upload now: ${process.env.NEXT_PUBLIC_APP_URL}/profile/registrations

Best regards,
Archalley Forum Team
  `;

  return sendEmail(userEmail, subject, html, text);
};

// Helper function to send email
const sendEmail = async (to: string, subject: string, html: string, text: string): Promise<boolean> => {
  try {
    // In development, just log the email
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_EMAIL_SEND === 'true') {
      console.log('📧 [DEV] Email would be sent:');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('---');
      return true;
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Archalley Forum" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

export default {
  sendRegistrationConfirmationEmail,
  sendPaymentReceiptEmail,
  sendCompetitionGuidelinesEmail,
  sendSubmissionReminderEmail,
};
