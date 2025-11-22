import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Create email transporter (re-uses the approach from contact route)
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error("SMTP configuration is missing")
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })
}

// Format academic submission email
const formatSubmissionEmail = (data: Record<string, string>) => {
  const fieldLabels: Record<string, string> = {
    submissionType: "Submission Type",
    name: "Name",
    email: "Email",
    contactNumber: "Contact Number",
    institute: "Institute",
    introduction: "Introduction",
    agreeToTerms: "Agreed to Terms",
  }

  const rows = Object.entries(data)
    .filter(([_, v]) => typeof v === "string" && v !== "")
    .map(([k, v]) => {
      const label = fieldLabels[k] || k.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
      let displayValue = v
      
      // Format submission type
      if (k === "submissionType") {
        displayValue = v === "research" ? "Research" : v === "design-project" ? "Design Project" : v
      }
      
      // Format boolean
      if (k === "agreeToTerms") {
        displayValue = v === "true" ? "Yes" : "No"
      }

      return `
        <tr>
          <td style="padding:8px 0; font-weight:600; width: 180px; vertical-align: top;">${label}:</td>
          <td style="padding:8px 0;">${displayValue.replace(/\n/g, "<br>")}</td>
        </tr>
      `
    })
    .join("")

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>New Academic Submission</title>
      </head>
      <body style="font-family: Arial, sans-serif; color: #111827; line-height:1.6; max-width: 760px; margin:0 auto;">
        <div style="background: linear-gradient(135deg, #FACC15 0%, #F59E0B 100%); padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin:0; color:#111; font-size: 22px;">New Academic Submission</h1>
          <p style="margin:6px 0 0 0; color:#111;">Archalley Academic Submit Form</p>
        </div>
        <div style="background:#fff; border:1px solid #e5e7eb; border-top:0; padding:24px;">
          <table style="width:100%; border-collapse: collapse;">${rows}</table>
        </div>
        <div style="font-size:12px; color:#6b7280; padding: 12px 24px; border:1px solid #e5e7eb; border-top:0; border-radius:0 0 8px 8px;">
          <p style="margin:0;">Submitted via Archalley Academic | ${new Date().toISOString()}</p>
        </div>
      </body>
    </html>
  `
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()

    // Extract text fields
    const submissionType = form.get("submissionType") as string
    const name = form.get("name") as string
    const email = form.get("email") as string
    const contactNumber = form.get("contactNumber") as string
    const institute = form.get("institute") as string
    const introduction = form.get("introduction") as string
    const agreeToTerms = form.get("agreeToTerms") as string

    // Basic validation
    if (!submissionType || !name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Prepare email data
    const emailData: Record<string, string> = {
      submissionType,
      name,
      email,
      contactNumber: contactNumber || "Not provided",
      institute: institute || "Not provided",
      introduction: introduction || "Not provided",
      agreeToTerms: agreeToTerms || "false",
    }

    // Collect attachments
    const attachments: any[] = []

    // Template file (required)
    const templateFile = form.get("templateFile")
    if (templateFile && typeof templateFile !== "string" && "arrayBuffer" in templateFile) {
      const file = templateFile as File
      const buf = Buffer.from(await file.arrayBuffer())
      attachments.push({
        filename: file.name || "template.docx",
        content: buf,
        contentType: file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })
    }

    // Introduction file (optional)
    const introductionFile = form.get("introductionFile")
    if (introductionFile && typeof introductionFile !== "string" && "arrayBuffer" in introductionFile) {
      const file = introductionFile as File
      const buf = Buffer.from(await file.arrayBuffer())
      attachments.push({
        filename: file.name || "introduction",
        content: buf,
        contentType: file.type || undefined,
      })
    }

    // Related files (optional, multiple)
    const relatedFiles = form.getAll("relatedFiles")
    for (const file of relatedFiles) {
      if (file && typeof file !== "string" && "arrayBuffer" in file) {
        const blob = file as File
        const buf = Buffer.from(await blob.arrayBuffer())
        attachments.push({
          filename: blob.name || "related-file",
          content: buf,
          contentType: blob.type || undefined,
        })
      }
    }

    const transporter = createTransporter()

    const toRecipients = [
      "archalleyteam@gmail.com",
      "projects@archalley.com",
    ]

    const submissionTypeLabel = submissionType === "research" ? "Research" : "Design Project"
    const subject = `Academic Submission: ${submissionTypeLabel} - ${name}`
    const html = formatSubmissionEmail(emailData)
    const text = `New academic submission\nType: ${submissionTypeLabel}\nName: ${name}\nEmail: ${email}\nContact: ${contactNumber || "N/A"}`

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "Archalley"}" <${process.env.SMTP_USER || process.env.EMAIL_FROM || "noreply@archalley.com"}>`,
      to: toRecipients.join(", "),
      subject,
      html,
      text,
      attachments,
    })

    console.log(`✅ Academic submission email sent successfully. ID: ${info.messageId}`)
    console.log(`📎 Attachments: ${attachments.length} file(s)`)

    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error: any) {
    console.error("❌ Academic submission failed:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to submit" 
    }, { status: 500 })
  }
}
