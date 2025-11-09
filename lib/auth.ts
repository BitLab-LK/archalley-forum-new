import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import LinkedInProvider from "next-auth/providers/linkedin"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { updateUserActivityAsync } from "@/lib/activity-service"
import bcrypt from "bcryptjs"
import { recordFailedLoginAttempt, clearFailedLoginAttempts, isAccountLocked, checkRateLimit } from "@/lib/security"
import { logAuthEvent } from "@/lib/audit-log"

export const authOptions: NextAuthOptions = {
  // Removed PrismaAdapter to avoid conflicts with custom signIn callback
  // adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "email"
        }
      }
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Rate limiting: 10 login attempts per 15 minutes per email
        const rateLimitKey = `login:${credentials.email.toLowerCase()}`
        if (!checkRateLimit(rateLimitKey, 10, 15 * 60 * 1000)) {
          await logAuthEvent("RATE_LIMIT_EXCEEDED", {
            email: credentials.email.toLowerCase(),
            success: false,
            details: { action: "login", rateLimitKey },
            errorMessage: "Too many login attempts",
          })
          throw new Error("Too many login attempts. Please try again later.")
        }

        // Check if account is locked
        if (isAccountLocked(credentials.email.toLowerCase())) {
          await logAuthEvent("LOGIN_LOCKED", {
            email: credentials.email.toLowerCase(),
            success: false,
            details: { action: "login" },
            errorMessage: "Account locked",
          })
          throw new Error("Account is temporarily locked due to too many failed login attempts. Please try again in 15 minutes.")
        }

        // Always perform user lookup to prevent timing attacks
        const user = await prisma.users.findUnique({
          where: {
            email: credentials.email.toLowerCase(),
          },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            isVerified: true,
            emailVerified: true,
            password: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
          },
        })

        // Perform password comparison even if user doesn't exist (to prevent timing attacks)
        // Use a dummy hash to ensure constant time comparison
        const dummyHash = "$2a$14$dummyhashfordummycomparisonpurposesonly"
        const hashToCompare = user?.password || dummyHash
        
        const isPasswordValid = await bcrypt.compare(credentials.password, hashToCompare)

        // If user doesn't exist or password is invalid, record failed attempt
        if (!user || !user.password || !isPasswordValid) {
          // Only record attempt if user exists (to prevent account enumeration)
          if (user) {
            const lockoutStatus = recordFailedLoginAttempt(credentials.email.toLowerCase())
            if (lockoutStatus.isLocked) {
              await logAuthEvent("ACCOUNT_LOCKED", {
                userId: user.id,
                email: credentials.email.toLowerCase(),
                success: false,
                details: { action: "login", lockoutUntil: lockoutStatus.lockoutUntil },
                errorMessage: "Account locked due to too many failed attempts",
              })
              throw new Error(`Account locked due to too many failed attempts. Please try again in ${Math.ceil((lockoutStatus.lockoutUntil! - Date.now()) / 60000)} minutes.`)
            }
            await logAuthEvent("LOGIN_FAILED", {
              userId: user.id,
              email: credentials.email.toLowerCase(),
              success: false,
              details: { action: "login", reason: "invalid_password" },
              errorMessage: "Invalid password",
            })
          }
          return null
        }

        // Check if email is verified (enforce email verification)
        if (!user.isVerified || !user.emailVerified) {
          await logAuthEvent("LOGIN_FAILED", {
            userId: user.id,
            email: credentials.email.toLowerCase(),
            success: false,
            details: { action: "login", reason: "email_not_verified" },
            errorMessage: "Email not verified",
          })
          throw new Error("Please verify your email address before logging in. Check your inbox for the verification email.")
        }

        // Check IP whitelist if enabled (for high-security accounts)
        // Note: This feature requires database fields - placeholder for now
        // const ipAddress = (credentials as any).ipAddress
        // if (ipAddress) {
        //   const isWhitelisted = await isIPWhitelisted(user.id, ipAddress)
        //   if (!isWhitelisted) {
        //     await logAuthEvent("LOGIN_FAILED", {
        //       userId: user.id,
        //       email: credentials.email.toLowerCase(),
        //       success: false,
        //       details: { action: "login", reason: "ip_not_whitelisted", ipAddress },
        //       errorMessage: "IP address not whitelisted",
        //     })
        //     throw new Error("Your IP address is not authorized to access this account.")
        //   }
        // }

        // Check if 2FA is enabled - if so, require 2FA verification
        if (user.twoFactorEnabled) {
          // Return a special error that indicates 2FA is required
          // The client will handle this and show 2FA input form
          throw new Error("2FA_REQUIRED")
        }

        // Clear failed login attempts on successful login
        clearFailedLoginAttempts(credentials.email.toLowerCase())
        
        // Log successful login
        await logAuthEvent("LOGIN_SUCCESS", {
          userId: user.id,
          email: credentials.email.toLowerCase(),
          success: true,
          details: { action: "login", provider: "credentials", twoFactor: false },
        })

        // Send login notification email (async, don't wait)
        // Check if user has login notifications enabled (default: true)
        const userWithSettings = await prisma.users.findUnique({
          where: { id: user.id },
          select: { emailNotifications: true },
        })

        if (userWithSettings?.emailNotifications !== false) {
          // Send login notification asynchronously
          import("@/lib/email-service").then(({ sendLoginNotificationEmail }) => {
            const ip = (credentials as any).ipAddress || 'unknown'
            const userAgent = (credentials as any).userAgent || 'unknown'
            sendLoginNotificationEmail(
              user.email,
              user.name || 'User',
              {
                ipAddress: ip,
                userAgent,
                timestamp: new Date(),
              }
            ).catch((error) => {
              console.error("Failed to send login notification:", error)
            })
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          isVerified: user.isVerified,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (reduced from 30 for better security)
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days (reduced from 30 for better security)
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // For logout, always redirect to home page
      if (url.includes('signout') || url.includes('logout')) {
        return baseUrl
      }
      // Allows relative callback URLs
      if (url.startsWith("/")) {
        // Use the callbackUrl from NextAuth (which comes from signIn call)
        // This will be the last URL the user was trying to access
        return `${baseUrl}${url}`
      }
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      // Default redirect to home page
      return baseUrl
    },
    async jwt({ token, user, trigger }) {
      // Always fetch fresh user data when token is updated or session is refreshed
      if (user || trigger === "update") {
        const dbUser = await prisma.users.findUnique({
          where: { email: token.email! },
          select: {
            id: true,
            role: true,
            isVerified: true,
            name: true,
            image: true,
            roleChangedAt: true
          }
        })

        if (dbUser) {
          token.role = dbUser.role
          token.isVerified = dbUser.isVerified
          token.id = dbUser.id
          token.name = dbUser.name
          token.image = dbUser.image
          token.roleChangedAt = dbUser.roleChangedAt?.toISOString() || null
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string || token.sub!
        session.user.role = token.role as any
        session.user.isVerified = token.isVerified as boolean
        session.user.name = token.name as string
        session.user.image = token.image as string
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "facebook" || account?.provider === "linkedin") {
        try {
          // Check if user exists
          const existingUser = await prisma.users.findUnique({
            where: { email: user.email! },
          })

          if (!existingUser) {
            // Redirect to registration with OAuth data for account linking
            // Preserve callbackUrl from the signIn call if available
            console.log(`New user detected for ${account.provider}, redirecting to complete profile`)
            // Note: callbackUrl is handled by NextAuth's redirect callback, we'll preserve it in URL params
            const redirectUrl = `/auth/register?provider=${account.provider}&email=${encodeURIComponent(user.email!)}&name=${encodeURIComponent(user.name || '')}&image=${encodeURIComponent(user.image || '')}&providerAccountId=${encodeURIComponent(account.providerAccountId)}&message=${encodeURIComponent('Complete your profile to join our community!')}`
            return redirectUrl
          } else {
            // Check if this social account is already linked
            const existingAccount = await prisma.account.findUnique({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                }
              }
            })

            if (!existingAccount) {
              // Link the social account to the existing user
              console.log(`Linking ${account.provider} account to existing user ${existingUser.email}`)
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                }
              })
            }
            
            // Update user info if needed for existing users
            // Preserve uploaded profile image over SSO image
            const updateData: any = {
              name: user.name || existingUser.name,
              updatedAt: new Date(),
            }
            
            // Only update image if user doesn't have one, or if the current image is from an SSO provider
            // This preserves manually uploaded images
            const isCurrentImageFromSSO = existingUser.image && (
              existingUser.image.includes('googleusercontent.com') ||
              existingUser.image.includes('facebook.com') ||
              existingUser.image.includes('fbcdn.net') ||
              existingUser.image.includes('linkedin.com') ||
              existingUser.image.includes('licdn.com')
            )
            
            if (!existingUser.image || isCurrentImageFromSSO) {
              updateData.image = user.image || existingUser.image
            }
            // If user has uploaded their own image (not from SSO), keep it
            
            await prisma.users.update({
              where: { id: existingUser.id },
              data: updateData,
            })
            
            console.log(`${account.provider} sign-in successful for existing user: ${existingUser.email}`)
            return true
          }
        } catch (error) {
          console.error("=== SIGNIN ERROR ===")
          console.error("Error during social sign in:", error)
          console.error("Error details:", error instanceof Error ? error.message : error)
          console.error("==================")
          return false
        }
      }
      
      console.log("Non-social sign-in, returning true")
      return true
    },
  },
  pages: {
    signIn: "/auth/register?tab=login", // Updated to use the register page with login tab
    signOut: "/auth/logout",  // Use custom logout page for better control
    error: "/auth/error", // Error code passed in query string as ?error=
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log('SignIn event:', { user: user.email, provider: account?.provider, isNewUser })
      
      // Log OAuth sign-in
      if (account?.provider && account.provider !== "credentials") {
        await logAuthEvent("LOGIN_SUCCESS", {
          userId: user.id,
          email: user.email || null,
          success: true,
          details: { action: "login", provider: account.provider, isNewUser },
        })

        // Send login notification email for OAuth logins (async)
        if (user.email) {
          const userWithSettings = await prisma.users.findUnique({
            where: { id: user.id },
            select: { emailNotifications: true, name: true },
          })

          if (userWithSettings?.emailNotifications !== false) {
            import("@/lib/email-service").then(({ sendLoginNotificationEmail }) => {
              sendLoginNotificationEmail(
                user.email!,
                userWithSettings.name || user.name || 'User',
                {
                  timestamp: new Date(),
                }
              ).catch((error) => {
                console.error("Failed to send login notification:", error)
              })
            })
          }
        }
      }
      
      // Update user activity on sign in
      if (user?.id) {
        updateUserActivityAsync(user.id)
      }
    },
    async signOut({ session, token }) {
      console.log('SignOut event:', { userEmail: session?.user?.email || token?.email })
      
      // Log logout
      const userId = session?.user?.id || token?.id
      const email = session?.user?.email || token?.email
      if (userId) {
        await logAuthEvent("LOGOUT", {
          userId: userId as string,
          email: email as string | null,
          success: true,
          details: { action: "logout" },
        })
        updateUserActivityAsync(userId as string)
      }
      
      // Clear any additional session data if needed
    },
  },
  // Security configurations
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // Let NextAuth handle domain automatically
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.callback-url" : "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === "production" ? "__Host-next-auth.csrf-token" : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  // Add debug for production
  debug: process.env.NODE_ENV === "development",
}
