import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import nodemailer from "nodemailer"

// Validation schema for contact form
const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().max(20, "Contact number too long").optional().or(z.literal("")),
  firmInstitute: z.string().max(200, "Firm/Institute name too long").optional().or(z.literal("")),
  websiteUrl: z
    .string()
    .max(500, "Website URL too long")
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => {
        if (!val || val === "") return true
        try {
          const url = val.startsWith("http") ? val : `https://${val}`
          new URL(url)
          return true
        } catch {
          return false
        }
      },
      { message: "Invalid URL format" }
    ),
  message: z.string().min(1, "Message is required").max(2000, "Message too long"),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Terms & Conditions and Privacy Policy",
  }),
})

// Create email transporter
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error("SMTP configuration is missing")
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })
}

// Format contact form email HTML
const formatContactEmail = (data: {
  name: string
  email: string
  contactNumber?: string
  firmInstitute?: string
  websiteUrl?: string
  message: string
  ip: string
  timestamp: string
}): string => {
  const { name, email, contactNumber, firmInstitute, websiteUrl, message, ip, timestamp } = data

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Submission</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #FACC15 0%, #F59E0B 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #000000; margin: 0; font-size: 28px; font-weight: bold;">New Contact Form Submission</h1>
        <p style="color: #000000; margin: 10px 0 0 0; font-size: 14px;">Archalley Contact Form</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <div style="margin-bottom: 20px;">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 20px; border-bottom: 2px solid #FACC15; padding-bottom: 10px;">Contact Information</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 150px;">Name:</td>
              <td style="padding: 8px 0;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #F59E0B;">${email}</a></td>
            </tr>
            ${contactNumber ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Contact Number:</td>
              <td style="padding: 8px 0;">${contactNumber}</td>
            </tr>
            ` : ""}
            ${firmInstitute ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Firm / Institute:</td>
              <td style="padding: 8px 0;">${firmInstitute}</td>
            </tr>
            ` : ""}
            ${websiteUrl ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Website / URL:</td>
              <td style="padding: 8px 0;"><a href="${websiteUrl}" target="_blank" style="color: #F59E0B;">${websiteUrl}</a></td>
            </tr>
            ` : ""}
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 20px; border-bottom: 2px solid #FACC15; padding-bottom: 10px;">Message</h2>
          <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #FACC15; border-radius: 4px; white-space: pre-wrap;">${message.replace(/\n/g, "<br>")}</div>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
          <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date(timestamp).toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>IP Address:</strong> ${ip}</p>
        </div>
      </div>

      <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #6b7280; margin: 0; font-size: 12px;">
          This email was sent from the Archalley contact form.<br>
          Reply directly to <a href="mailto:${email}" style="color: #F59E0B;">${email}</a> to respond to the sender.
        </p>
      </div>
    </body>
    </html>
  `
}

// Send email function
const sendEmail = async (
  to: string | string[],
  subject: string,
  html: string,
  text: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter()
    const recipients = Array.isArray(to) ? to.join(", ") : to

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "Archalley"}" <${process.env.SMTP_USER || process.env.EMAIL_FROM || "noreply@archalley.com"}>`,
      to: recipients,
      subject,
      html,
      text,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log(`✅ Email sent successfully to ${recipients}. Message ID: ${info.messageId}`)
    return true
  } catch (error) {
    console.error("❌ Error sending email:", error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log received data for debugging
    console.log("Received contact form data:", JSON.stringify(body, null, 2))

    // Validate input
    const validationResult = contactFormSchema.safeParse(body)

    if (!validationResult.success) {
      console.error("Validation errors:", JSON.stringify(validationResult.error.errors, null, 2))
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const { name, email, contactNumber, firmInstitute, websiteUrl, message } = validationResult.data

    // Get client IP for logging/security
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"
    const timestamp = new Date().toISOString()

    // Log submission
    console.log("Contact form submission:", {
      name,
      email,
      contactNumber: contactNumber || "N/A",
      firmInstitute: firmInstitute || "N/A",
      websiteUrl: websiteUrl || "N/A",
      message: message.substring(0, 100) + "...",
      ip,
      userAgent,
      timestamp,
    })

    // Validate SMTP configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error("❌ SMTP configuration missing")
      return NextResponse.json(
        {
          error: "Email service not configured",
          message: "Failed to send your message. Please try again later.",
        },
        { status: 500 }
      )
    }

    // Prepare email content
    const emailHtml = formatContactEmail({
      name,
      email,
      contactNumber,
      firmInstitute,
      websiteUrl,
      message,
      ip,
      timestamp,
    })

    const emailText = `
New Contact Form Submission - Archalley

Contact Information:
Name: ${name}
Email: ${email}
${contactNumber ? `Contact Number: ${contactNumber}` : ""}
${firmInstitute ? `Firm / Institute: ${firmInstitute}` : ""}
${websiteUrl ? `Website / URL: ${websiteUrl}` : ""}

Message:
${message}

---
Submitted: ${new Date(timestamp).toLocaleString()}
IP Address: ${ip}
Reply to: ${email}
    `.trim()

    const subject = `New Contact Form Submission from ${name}`

    // Send email to both recipients
    const recipients = ["archalleyteam@gmail.com", "projects@archalley.com"]
    const emailSent = await sendEmail(recipients, subject, emailHtml, emailText)

    if (!emailSent) {
      console.error("❌ Failed to send contact form email")
      return NextResponse.json(
        {
          error: "Failed to send email",
          message: "Your message was received but we couldn't send the notification. Please try again later.",
        },
        { status: 500 }
      )
    }

    console.log(`✅ Contact form email sent successfully to ${recipients.join(", ")}`)

    return NextResponse.json(
      {
        success: true,
        message: "Your message has been received. We'll get back to you soon!",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error processing contact form:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to process your contact form. Please try again later.",
      },
      { status: 500 }
    )
  }
}
