import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { randomUUID } from "crypto"

// Get all settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    const userRole = session?.user?.role as string;
    if (!session?.user || (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN")) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const settings = await prisma.settings.findMany({
      orderBy: { key: "asc" }
    })

    // Convert array to object for easier access
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    return NextResponse.json(settingsObject)
  } catch (error) {
    console.error("[ADMIN_SETTINGS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Update settings
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    const userRole = session?.user?.role as string;
    if (!session?.user || (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN")) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const settings = body.settings as Record<string, string>

    if (!settings || typeof settings !== "object") {
      return new NextResponse("Invalid settings format", { status: 400 })
    }

    // Update settings in a transaction
    const updates = Object.entries(settings).map(([key, value]) =>
      prisma.settings.upsert({
        where: { key },
        update: {
          value,
          updatedById: session.user.id,
          updatedAt: new Date()
        },
        create: {
          id: randomUUID(),
          key,
          value,
          updatedById: session.user.id,
          updatedAt: new Date(),
          description: getSettingDescription(key)
        }
      })
    )

    await prisma.$transaction(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ADMIN_SETTINGS_UPDATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Helper function to get setting descriptions
function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    siteTitle: "The main title of your forum",
    siteDescription: "A brief description of your forum",
    siteKeywords: "SEO keywords for your forum",
    smtpHost: "SMTP server host for email notifications",
    smtpPort: "SMTP server port",
    smtpUsername: "SMTP server username",
    smtpPassword: "SMTP server password",
    primaryColor: "Primary color for the forum theme",
    secondaryColor: "Secondary color for the forum theme",
    headerLinks: "Navigation links in the header",
    footerCopyright: "Copyright text in the footer",
    enableRegistration: "Whether new user registration is enabled",
    enableComments: "Whether comments are enabled",
    enableFileUploads: "Whether file uploads are enabled",
    maxFileSize: "Maximum file upload size in bytes",
    allowedFileTypes: "Comma-separated list of allowed file types",
    maintenanceMode: "Whether the forum is in maintenance mode",
    maintenanceMessage: "Message to display during maintenance",
    googleAnalyticsId: "Google Analytics tracking ID",
    recaptchaSiteKey: "reCAPTCHA site key for spam prevention",
    recaptchaSecretKey: "reCAPTCHA secret key",
    openaiApiKey: "OpenAI API key for AI features",
    geminiApiKey: "Google Gemini API key for AI features"
  }

  return descriptions[key] || "No description available"
} 