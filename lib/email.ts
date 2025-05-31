import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: "Archalley Forum <noreply@archalley.com>",
      to: email,
      subject: "Welcome to Archalley Forum!",
      html: `
        <h1>Welcome to Archalley Forum, ${name}!</h1>
        <p>Thank you for joining our community of architects, designers, and construction professionals.</p>
        <p>You can now:</p>
        <ul>
          <li>Share your projects and ideas</li>
          <li>Connect with other professionals</li>
          <li>Ask questions and get expert advice</li>
          <li>Stay updated with industry trends</li>
        </ul>
        <p>Get started by completing your profile and making your first post!</p>
        <p>Best regards,<br>The Archalley Forum Team</p>
      `,
    })
  } catch (error) {
    console.error("Failed to send welcome email:", error)
  }
}

export async function sendNotificationEmail(email: string, subject: string, content: string) {
  try {
    await resend.emails.send({
      from: "Archalley Forum <noreply@archalley.com>",
      to: email,
      subject,
      html: content,
    })
  } catch (error) {
    console.error("Failed to send notification email:", error)
  }
}
