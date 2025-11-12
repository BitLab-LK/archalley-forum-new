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

// Email templates matching welcome email style
const getEmailHeader = () => {
  console.log('🔥 EMAIL HEADER FUNCTION CALLED - Returning ORANGE #FFA000 header');
  const header = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
    <!-- Header -->
    <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #FFA000;">
      <h1 style="color: #FFA000; margin: 0; font-size: 32px;">ARCHALLEY</h1>
    </div>
`;
  console.log('🔥 Header color check:', header.includes('#FFA000') ? 'ORANGE ✅' : 'ERROR ❌');
  return header;
};

const getEmailFooter = () => `
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

  console.log('📧 Sending Registration Confirmation Email to:', userEmail);
  
  const subject = `Registration Confirmed - Archalley Competition 2025 🎉`;

  const html = `
    ${getEmailHeader()}
    
    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Congratulations! Your registration for <strong>Archalley Competition 2025</strong> has been successfully confirmed. We're excited to see your creative work!
      </p>

      <!-- Registration Details Box -->
      <div style="background: #f9f9f9; padding: 25px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0;">Registration Details</h3>
        <table style="width: 100%; color: #333; font-size: 14px; line-height: 1.8;">
          <tr>
            <td style="padding: 8px 0;"><strong>Registration Number:</strong></td>
            <td style="padding: 8px 0; text-align: right; font-family: monospace; font-weight: bold; color: #FFA000;">${registration.registrationNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Category:</strong></td>
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
        <div style="background: #f9f9f9; padding: 25px; border-radius: 8px; margin: 30px 0;">
          <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0;">Team Members (${members.length})</h3>
          ${members.map((member: any, idx: number) => `
            <div style="padding: 12px 0; ${idx < members.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
              <strong style="color: #333; font-size: 14px;">${idx === 0 ? '👤 Team Lead: ' : '👥 Member: '}${member.name}</strong><br>
              <span style="color: #666; font-size: 14px;">${member.email}</span>
              ${member.role ? `<br><span style="color: #999; font-size: 12px;">Role: ${member.role}</span>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Important Dates -->
      <div style="background: #fff4e6; padding: 20px; border-radius: 8px; border-left: 4px solid #FFA000; margin: 30px 0;">
        <h3 style="color: #FFA000; margin: 0 0 15px 0; font-size: 16px;">📅 Important Dates</h3>
        <p style="color: #333; margin: 0; line-height: 1.8; font-size: 14px;">
          <strong>Submission Deadline:</strong> ${new Date(competition.endDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}<br>
          <strong>Competition Period:</strong> ${new Date(competition.startDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric'
          })} - ${new Date(competition.endDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
      </div>

      <!-- Next Steps -->
      <div style="margin: 30px 0;">
        <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0;">What's Next?</h3>
        <ul style="color: #666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Review the competition guidelines and requirements carefully</li>
          <li>Prepare your design submission according to specifications</li>
          <li>Submit your work before the deadline</li>
          <li>Wait for the results announcement</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/registrations" 
           style="background: #FFA000; 
                  color: white; 
                  padding: 15px 40px; 
                  text-decoration: none; 
                  border-radius: 8px; 
                  display: inline-block; 
                  font-weight: bold; 
                  font-size: 16px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          View My Registrations
        </a>
      </div>

      <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #eee;">
        <strong>Important:</strong> Please save this email for your records. You'll need your registration number for any inquiries about your submission.
      </p>
    </div>
    ${getEmailFooter()}
  `;

  const text = `
Registration Confirmed - Archalley Competition 2025 🎉

Hi ${userName},

Congratulations! Your registration for Archalley Competition 2025 has been successfully confirmed. We're excited to see your creative work!

Registration Details:
- Registration Number: ${registration.registrationNumber}
- Category: ${registrationType.name}
- Amount Paid: LKR ${registration.amountPaid.toLocaleString()}
- Country: ${registration.country}

${members && members.length > 0 ? `
Team Members:
${members.map((m: any, i: number) => `${i + 1}. ${m.name} (${m.email})${m.role ? ` - ${m.role}` : ''}`).join('\n')}
` : ''}

Important Dates:
- Submission Deadline: ${new Date(competition.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Competition Period: ${new Date(competition.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${new Date(competition.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

What's Next?
1. Review the competition guidelines and requirements carefully
2. Prepare your design submission according to specifications
3. Submit your work before the deadline
4. Wait for the results announcement

View your registrations: ${process.env.NEXT_PUBLIC_APP_URL}/profile/registrations

Important: Please save this email for your records. You'll need your registration number for any inquiries about your submission.

Need help? Contact us at projects@archalley.com

Follow us on:
- Facebook: https://facebook.com/archalley
- Instagram: https://www.instagram.com/archalley_insta/
- LinkedIn: https://www.linkedin.com/company/archalleypage/

© ${new Date().getFullYear()} Archalley. All rights reserved.
  `;

  return sendEmail(userEmail, subject, html, text);
};

// 2. Payment Receipt Email
export const sendPaymentReceiptEmail = async (data: RegistrationEmailData) => {
  const { registration, registrationType, userName, userEmail, paymentOrderId } = data;

  const subject = `Payment Receipt - Archalley Competition 2025 💳`;

  const html = `
    ${getEmailHeader()}
    
    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Thank you for your payment! This email confirms that we have successfully received your payment for <strong>Archalley Competition 2025</strong>.
      </p>

      <div style="background: #f9f9f9; padding: 25px; margin: 0 0 30px 0; border-radius: 8px;">
        <h3 style="color: #333; margin: 0 0 20px 0; font-size: 20px; text-align: center;">Payment Receipt</h3>
        
        <table style="width: 100%; margin-bottom: 20px; color: #333; font-size: 14px;">
          <tr style="border-bottom: 2px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #666;">Order ID:</td>
            <td style="padding: 12px 0; text-align: right; font-family: monospace; font-weight: bold; color: #FFA000;">${paymentOrderId}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #666;">Registration Number:</td>
            <td style="padding: 12px 0; text-align: right; font-family: monospace; font-weight: bold; color: #FFA000;">${registration.registrationNumber}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #666;">Date:</td>
            <td style="padding: 12px 0; text-align: right; color: #333;">${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</td>
          </tr>
        </table>

        <table style="width: 100%; margin-top: 20px;">
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 12px; font-weight: bold; color: #333;">Item</td>
            <td style="padding: 12px; text-align: right; font-weight: bold; color: #333;">Amount</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; color: #333;">
              <strong>Archalley Competition 2025</strong><br>
              <span style="font-size: 14px; color: #666;">${registrationType.name}</span>
            </td>
            <td style="padding: 12px; text-align: right; color: #333;">LKR ${registration.amountPaid.toLocaleString()}</td>
          </tr>
          <tr style="background-color: #fff4e6; border-top: 2px solid #FFA000;">
            <td style="padding: 15px; font-weight: bold; font-size: 18px; color: #333;">Total Paid</td>
            <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px; color: #FFA000;">LKR ${registration.amountPaid.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 0 0 30px 0; border-radius: 4px;">
        <p style="color: #2e7d32; margin: 0; line-height: 1.8; font-size: 14px;">
          ✅ <strong>Payment Status:</strong> Completed<br>
          💳 <strong>Payment Method:</strong> PayHere Gateway<br>
          📧 <strong>Billed To:</strong> ${userEmail}
        </p>
      </div>

      <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 0; padding-top: 20px; border-top: 1px solid #eee;">
        <strong>Important:</strong> This is an automated receipt. Please keep it for your records. If you have any questions about this payment, contact us with your order ID.
      </p>
    </div>
    ${getEmailFooter()}
  `;

  const text = `
Payment Receipt - Archalley Competition 2025 

Hi ${userName},

Thank you for your payment! This confirms your payment for Archalley Competition 2025.

Invoice Details:
- Order ID: ${paymentOrderId}
- Registration Number: ${registration.registrationNumber}
- Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

Item: Archalley Competition 2025 - ${registrationType.name}
Amount Paid: LKR ${registration.amountPaid.toLocaleString()}

Payment Status: Completed 
Payment Method: PayHere Gateway

Billed To: ${userEmail}

Important: This is an automated receipt. Please keep it for your records.

Need help? Contact us at projects@archalley.com

Follow us on:
- Facebook: https://facebook.com/archalley
- Instagram: https://www.instagram.com/archalley_insta/
- LinkedIn: https://www.linkedin.com/company/archalleypage/

© ${new Date().getFullYear()} Archalley. All rights reserved.
  `;

  return sendEmail(userEmail, subject, html, text);
};

// 3. Competition Guidelines Email
export const sendCompetitionGuidelinesEmail = async (data: RegistrationEmailData) => {
  const { competition, userName, userEmail, registration } = data;

  const subject = `Competition Guidelines - Archalley Competition 2025 📋`;

  const html = `
    ${getEmailHeader()}
    
    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Here are the important guidelines and requirements for <strong>Archalley Competition 2025</strong>. Please read carefully to ensure your submission meets all requirements.
      </p>

      <div style="background: #f9f9f9; padding: 25px; border-radius: 8px; margin: 0 0 30px 0;">
        <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Your Registration</h3>
        <p style="color: #666; margin: 0; font-size: 14px;">
          <strong>Registration Number:</strong> <span style="color: #FFA000; font-family: monospace; font-weight: bold;">${registration.registrationNumber}</span>
        </p>
      </div>

      <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Competition Overview</h3>
      <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0; font-size: 14px;">
        ${competition.description || 'Design an innovative Christmas tree that showcases creativity, sustainability, and architectural thinking. Your design should reflect the spirit of the season while demonstrating unique conceptual approaches.'}
      </p>

      <!-- Important Dates -->
      <div style="background: #fff4e6; padding: 20px; border-radius: 8px; border-left: 4px solid #FFA000; margin: 0 0 30px 0;">
        <h3 style="color: #FFA000; margin: 0 0 15px 0; font-size: 16px;"> Important Dates</h3>
        <p style="color: #333; margin: 0 0 10px 0; font-size: 14px;"><strong>Submission Deadline:</strong></p>
        <p style="color: #FFA000; margin: 0 0 20px 0; font-size: 18px; font-weight: bold;">
          ${new Date(competition.endDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
        <p style="color: #333; margin: 0; font-size: 14px;">
          <strong>Competition Period:</strong> ${new Date(competition.startDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric'
          })} - ${new Date(competition.endDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
      </div>

      <!-- Prizes -->
      <div style="background: #f9f9f9; padding: 25px; border-radius: 8px; margin: 0 0 30px 0;">
        <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">🏆 Prize Pool</h3>
        ${getPrizeValue(competition, 'first') ? `<p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">🥇 <strong>First Prize:</strong> <span style="color: #FFA000; font-weight: bold;">LKR ${getPrizeValue(competition, 'first')!.toLocaleString()}</span></p>` : ''}
        ${getPrizeValue(competition, 'second') ? `<p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">🥈 <strong>Second Prize:</strong> <span style="color: #FFA000; font-weight: bold;">LKR ${getPrizeValue(competition, 'second')!.toLocaleString()}</span></p>` : ''}
        ${getPrizeValue(competition, 'third') ? `<p style="color: #666; margin: 0; font-size: 14px;">🥉 <strong>Third Prize:</strong> <span style="color: #FFA000; font-weight: bold;">LKR ${getPrizeValue(competition, 'third')!.toLocaleString()}</span></p>` : ''}
      </div>

      <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;"> Submission Requirements</h3>
      <ul style="color: #666; line-height: 1.8; margin: 0 0 30px 0; font-size: 14px; padding-left: 20px;">
        <li><strong>File Format:</strong> PDF, JPG, or PNG (Portfolio/Presentation format)</li>
        <li><strong>Maximum File Size:</strong> 50 MB</li>
        <li>Include all required drawings, renders, and documentation</li>
        <li>Clearly label your submission with your registration number</li>
        <li>Submit through your dashboard before the deadline</li>
        <li>Multiple submissions allowed (latest submission will be considered)</li>
      </ul>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${competition.slug}" 
           style="background: #FFA000; 
                  color: white; 
                  padding: 15px 40px; 
                  text-decoration: none; 
                  border-radius: 8px; 
                  display: inline-block; 
                  font-weight: bold; 
                  font-size: 16px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  margin-right: 10px;">
          View Competition Details
        </a>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/registrations" 
           style="background: #333; 
                  color: white; 
                  padding: 15px 40px; 
                  text-decoration: none; 
                  border-radius: 8px; 
                  display: inline-block; 
                  font-weight: bold; 
                  font-size: 16px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          Upload Submission
        </a>
      </div>

      <div style="background: #fee; border-left: 4px solid #f44; padding: 20px; margin: 30px 0 0 0; border-radius: 4px;">
        <p style="color: #c00; margin: 0; line-height: 1.6; font-size: 14px;">
          <strong>⚠️ Important:</strong> Late submissions will NOT be accepted. Upload your work well before the deadline to avoid technical issues.
        </p>
      </div>
    </div>
    ${getEmailFooter()}
  `;

  const text = `
Competition Guidelines - Archalley Competition 2025 📋

Hi ${userName},

Here are the important guidelines and requirements for Archalley Competition 2025.

Registration Number: ${registration.registrationNumber}

Important Dates:
- Submission Deadline: ${new Date(competition.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
- Competition Period: ${new Date(competition.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${new Date(competition.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

Prize Pool:
${getPrizeValue(competition, 'first') ? `🥇 First Prize: LKR ${getPrizeValue(competition, 'first')!.toLocaleString()}` : ''}
${getPrizeValue(competition, 'second') ? `🥈 Second Prize: LKR ${getPrizeValue(competition, 'second')!.toLocaleString()}` : ''}
${getPrizeValue(competition, 'third') ? `🥉 Third Prize: LKR ${getPrizeValue(competition, 'third')!.toLocaleString()}` : ''}

Submission Requirements:
- File Format: PDF, JPG, or PNG (Portfolio/Presentation format)
- Maximum File Size: 50 MB
- Include all required drawings, renders, and documentation
- Clearly label your submission with your registration number
- Submit through your dashboard before the deadline
- Multiple submissions allowed (latest submission will be considered)

View competition details: ${process.env.NEXT_PUBLIC_APP_URL}/events/${competition.slug}
Upload submission: ${process.env.NEXT_PUBLIC_APP_URL}/profile/registrations

⚠️ Important: Late submissions will NOT be accepted. Upload your work well before the deadline to avoid technical issues.

Need help? Contact us at projects@archalley.com

Follow us on:
- Facebook: https://facebook.com/archalley
- Instagram: https://www.instagram.com/archalley_insta/
- LinkedIn: https://www.linkedin.com/company/archalleypage/

© ${new Date().getFullYear()} Archalley. All rights reserved.
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
  const subject = `Reminder: ${daysRemaining} Days Left - Archalley Competition 2025 ⏰`;

  const html = `
    ${getEmailHeader()}
    
    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        This is a friendly reminder that the submission deadline for <strong>Archalley Competition 2025</strong> is approaching. Don't miss your chance to showcase your creativity!
      </p>

      <div style="background: #fff4e6; border: 3px solid #FFA000; padding: 30px; margin: 0 0 30px 0; border-radius: 12px; text-align: center;">
        <h3 style="color: #FFA000; margin: 0 0 10px 0; font-size: 16px; text-transform: uppercase;">Time Remaining</h3>
        <p style="color: #FFA000; margin: 0; font-size: 48px; font-weight: bold; line-height: 1;">${daysRemaining}</p>
        <p style="color: #333; margin: 10px 0 0 0; font-size: 20px; font-weight: bold;">Day${daysRemaining > 1 ? 's' : ''} Left</p>
        <p style="color: #666; margin: 20px 0 0 0; font-size: 14px;">
          <strong>Deadline:</strong> ${new Date(competition.endDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      <div style="background: #f9f9f9; padding: 20px; margin: 0 0 30px 0; border-radius: 8px;">
        <p style="color: #666; margin: 0; font-size: 14px;">
          <strong>Your Registration Number:</strong> <span style="color: #FFA000; font-family: monospace; font-weight: bold;">${registrationNumber}</span>
        </p>
      </div>

      <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Before You Submit</h3>
      <ul style="color: #666; line-height: 1.8; margin: 0 0 30px 0; font-size: 14px; padding-left: 20px;">
        <li>✅ Review all competition requirements carefully</li>
        <li>✅ Check file format (PDF, JPG, PNG) and size limits (max 50 MB)</li>
        <li>✅ Include your registration number in the submission</li>
        <li>✅ Test your files to ensure they open correctly</li>
        <li>✅ Submit early to avoid last-minute technical issues</li>
      </ul>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/registrations" 
           style="background: #FFA000; 
                  color: white; 
                  padding: 18px 50px; 
                  text-decoration: none; 
                  border-radius: 8px; 
                  display: inline-block; 
                  font-weight: bold; 
                  font-size: 18px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          Upload Your Submission Now
        </a>
      </div>

      <div style="background: #fee; border-left: 4px solid #f44; padding: 20px; margin: 30px 0 0 0; border-radius: 4px;">
        <p style="color: #c00; margin: 0; line-height: 1.6; font-size: 14px;">
          <strong>⚠️ Important:</strong> Submissions received after the deadline will NOT be accepted. We recommend submitting at least 24 hours before the deadline.
        </p>
      </div>
    </div>
    ${getEmailFooter()}
  `;

  const text = `
Reminder: ${daysRemaining} Days Left - Archalley Competition 2025 ⏰

Hi ${userName},

Only ${daysRemaining} day(s) remaining until the competition end!

Deadline: ${new Date(competition.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
Your Registration Number: ${registrationNumber}

Before You Submit:
- ✅ Review all competition requirements carefully
- ✅ Check file format (PDF, JPG, PNG) and size limits (max 50 MB)
- ✅ Include your registration number in the submission
- ✅ Test your files to ensure they open correctly
- ✅ Submit early to avoid last-minute technical issues

Upload now: ${process.env.NEXT_PUBLIC_APP_URL}/profile/registrations

⚠️ Important: Submissions received after the deadline will NOT be accepted. We recommend submitting at least 24 hours before the deadline.

Need help? Contact us at projects@archalley.com

Follow us on:
- Facebook: https://facebook.com/archalley
- Instagram: https://www.instagram.com/archalley_insta/
- LinkedIn: https://www.linkedin.com/company/archalleypage/

© ${new Date().getFullYear()} Archalley. All rights reserved.
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

    console.log('📨 About to send email with HTML length:', html.length, 'chars');
    console.log('📨 HTML contains #FFA000 orange:', html.includes('#FFA000') ? 'YES ✅' : 'NO ❌');
    console.log('📨 HTML first 200 chars:', html.substring(0, 200));

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
