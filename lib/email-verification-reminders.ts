import { prisma } from "@/lib/prisma"
import { sendVerificationEmail } from "@/lib/email-service"
import crypto from "crypto"

/**
 * Send email verification reminders to users who haven't verified their email
 * This should be run as a cron job or scheduled task
 */
export async function sendEmailVerificationReminders() {
  try {
    const now = new Date()
    
    // Find users who registered 24 hours ago and haven't verified
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneDayAgoPlusOneHour = new Date(now.getTime() - 25 * 60 * 60 * 1000)
    
    // Find users who registered 7 days ago and haven't verified
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const sevenDaysAgoPlusOneHour = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000)

    // Users who registered 24 hours ago (within 1 hour window)
    const users24h = await prisma.users.findMany({
      where: {
        emailVerified: null,
        isVerified: false,
        createdAt: {
          gte: oneDayAgoPlusOneHour,
          lte: oneDayAgo,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    })

    // Users who registered 7 days ago (within 1 hour window)
    const users7d = await prisma.users.findMany({
      where: {
        emailVerified: null,
        isVerified: false,
        createdAt: {
          gte: sevenDaysAgoPlusOneHour,
          lte: sevenDaysAgo,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    })

    // Send 24-hour reminders
    for (const user of users24h) {
      try {
        // Check if there's an existing verification token
        const existingToken = await prisma.verificationToken.findFirst({
          where: {
            identifier: user.email,
            expires: {
              gt: now,
            },
          },
        })

        let verificationToken: string

        if (existingToken) {
          // Use existing token
          verificationToken = existingToken.token
        } else {
          // Generate new verification token
          verificationToken = crypto.randomBytes(32).toString('hex')
          const expires = new Date()
          expires.setHours(expires.getHours() + 24) // Token expires in 24 hours

          await prisma.verificationToken.create({
            data: {
              id: crypto.randomUUID(),
              identifier: user.email,
              token: verificationToken,
              expires,
            },
          })
        }

        const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
        await sendVerificationEmail(user.email, userName, verificationToken)
        
        console.log(`✅ Sent 24h verification reminder to ${user.email}`)
      } catch (error) {
        console.error(`❌ Failed to send 24h reminder to ${user.email}:`, error)
      }
    }

    // Send 7-day reminders
    for (const user of users7d) {
      try {
        // Check if there's an existing verification token
        const existingToken = await prisma.verificationToken.findFirst({
          where: {
            identifier: user.email,
            expires: {
              gt: now,
            },
          },
        })

        let verificationToken: string

        if (existingToken) {
          // Use existing token
          verificationToken = existingToken.token
        } else {
          // Generate new verification token
          verificationToken = crypto.randomBytes(32).toString('hex')
          const expires = new Date()
          expires.setHours(expires.getHours() + 24) // Token expires in 24 hours

          await prisma.verificationToken.create({
            data: {
              id: crypto.randomUUID(),
              identifier: user.email,
              token: verificationToken,
              expires,
            },
          })
        }

        const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
        await sendVerificationEmail(user.email, userName, verificationToken)
        
        console.log(`✅ Sent 7d verification reminder to ${user.email}`)
      } catch (error) {
        console.error(`❌ Failed to send 7d reminder to ${user.email}:`, error)
      }
    }

    return {
      success: true,
      reminders24h: users24h.length,
      reminders7d: users7d.length,
    }
  } catch (error) {
    console.error("Email verification reminders error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
