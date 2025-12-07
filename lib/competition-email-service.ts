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
  
  const subject = `Registration Confirmed - Archalley Competition 2025 - Christmas in Future 🎉`;

  const html = `
    ${getEmailHeader()}
    
    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Congratulations! Your registration for <strong>Archalley Competition 2025 - Christmas in Future</strong> has been successfully confirmed. We're excited to see your creative work!
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

  const subject = `Payment Receipt - Archalley Competition 2025 - Christmas in Future 💳`;

  const html = `
    ${getEmailHeader()}
    
    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Thank you for your payment! This email confirms that we have successfully received your payment for <strong>Archalley Competition 2025 - Christmas in Future</strong>.
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
              <strong>Archalley Competition 2025 - Christmas in Future</strong><br>
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

  const subject = `Competition Guidelines - Archalley Competition 2025 - Christmas in Future 📋`;

  const html = `
    ${getEmailHeader()}
    
    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Here are the important guidelines and requirements for <strong>Archalley Competition 2025 - Christmas in Future</strong>. Please read carefully to ensure your submission meets all requirements.
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
  const subject = `Reminder: ${daysRemaining} Days Left - Archalley Competition 2025 - Christmas in Future ⏰`;

  const html = `
    ${getEmailHeader()}
    
    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        This is a friendly reminder that the submission deadline for <strong>Archalley Competition 2025 - Christmas in Future</strong> is approaching. Don't miss your chance to showcase your creativity!
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

// 5. Bank Transfer Pending Email
export const sendBankTransferPendingEmail = async (data: {
  registration: CompetitionRegistration;
  competition: Competition;
  registrationType: CompetitionRegistrationType;
  userName: string;
  userEmail: string;
}) => {
  const { registration, registrationType, userName, userEmail } = data;

  console.log('📧 Sending Bank Transfer Pending Email to:', userEmail);
  
  const subject = `Payment Pending - Archalley Competition 2025 - Christmas in Future `;

  const html = `
    ${getEmailHeader()}
    
    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Thank you for submitting your bank transfer details for <strong>Archalley Competition 2025 - Christmas in Future</strong>!
      </p>

      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Your registration is currently <strong style="color: #FFA000;">awaiting payment verification</strong>. Our team will review your bank slip within 24-48 hours.
      </p>

      <!-- Registration Details Box -->
      <div style="background: #fff4e6; padding: 25px; border-radius: 8px; border-left: 4px solid #FFA000; margin: 30px 0;">
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
            <td style="padding: 8px 0;"><strong>Amount:</strong></td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">LKR ${registration.amountPaid.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Status:</strong></td>
            <td style="padding: 8px 0; text-align: right; color: #FFA000; font-weight: bold;">Payment Verification Pending</td>
          </tr>
        </table>
      </div>

      <!-- What Happens Next -->
      <div style="background: #f9f9f9; padding: 25px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;"> What Happens Next</h3>
        <ol style="color: #666; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
          <li style="margin-bottom: 10px;">Our admin team will verify your bank transfer slip</li>
          <li style="margin-bottom: 10px;">Verification typically takes 24-48 hours</li>
          <li style="margin-bottom: 10px;">You will receive a confirmation email once verified</li>
          <li style="margin-bottom: 10px;">Your registration will be activated after approval</li>
        </ol>
      </div>

      <!-- Important Note -->
      <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="color: #1565c0; margin: 0; line-height: 1.6; font-size: 14px;">
          <strong>Keep Checking Your Email:</strong> We will send you another email once your payment is verified and your registration is confirmed.
        </p>
      </div>

      <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
        If you have any questions or concerns, please contact us at <a href="mailto:projects@archalley.com" style="color: #FFA000; text-decoration: none;">projects@archalley.com</a>
      </p>
    </div>
    ${getEmailFooter()}
  `;

  const text = `
Bank Transfer Pending - Archalley Competition 2025

Hi ${userName},

Thank you for submitting your bank transfer details for Archalley Competition 2025 - Christmas in Future!

Your registration is currently awaiting payment verification. Our team will review your bank slip within 24-48 hours.

Registration Details:
- Registration Number: ${registration.registrationNumber}
- Category: ${registrationType.name}
- Amount: LKR ${registration.amountPaid.toLocaleString()}
- Status: Payment Verification Pending

What Happens Next:
1. Our admin team will verify your bank transfer slip
2. Verification typically takes 24-48 hours
3. You will receive a confirmation email once verified
4. Your registration will be activated after approval

Keep Checking Your Email: We will send you another email once your payment is verified.

If you have any questions, contact us at projects@archalley.com

Best regards,
Archalley Team
  `;

  const transporter = createTransporter();

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: userEmail,
      subject,
      html,
      text,
    });

    console.log('✅ Bank transfer pending email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending bank transfer pending email:', error);
    return false;
  }
};

// =====================================================
// CONSOLIDATED EMAIL FUNCTIONS (Multiple Registrations)
// =====================================================

interface ConsolidatedRegistrationData {
  registrations: Array<{
    registration: CompetitionRegistration;
    registrationType: CompetitionRegistrationType;
    members: any[];
  }>;
  competition: Competition;
  userName: string;
  userEmail: string;
  paymentOrderId: string;
  totalAmount: number;
}

/**
 * Send consolidated registration confirmation for multiple types
 * Shows all registration types and total amount in one email
 */
export const sendConsolidatedRegistrationConfirmationEmail = async (
  data: ConsolidatedRegistrationData
) => {
  const { registrations, competition, userName, userEmail, totalAmount } = data;

  console.log('📧 Sending Consolidated Registration Confirmation Email to:', userEmail);
  console.log('   Registration count:', registrations.length);
  
  const subject = `Registration Confirmed - Archalley Competition 2025 - Christmas in Future 🎉`;

  // Build registration list HTML
  const registrationListHTML = registrations.map((item, index) => `
    <div style="background: ${index % 2 === 0 ? '#f9f9f9' : '#fff'}; padding: 20px; border-radius: 8px; margin: ${index > 0 ? '15px' : '0'} 0;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
        <div>
          <h4 style="color: #333; font-size: 16px; margin: 0 0 10px 0;">${item.registrationType.name}</h4>
          <p style="color: #666; font-size: 14px; margin: 0;">
            <strong>Registration #:</strong> 
            <span style="font-family: monospace; color: #FFA000; font-weight: bold;">${item.registration.registrationNumber}</span>
          </p>
        </div>
        <div style="text-align: right;">
          <p style="color: #333; font-size: 16px; font-weight: bold; margin: 0;">
            LKR ${item.registration.amountPaid.toLocaleString()}
          </p>
        </div>
      </div>
      
      ${item.members && item.members.length > 0 ? `
        <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 15px;">
          <p style="color: #666; font-size: 13px; margin: 0 0 10px 0; font-weight: 600;">Team Members (${item.members.length}):</p>
          ${item.members.map((member: any, idx: number) => `
            <div style="padding: 8px 0; ${idx < item.members.length - 1 ? 'border-bottom: 1px dashed #e5e7eb;' : ''}">
              <span style="color: #333; font-size: 13px;">${idx === 0 ? '👤 Lead: ' : '👥 Member: '}${member.name}</span><br>
              <span style="color: #999; font-size: 12px;">${member.email}</span>
              ${member.role ? `<br><span style="color: #999; font-size: 12px;">Role: ${member.role}</span>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');

  const html = `
    ${getEmailHeader()}
    
    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Congratulations! Your registration for <strong>Archalley Competition 2025 - Christmas in Future</strong> has been successfully confirmed. We're excited to see your creative work!
      </p>

      <!-- All Registrations Summary -->
      <div style="background: #fff4e6; border-left: 4px solid #FFA000; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="color: #FFA000; margin: 0 0 10px 0; font-size: 18px;">Your Registrations (${registrations.length} ${registrations.length === 1 ? 'Type' : 'Types'})</h3>
        <p style="color: #666; font-size: 14px; margin: 0;">
          You have registered for ${registrations.length} ${registrations.length === 1 ? 'category' : 'categories'} in this competition.
        </p>
      </div>

      <!-- Registration Details -->
      ${registrationListHTML}

      <!-- Total Payment -->
      <div style="background: linear-gradient(135deg, #FFA000 0%, #FF8F00 100%); padding: 25px; border-radius: 8px; margin: 30px 0; text-align: center;">
        <p style="color: #fff; font-size: 14px; margin: 0 0 10px 0; opacity: 0.9;">Total Amount Paid</p>
        <p style="color: #fff; font-size: 32px; font-weight: bold; margin: 0;">LKR ${totalAmount.toLocaleString()}</p>
      </div>

      <!-- Important Dates -->
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #FFA000; margin: 0 0 15px 0; font-size: 16px;">Important Dates</h3>
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
          <li>Prepare your design submissions according to specifications</li>
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
        <strong>Important:</strong> Please save this email for your records. You'll need your registration numbers for any inquiries about your submissions.
      </p>
    </div>
    ${getEmailFooter()}
  `;

  const text = `
Registration Confirmed - Archalley Competition 2025 🎉

Hi ${userName},

Congratulations! Your registration for Archalley Competition 2025 has been successfully confirmed. We're excited to see your creative work!

YOUR REGISTRATIONS (${registrations.length} ${registrations.length === 1 ? 'Type' : 'Types'}):

${registrations.map((item, index) => `
${index + 1}. ${item.registrationType.name}
   Registration #: ${item.registration.registrationNumber}
   Amount: LKR ${item.registration.amountPaid.toLocaleString()}
   ${item.members && item.members.length > 0 ? `
   Team Members (${item.members.length}):
   ${item.members.map((m: any, i: number) => `   ${i + 1}. ${m.name} (${m.email})${m.role ? ` - ${m.role}` : ''}`).join('\n   ')}
   ` : ''}
`).join('\n')}

TOTAL AMOUNT PAID: LKR ${totalAmount.toLocaleString()}

Important Dates:
- Submission Deadline: ${new Date(competition.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Competition Period: ${new Date(competition.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${new Date(competition.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

What's Next?
1. Review the competition guidelines and requirements carefully
2. Prepare your design submissions according to specifications
3. Submit your work before the deadline
4. Wait for the results announcement

View your registrations: ${process.env.NEXT_PUBLIC_APP_URL}/profile/registrations

Important: Please save this email for your records. You'll need your registration numbers for any inquiries about your submissions.

Need help? Contact us at projects@archalley.com

© ${new Date().getFullYear()} Archalley. All rights reserved.
  `;

  return sendEmail(userEmail, subject, html, text);
};

/**
 * Send consolidated payment receipt for multiple types
 * Shows all registration types and total payment in one invoice
 */
export const sendConsolidatedPaymentReceiptEmail = async (
  data: ConsolidatedRegistrationData
) => {
  const { registrations, userName, userEmail, paymentOrderId, totalAmount } = data;

  console.log('📧 Sending Consolidated Payment Receipt Email to:', userEmail);
  
  const subject = `Payment Receipt - Archalley Competition 2025 - Christmas in Future 💳`;

  // Build invoice items HTML
  const invoiceItemsHTML = registrations.map((item) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; color: #333;">
        <strong>${item.registrationType.name}</strong><br>
        <span style="font-size: 12px; color: #999; font-family: monospace;">Reg #: ${item.registration.registrationNumber}</span>
      </td>
      <td style="padding: 12px; text-align: right; color: #333;">LKR ${item.registration.amountPaid.toLocaleString()}</td>
    </tr>
  `).join('');

  const html = `
    ${getEmailHeader()}
    
    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Thank you for your payment! This email confirms that we have successfully received your payment for <strong>Archalley Competition 2025 - Christmas in Future</strong>.
      </p>

      <div style="background: #f9f9f9; padding: 25px; margin: 0 0 30px 0; border-radius: 8px;">
        <h3 style="color: #333; margin: 0 0 20px 0; font-size: 20px; text-align: center;">Payment Receipt</h3>
        
        <table style="width: 100%; margin-bottom: 20px; color: #333; font-size: 14px;">
          <tr style="border-bottom: 2px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #666;">Order ID:</td>
            <td style="padding: 12px 0; text-align: right; font-family: monospace; font-weight: bold; color: #FFA000;">${paymentOrderId}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #666;">Date:</td>
            <td style="padding: 12px 0; text-align: right; color: #333;">${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #666;">Number of Registrations:</td>
            <td style="padding: 12px 0; text-align: right; color: #333; font-weight: bold;">${registrations.length} ${registrations.length === 1 ? 'Type' : 'Types'}</td>
          </tr>
        </table>

        <table style="width: 100%; margin-top: 20px;">
          <tr style="background-color: #f9f9f9;">
            <td style="padding: 12px; font-weight: bold; color: #333;">Item</td>
            <td style="padding: 12px; text-align: right; font-weight: bold; color: #333;">Amount</td>
          </tr>
          ${invoiceItemsHTML}
          <tr style="background-color: #fff4e6; border-top: 2px solid #FFA000;">
            <td style="padding: 15px; font-weight: bold; font-size: 18px; color: #333;">Total Paid</td>
            <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px; color: #FFA000;">LKR ${totalAmount.toLocaleString()}</td>
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
- Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
- Number of Registrations: ${registrations.length} ${registrations.length === 1 ? 'Type' : 'Types'}

ITEMS:
${registrations.map((item, index) => `${index + 1}. ${item.registrationType.name} (Reg #: ${item.registration.registrationNumber})
   LKR ${item.registration.amountPaid.toLocaleString()}`).join('\n')}

TOTAL PAID: LKR ${totalAmount.toLocaleString()}

Payment Status: Completed 
Payment Method: PayHere Gateway
Billed To: ${userEmail}

Important: This is an automated receipt. Please keep it for your records.

Need help? Contact us at projects@archalley.com

© ${new Date().getFullYear()} Archalley. All rights reserved.
  `;

  return sendEmail(userEmail, subject, html, text);
};

/**
 * Send consolidated bank transfer pending email for multiple types
 */
export const sendConsolidatedBankTransferPendingEmail = async (
  data: ConsolidatedRegistrationData
) => {
  const { registrations, userName, userEmail, totalAmount } = data;

  console.log('📧 Sending Consolidated Bank Transfer Pending Email to:', userEmail);
  
  const subject = `Payment Pending - Bank Transfer Instructions - Archalley Competition 2025 ⏳`;

  // Build registration list HTML
  const registrationListHTML = registrations.map((item) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; color: #333;">
        <strong>${item.registrationType.name}</strong><br>
        <span style="font-size: 12px; color: #999; font-family: monospace;">Reg #: ${item.registration.registrationNumber}</span>
      </td>
      <td style="padding: 12px; text-align: right; color: #333;">LKR ${item.registration.amountPaid.toLocaleString()}</td>
    </tr>
  `).join('');

  const html = `
    ${getEmailHeader()}
    
    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Thank you for submitting your bank transfer details for <strong>Archalley Competition 2025 - Christmas in Future</strong>!
      </p>

      <div style="background: #fff4e6; border-left: 4px solid #FFA000; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="color: #FFA000; margin: 0 0 10px 0; font-size: 16px;"> Payment Verification Pending</h3>
        <p style="color: #666; margin: 0; font-size: 14px;">
          Your registration is currently awaiting payment verification. Our team will review your bank slip within 24-48 hours.
        </p>
      </div>

      <!-- Registration Summary -->
      <div style="background: #f9f9f9; padding: 25px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Your Registrations (${registrations.length} ${registrations.length === 1 ? 'Type' : 'Types'})</h3>
        <table style="width: 100%;">
          ${registrationListHTML}
          <tr style="background-color: #fff4e6; border-top: 2px solid #FFA000;">
            <td style="padding: 15px; font-weight: bold; font-size: 16px; color: #333;">Total Amount</td>
            <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 16px; color: #FFA000;">LKR ${totalAmount.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <!-- What Happens Next -->
      <div style="background: #f9f9f9; padding: 25px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;"> What Happens Next</h3>
        <ol style="color: #666; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
          <li style="margin-bottom: 10px;">Our admin team will verify your bank transfer slip</li>
          <li style="margin-bottom: 10px;">Verification typically takes 24-48 hours</li>
          <li style="margin-bottom: 10px;">You will receive a confirmation email once verified</li>
          <li style="margin-bottom: 10px;">All your registrations will be activated after approval</li>
        </ol>
      </div>

      <!-- Important Note -->
      <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="color: #1565c0; margin: 0; line-height: 1.6; font-size: 14px;">
          <strong>Keep Checking Your Email:</strong> We will send you another email once your payment is verified and all your registrations are confirmed.
        </p>
      </div>

      <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
        If you have any questions or concerns, please contact us at <a href="mailto:projects@archalley.com" style="color: #FFA000; text-decoration: none;">projects@archalley.com</a>
      </p>
    </div>
    ${getEmailFooter()}
  `;

  const text = `
Bank Transfer Pending - Archalley Competition 2025

Hi ${userName},

Thank you for submitting your bank transfer details for Archalley Competition 2025!

 PAYMENT VERIFICATION PENDING
Your registrations are awaiting payment verification. Our team will review your bank slip within 24-48 hours.

YOUR REGISTRATIONS (${registrations.length} ${registrations.length === 1 ? 'Type' : 'Types'}):

${registrations.map((item, index) => `${index + 1}. ${item.registrationType.name}
   Registration #: ${item.registration.registrationNumber}
   Amount: LKR ${item.registration.amountPaid.toLocaleString()}`).join('\n\n')}

TOTAL AMOUNT: LKR ${totalAmount.toLocaleString()}

WHAT HAPPENS NEXT:
1. Our admin team will verify your bank transfer slip
2. Verification typically takes 24-48 hours
3. You will receive a confirmation email once verified
4. All your registrations will be activated after approval

Keep Checking Your Email: We will send you another email once your payment is verified.

If you have any questions, contact us at projects@archalley.com

Best regards,
Archalley Team
  `;

  const transporter = createTransporter();

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: userEmail,
      subject,
      html,
      text,
    });

    console.log('✅ Consolidated bank transfer pending email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending consolidated bank transfer pending email:', error);
    return false;
  }
};

// =====================================================
// ADMIN VERIFICATION EMAIL FUNCTIONS
// =====================================================

interface AdminVerificationEmailData {
  registration: CompetitionRegistration;
  competition: Competition;
  registrationType: CompetitionRegistrationType;
  userName: string;
  userEmail: string;
}

/**
 * Send payment verified/approved email after admin verification
 */
export const sendPaymentVerifiedEmail = async (data: AdminVerificationEmailData) => {
  const { registration, competition, registrationType, userName, userEmail } = data;

  console.log('📧 Sending Payment Verified Email to:', userEmail);
  
  const subject = `Payment Verified - Registration Confirmed - Archalley Competition 2025 `;

  const html = `
    ${getEmailHeader()}
    
    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Great news! Your bank transfer payment for <strong>Archalley Competition 2025 - Christmas in Future</strong> has been successfully verified.
      </p>

      <!-- Success Status -->
      <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="color: #2e7d32; margin: 0; line-height: 1.8; font-size: 16px; font-weight: bold;">
           Payment Verified - Registration Confirmed
        </p>
      </div>

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
            <td style="padding: 8px 0;"><strong>Status:</strong></td>
            <td style="padding: 8px 0; text-align: right; color: #4caf50; font-weight: bold;">Confirmed</td>
          </tr>
        </table>
      </div>

      <!-- What's Next -->
      <div style="margin: 30px 0;">
        <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0;"> What's Next?</h3>
        <ul style="color: #666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Review the competition guidelines carefully</li>
          <li>Prepare your design submission according to specifications</li>
          <li>Submit your work before the deadline</li>
          <li>Wait for the results announcement</li>
        </ul>
      </div>

      <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #eee;">
        <strong>Important:</strong> Your registration is now active. Please save this email for your records.
      </p>
    </div>
    ${getEmailFooter()}
  `;

  const text = `
Payment Verified - Registration Confirmed 

Hi ${userName},

Great news! Your bank transfer payment for Archalley Competition 2025 has been successfully verified.

 PAYMENT VERIFIED - REGISTRATION CONFIRMED

Registration Details:
- Registration Number: ${registration.registrationNumber}
- Category: ${registrationType.name}
- Amount Paid: LKR ${registration.amountPaid.toLocaleString()}
- Status:  Confirmed

Important Dates:
- Submission Deadline: ${new Date(competition.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Competition Period: ${new Date(competition.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${new Date(competition.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

What's Next?
1. Review the competition guidelines carefully
2. Prepare your design submission according to specifications
3. Submit your work before the deadline
4. Wait for the results announcement

View your registrations: ${process.env.NEXT_PUBLIC_APP_URL}/profile/registrations

Important: Your registration is now active. Please save this email for your records.

Need help? Contact us at projects@archalley.com

© ${new Date().getFullYear()} Archalley. All rights reserved.
  `;

  return sendEmail(userEmail, subject, html, text);
};

/**
 * Send payment rejected email after admin rejection
 */
export const sendPaymentRejectedEmail = async (
  data: AdminVerificationEmailData & { rejectReason?: string }
) => {
  const { registration, registrationType, userName, userEmail, rejectReason } = data;

  console.log('📧 Sending Payment Rejected Email to:', userEmail);
  console.log('   Reject Reason:', rejectReason || 'Not specified');
  
  const subject = `Payment Verification Failed - Archalley Competition 2025 `;

  const html = `
    ${getEmailHeader()}
    
    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        We regret to inform you that we were unable to verify your bank transfer payment for <strong>Archalley Competition 2025 - Christmas in Future</strong>.
      </p>

      <!-- Error Status -->
      <div style="background: #ffebee; border-left: 4px solid #f44336; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="color: #c62828; margin: 0; line-height: 1.8; font-size: 16px; font-weight: bold;">
          Payment Verification Failed
        </p>
      </div>

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
            <td style="padding: 8px 0;"><strong>Amount:</strong></td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">LKR ${registration.amountPaid.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Status:</strong></td>
            <td style="padding: 8px 0; text-align: right; color: #f44336; font-weight: bold;"> Payment Rejected</td>
          </tr>
        </table>
      </div>

      ${rejectReason ? `
        <!-- Rejection Reason -->
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 30px 0; border-radius: 4px;">
          <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">⚠️ Reason for Rejection</h3>
          <p style="color: #856404; margin: 0; line-height: 1.6; font-size: 14px;">
            ${rejectReason}
          </p>
        </div>
      ` : ''}

      <!-- Common Reasons -->
      <div style="background: #f9f9f9; padding: 25px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Common Reasons for Rejection</h3>
        <ul style="color: #666; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
          <li>Bank slip image is unclear or unreadable</li>
          <li>Transfer amount doesn't match registration fee</li>
          <li>Bank slip is from a different person</li>
          <li>Transfer date is outside the valid period</li>
          <li>Bank details don't match our account</li>
        </ul>
      </div>

      <!-- What to Do Next -->
      <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 16px;"> What Can You Do?</h3>
        <ul style="color: #1565c0; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
          <li>Review your bank slip and ensure all details are correct</li>
          <li>If you believe this is an error, contact us with your registration number</li>
          <li>You can submit a new registration with a clear bank slip</li>
          <li>Alternatively, try paying via PayHere online payment</li>
        </ul>
      </div>

      <!-- Support Contact -->
      <div style="text-align: center; margin: 40px 0;">
        <p style="color: #666; font-size: 14px; margin: 0 0 15px 0;">
          Need help? Our support team is here to assist you.
        </p>
        <p style="color: #333; font-size: 16px; margin: 0;">
           Email: <a href="mailto:projects@archalley.com" style="color: #FFA000; text-decoration: none; font-weight: bold;">projects@archalley.com</a>
        </p>
        ${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ? `
          <p style="color: #333; font-size: 16px; margin: 10px 0 0 0;">
             WhatsApp: ${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}
          </p>
        ` : ''}
      </div>

      <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #eee;">
        We apologize for any inconvenience. Please contact us if you have any questions about this decision.
      </p>
    </div>
    ${getEmailFooter()}
  `;

  const text = `
Payment Verification Failed 

Hi ${userName},

We regret to inform you that we were unable to verify your bank transfer payment for Archalley Competition 2025.

 PAYMENT VERIFICATION FAILED

Registration Details:
- Registration Number: ${registration.registrationNumber}
- Category: ${registrationType.name}
- Amount: LKR ${registration.amountPaid.toLocaleString()}
- Status:  Payment Rejected

${rejectReason ? `
REASON FOR REJECTION:
${rejectReason}
` : ''}

COMMON REASONS FOR REJECTION:
- Bank slip image is unclear or unreadable
- Transfer amount doesn't match registration fee
- Bank slip is from a different person
- Transfer date is outside the valid period
- Bank details don't match our account

WHAT CAN YOU DO?
1. Review your bank slip and ensure all details are correct
2. If you believe this is an error, contact us with your registration number
3. You can submit a new registration with a clear bank slip
4. Alternatively, try paying via PayHere online payment

NEED HELP?
Email: projects@archalley.com
${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ? `WhatsApp: ${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}` : ''}

We apologize for any inconvenience. Please contact us if you have any questions.

© ${new Date().getFullYear()} Archalley. All rights reserved.
  `;

  return sendEmail(userEmail, subject, html, text);
};

// NEW: Comprehensive confirmation email (replaces 3 separate emails)
export const sendComprehensiveConfirmationEmail = async (data: RegistrationEmailData & { paymentMethod?: string }) => {
  const { registration, competition, registrationType, userName, userEmail, members, paymentOrderId, paymentMethod = 'PayHere' } = data;

  console.log('📧 Sending Comprehensive Confirmation Email to:', userEmail);
  
  const subject = `Registration Confirmed - Archalley Competition 2025 `;

  const html = `
    ${getEmailHeader()}
    
    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Congratulations! Your registration for <strong>Archalley Competition 2025 - Christmas in Future</strong> has been successfully confirmed. We're excited to see your creative work!
      </p>

      <!-- Registration Details -->
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
            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #FFA000;">LKR ${registration.amountPaid.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Payment Method:</strong></td>
            <td style="padding: 8px 0; text-align: right;">${paymentMethod}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Order ID:</strong></td>
            <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px;">${paymentOrderId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Country:</strong></td>
            <td style="padding: 8px 0; text-align: right;">${registration.country}</td>
          </tr>
        </table>
      </div>

      ${members && members.length > 1 ? `
        <div style="background: #f9f9f9; padding: 25px; border-radius: 8px; margin: 30px 0;">
          <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0;">Team Members (${members.length})</h3>
          ${members.map((member: any, idx: number) => `
            <div style="padding: 12px 0; ${idx < members.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
              <strong style="color: #333; font-size: 14px;">${idx === 0 ? '👤 Team Lead: ' : '👥 Member: '}${member.name}</strong><br>
              <span style="color: #666; font-size: 14px;">${member.email}</span>
              ${member.phone ? `<br><span style="color: #999; font-size: 13px;">Phone: ${member.phone}</span>` : ''}
              ${member.role ? `<br><span style="color: #999; font-size: 13px;">Role: ${member.role}</span>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- What's Next -->
      <div style="margin: 30px 0;">
        <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0;">What's Next?</h3>
        <ul style="color: #666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Review the competition guidelines and requirements carefully</li>
          <li>Prepare your design submission according to specifications</li>
          <li>Submit your work through your profile dashboard before the deadline</li>
          <li>Wait for results announcement and check the leaderboard</li>
        </ul>
      </div>

      <!-- Important Note -->
      <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <p style="color: #1565c0; margin: 0; line-height: 1.6; font-size: 13px;">
          <strong>Important:</strong> Please save this email for your records. You'll need your registration number (${registration.registrationNumber}) for any inquiries about your submission.
        </p>
      </div>
    </div>
    
    ${getEmailFooter()}
  `;

  const text = `
Hi ${userName},

Congratulations! Your registration for Archalley Competition 2025 - Innovative Christmas Tree has been successfully confirmed.

Registration Details:
- Registration Number: ${registration.registrationNumber}
- Category: ${registrationType.name}
- Amount Paid: LKR ${registration.amountPaid.toLocaleString()}
- Payment Method: ${paymentMethod}
- Order ID: ${paymentOrderId}
- Country: ${registration.country}

${members && members.length > 0 ? `
Team Members:
${members.map((m: any, i: number) => `${i + 1}. ${m.name} (${m.email})${m.phone ? ` - ${m.phone}` : ''}${m.role ? ` - ${m.role}` : ''}`).join('\n')}
` : ''}

Important Dates:
- Submission Deadline: ${new Date(competition.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Competition Period: ${new Date(competition.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${new Date(competition.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

What's Next?
1. Review the competition guidelines and requirements carefully
2. Prepare your design submission according to specifications
3. Submit your work through your profile dashboard before the deadline
4. Wait for results announcement and check the leaderboard

Important: Please save this email for your records. You'll need your registration number (${registration.registrationNumber}) for any inquiries about your submission.

Need help? Contact us at projects@archalley.com

Follow us on:
- Facebook: https://facebook.com/archalley
- Instagram: https://www.instagram.com/archalley_insta/
- LinkedIn: https://www.linkedin.com/company/archalleypage/

© ${new Date().getFullYear()} Archalley. All rights reserved.
  `;

  return sendEmail(userEmail, subject, html, text);
};

// NEW: Comprehensive consolidated confirmation for multiple registrations
export const sendComprehensiveConsolidatedConfirmationEmail = async (
  data: ConsolidatedRegistrationData & { paymentOrderId: string; paymentMethod?: string }
) => {
  const { registrations, competition, userName, userEmail, totalAmount, paymentOrderId, paymentMethod = 'PayHere' } = data;

  console.log('📧 Sending Comprehensive Consolidated Confirmation Email to:', userEmail);
  console.log('   Registration count:', registrations.length);
  
  const subject = `Registration Confirmed - Archalley Competition 2025`;

  // Build registration list HTML
  const registrationListHTML = registrations.map((item, index) => {
    // Extract participant info from members array
    const participantInfo = item.members && item.members.length > 0 ? item.members[0] : null;
    const participantName = participantInfo?.name || '';
    
    return `
    <div style="background: ${index % 2 === 0 ? '#f9f9f9' : '#fff'}; padding: 20px; border-radius: 8px; margin: ${index > 0 ? '15px' : '0'} 0; border: 1px solid #e5e7eb;">
      <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 2px solid #FFA000;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="color: #333; font-size: 16px; margin: 0;">${item.registrationType.name}</h4>
          <p style="color: #FFA000; font-size: 18px; font-weight: bold; margin: 0;">
            LKR ${item.registration.amountPaid.toLocaleString()}
          </p>
        </div>
        <p style="color: #666; font-size: 13px; margin: 0;">
          <strong>Registration #:</strong> 
          <span style="font-family: monospace; color: #FFA000; font-weight: bold;">${item.registration.registrationNumber}</span>
        </p>
        ${participantName ? `
          <p style="color: #666; font-size: 13px; margin: 5px 0 0 0;">
            <strong>Participant:</strong> ${participantName}
          </p>
        ` : ''}
      </div>
      
      ${item.members && item.members.length > 1 ? `
        <div style="padding-top: 10px;">
          <p style="color: #666; font-size: 13px; margin: 0 0 10px 0; font-weight: 600;">Team Members (${item.members.length}):</p>
          ${item.members.map((member: any, idx: number) => `
            <div style="padding: 6px 0; ${idx < item.members.length - 1 ? 'border-bottom: 1px dashed #e5e7eb;' : ''}">
              <span style="color: #333; font-size: 13px;">${idx === 0 ? '👤 Lead: ' : '👥 ' }${member.name}</span><br>
              <span style="color: #999; font-size: 12px;">${member.email}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
  }).join('');

  const html = `
    ${getEmailHeader()}
    
    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Congratulations! Your registration for <strong>Archalley Competition 2025 - Christmas in Future</strong> has been successfully confirmed. We're excited to see your creative work!
      </p>

      <!-- Payment Summary -->
      <div style="background: #fff4e6; border-left: 4px solid #FFA000; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="color: #FFA000; margin: 0 0 10px 0; font-size: 18px;">Payment Confirmed</h3>
        <p style="color: #666; font-size: 13px; margin: 0 0 15px 0;">
          Order ID: <span style="font-family: monospace;">${paymentOrderId}</span> | Payment Method: ${paymentMethod}
        </p>
        <p style="color: #666; font-size: 14px; margin: 0;">
          <strong>Total Amount Paid:</strong> <span style="color: #FFA000; font-size: 20px; font-weight: bold;">LKR ${totalAmount.toLocaleString()}</span>
        </p>
      </div>

      <!-- Registration Details -->
      <h3 style="color: #333; font-size: 18px; margin: 30px 0 15px 0;">Your Registrations (${registrations.length} ${registrations.length === 1 ? 'Entry' : 'Entries'})</h3>
      ${registrationListHTML}

      <!-- What's Next -->
      <div style="margin: 30px 0;">
        <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0;">What's Next?</h3>
        <ul style="color: #666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>Review the competition guidelines and requirements carefully</li>
          <li>Prepare your design submissions according to specifications</li>
          <li>Submit your work through your profile dashboard before the deadline</li>
          <li>Wait for results announcement and check the leaderboard</li>
        </ul>
      </div>

      <!-- Important Note -->
      <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <p style="color: #1565c0; margin: 0; line-height: 1.6; font-size: 13px;">
          <strong>Important:</strong> Please save this email for your records. You'll need your registration numbers for any inquiries about your submissions.
        </p>
      </div>
    </div>
    
    ${getEmailFooter()}
  `;

  const regListText = registrations.map((item, index) => `
${index + 1}. ${item.registrationType.name}
   Registration #: ${item.registration.registrationNumber}
   Amount: LKR ${item.registration.amountPaid.toLocaleString()}
   ${item.members && item.members.length > 0 ? `Team Members: ${item.members.map((m: any) => m.name).join(', ')}` : ''}
  `).join('\n');

  const text = `
Hi ${userName},

Congratulations! Your registration for Archalley Competition 2025 - Innovative Christmas Tree has been successfully confirmed.

Payment Confirmed:
- Order ID: ${paymentOrderId}
- Payment Method: ${paymentMethod}
- Total Amount Paid: LKR ${totalAmount.toLocaleString()}

Your Registrations (${registrations.length} ${registrations.length === 1 ? 'Entry' : 'Entries'}):
${regListText}

Important Dates:
- Submission Deadline: ${new Date(competition.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Competition Period: ${new Date(competition.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${new Date(competition.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

What's Next?
1. Review the competition guidelines and requirements carefully
2. Prepare your design submissions according to specifications
3. Submit your work through your profile dashboard before the deadline
4. Wait for results announcement and check the leaderboard

Important: Please save this email for your records. You'll need your registration numbers for any inquiries about your submissions.

Need help? Contact us at projects@archalley.com

Follow us on:
- Facebook: https://facebook.com/archalley
- Instagram: https://www.instagram.com/archalley_insta/
- LinkedIn: https://www.linkedin.com/company/archalleypage/

© ${new Date().getFullYear()} Archalley. All rights reserved.
  `;

  return sendEmail(userEmail, subject, html, text);
};

// 6. Submission Created Email
export const sendSubmissionCreatedEmail = async (data: {
  submission: {
    registrationNumber: string;
    title: string;
    submissionCategory: string;
    submittedAt: Date | null;
  };
  competition: Competition;
  userName: string;
  userEmail: string;
}) => {
  const { submission, competition, userName, userEmail } = data;

  console.log('📧 Sending Submission Created Email to:', userEmail);
  
  const subject = `Submission Received - Archalley Competition 2025 - Christmas in Future ✅`;

  const html = `
    ${getEmailHeader()}
    
    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Great news! We have successfully received your submission for <strong>Archalley Competition 2025 - Christmas in Future</strong>. Thank you for participating!
      </p>

      <!-- Success Status -->
      <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="color: #2e7d32; margin: 0; line-height: 1.8; font-size: 16px; font-weight: bold;">
          ✅ Submission Received Successfully
        </p>
      </div>

      <!-- Submission Details Box -->
      <div style="background: #f9f9f9; padding: 25px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0;">Submission Details</h3>
        <table style="width: 100%; color: #333; font-size: 14px; line-height: 1.8;">
          <tr>
            <td style="padding: 8px 0;"><strong>Registration Number:</strong></td>
            <td style="padding: 8px 0; text-align: right; font-family: monospace; font-weight: bold; color: #FFA000;">${submission.registrationNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Submission Title:</strong></td>
            <td style="padding: 8px 0; text-align: right; color: #333;">${submission.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Category:</strong></td>
            <td style="padding: 8px 0; text-align: right; color: #333;">${submission.submissionCategory}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Submitted At:</strong></td>
            <td style="padding: 8px 0; text-align: right; color: #333;">${submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Status:</strong></td>
            <td style="padding: 8px 0; text-align: right; color: #4caf50; font-weight: bold;">Submitted</td>
          </tr>
        </table>
      </div>

      <!-- What Happens Next -->
      <div style="background: #f9f9f9; padding: 25px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">📋 What Happens Next?</h3>
        <ol style="color: #666; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
          <li style="margin-bottom: 10px;">Our team will review your submission for completeness and compliance</li>
          <li style="margin-bottom: 10px;">You will receive an email once your submission is validated</li>
          <li style="margin-bottom: 10px;">Validated submissions will be published for public voting</li>
          <li style="margin-bottom: 10px;">Results will be announced after the judging process</li>
        </ol>
      </div>

      <!-- Important Note -->
      <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="color: #1565c0; margin: 0; line-height: 1.6; font-size: 14px;">
          <strong>Important:</strong> Please keep this email for your records. Your registration number (${submission.registrationNumber}) is your reference for any inquiries about your submission.
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/submissions" 
           style="background: #FFA000; 
                  color: white; 
                  padding: 15px 40px; 
                  text-decoration: none; 
                  border-radius: 8px; 
                  display: inline-block; 
                  font-weight: bold; 
                  font-size: 16px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          View My Submissions
        </a>
      </div>

      <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #eee;">
        If you have any questions or need to make changes to your submission, please contact us at <a href="mailto:projects@archalley.com" style="color: #FFA000; text-decoration: none;">projects@archalley.com</a>
      </p>
    </div>
    ${getEmailFooter()}
  `;

  const text = `
Submission Received - Archalley Competition 2025 ✅

Hi ${userName},

Great news! We have successfully received your submission for Archalley Competition 2025 - Christmas in Future. Thank you for participating!

✅ SUBMISSION RECEIVED SUCCESSFULLY

Submission Details:
- Registration Number: ${submission.registrationNumber}
- Submission Title: ${submission.title}
- Category: ${submission.submissionCategory}
- Submitted At: ${submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
- Status: Submitted

What Happens Next?
1. Our team will review your submission for completeness and compliance
2. You will receive an email once your submission is validated
3. Validated submissions will be published for public voting
4. Results will be announced after the judging process

Important: Please keep this email for your records. Your registration number (${submission.registrationNumber}) is your reference for any inquiries about your submission.

View your submissions: ${process.env.NEXT_PUBLIC_APP_URL}/submissions

If you have any questions, contact us at projects@archalley.com

Follow us on:
- Facebook: https://facebook.com/archalley
- Instagram: https://www.instagram.com/archalley_insta/
- LinkedIn: https://www.linkedin.com/company/archalleypage/

© ${new Date().getFullYear()} Archalley. All rights reserved.
  `;

  return sendEmail(userEmail, subject, html, text);
};

// 7. Submission Published Email
export const sendSubmissionPublishedEmail = async (data: {
  submission: {
    registrationNumber: string;
    title: string;
    submissionCategory: string;
    publishedAt: Date | null;
  };
  competition: Competition;
  userName: string;
  userEmail: string;
  submissionUrl?: string;
}) => {
  const { submission, competition, userName, userEmail, submissionUrl } = data;

  console.log('📧 Sending Submission Published Email to:', userEmail);
  
  const subject = `Your Submission is Now Live! - Archalley Competition 2025 - Christmas in Future 🎉`;

  const html = `
    ${getEmailHeader()}
    
    <!-- Main Content -->
    <div style="padding: 30px 20px;">
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${userName},
      </p>
      
      <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Exciting news! Your submission for <strong>Archalley Competition 2025 - Christmas in Future</strong> has been validated and is now <strong>live for public voting</strong>! 🎉
      </p>

      <!-- Success Status -->
      <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="color: #2e7d32; margin: 0; line-height: 1.8; font-size: 18px; font-weight: bold; text-align: center;">
          🎉 Your Submission is Now Live!
        </p>
        <p style="color: #2e7d32; margin: 10px 0 0 0; line-height: 1.8; font-size: 14px; text-align: center;">
          Share it with your friends and family to get votes!
        </p>
      </div>

      <!-- Submission Details Box -->
      <div style="background: #f9f9f9; padding: 25px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #333; font-size: 18px; margin: 0 0 15px 0;">Your Published Submission</h3>
        <table style="width: 100%; color: #333; font-size: 14px; line-height: 1.8;">
          <tr>
            <td style="padding: 8px 0;"><strong>Registration Number:</strong></td>
            <td style="padding: 8px 0; text-align: right; font-family: monospace; font-weight: bold; color: #FFA000;">${submission.registrationNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Submission Title:</strong></td>
            <td style="padding: 8px 0; text-align: right; color: #333;">${submission.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Category:</strong></td>
            <td style="padding: 8px 0; text-align: right; color: #333;">${submission.submissionCategory}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Published At:</strong></td>
            <td style="padding: 8px 0; text-align: right; color: #333;">${submission.publishedAt ? new Date(submission.publishedAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Status:</strong></td>
            <td style="padding: 8px 0; text-align: right; color: #4caf50; font-weight: bold;">Published & Live</td>
          </tr>
        </table>
      </div>

      <!-- Voting Information -->
      <div style="background: #fff4e6; border-left: 4px solid #FFA000; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <h3 style="color: #FFA000; margin: 0 0 15px 0; font-size: 18px;">🗳️ Public Voting is Now Open!</h3>
        <p style="color: #333; margin: 0 0 15px 0; line-height: 1.8; font-size: 14px;">
          Your submission is now visible to the public and eligible for voting. Share your submission link with friends, family, and on social media to get more votes!
        </p>
        <ul style="color: #666; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
          <li>Share on social media platforms</li>
          <li>Encourage friends and family to vote</li>
          <li>Check the leaderboard to see your ranking</li>
          <li>Voting helps determine public choice awards</li>
        </ul>
      </div>

      <!-- CTA Buttons -->
      <div style="text-align: center; margin: 40px 0;">
        ${submissionUrl ? `
          <a href="${submissionUrl}" 
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
            View My Submission
          </a>
        ` : ''}
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/competitions/${competition.slug || 'archalley-competition-2025'}" 
           style="background: #333; 
                  color: white; 
                  padding: 15px 40px; 
                  text-decoration: none; 
                  border-radius: 8px; 
                  display: inline-block; 
                  font-weight: bold; 
                  font-size: 16px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          View All Submissions
        </a>
      </div>

      <!-- Important Note -->
      <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin: 30px 0; border-radius: 4px;">
        <p style="color: #1565c0; margin: 0; line-height: 1.6; font-size: 14px;">
          <strong>Note:</strong> Final winners will be determined by a combination of public votes and expert judging. Keep sharing your submission to maximize your chances!
        </p>
      </div>

      <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #eee;">
        If you have any questions, please contact us at <a href="mailto:projects@archalley.com" style="color: #FFA000; text-decoration: none;">projects@archalley.com</a>
      </p>
    </div>
    ${getEmailFooter()}
  `;

  const text = `
Your Submission is Now Live! - Archalley Competition 2025 🎉

Hi ${userName},

Exciting news! Your submission for Archalley Competition 2025 - Christmas in Future has been validated and is now live for public voting! 🎉

🎉 YOUR SUBMISSION IS NOW LIVE!

Your Published Submission:
- Registration Number: ${submission.registrationNumber}
- Submission Title: ${submission.title}
- Category: ${submission.submissionCategory}
- Published At: ${submission.publishedAt ? new Date(submission.publishedAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
- Status: Published & Live

🗳️ PUBLIC VOTING IS NOW OPEN!

Your submission is now visible to the public and eligible for voting. Share your submission link with friends, family, and on social media to get more votes!

Tips:
- Share on social media platforms
- Encourage friends and family to vote
- Check the leaderboard to see your ranking
- Voting helps determine public choice awards

${submissionUrl ? `View your submission: ${submissionUrl}` : ''}
View all submissions: ${process.env.NEXT_PUBLIC_APP_URL}/competitions/${competition.slug || 'archalley-competition-2025'}

Note: Final winners will be determined by a combination of public votes and expert judging. Keep sharing your submission to maximize your chances!

If you have any questions, contact us at projects@archalley.com

Follow us on:
- Facebook: https://facebook.com/archalley
- Instagram: https://www.instagram.com/archalley_insta/
- LinkedIn: https://www.linkedin.com/company/archalleypage/

© ${new Date().getFullYear()} Archalley. All rights reserved.
  `;

  return sendEmail(userEmail, subject, html, text);
};

export default {
  sendRegistrationConfirmationEmail,
  sendPaymentReceiptEmail,
  sendCompetitionGuidelinesEmail,
  sendSubmissionReminderEmail,
  sendBankTransferPendingEmail,
  sendConsolidatedRegistrationConfirmationEmail,
  sendConsolidatedPaymentReceiptEmail,
  sendConsolidatedBankTransferPendingEmail,
  sendPaymentVerifiedEmail,
  sendPaymentRejectedEmail,
  sendComprehensiveConfirmationEmail,
  sendComprehensiveConsolidatedConfirmationEmail,
  sendSubmissionCreatedEmail,
  sendSubmissionPublishedEmail,
};

