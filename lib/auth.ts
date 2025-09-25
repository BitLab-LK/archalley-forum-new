import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import LinkedInProvider from "next-auth/providers/linkedin"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { updateUserActivityAsync } from "@/lib/activity-service"
import bcrypt from "bcryptjs"

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

        const user = await prisma.users.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // For logout, always redirect to home page
      if (url.includes('signout') || url.includes('logout')) {
        return baseUrl
      }
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
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
        })

        if (dbUser) {
          token.role = dbUser.role
          token.isVerified = dbUser.isVerified
          token.id = dbUser.id
          token.name = dbUser.name
          token.image = dbUser.image
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
            console.log(`New user detected for ${account.provider}, redirecting to complete profile`)
            const redirectUrl = `/auth/register?provider=${account.provider}&email=${encodeURIComponent(user.email!)}&name=${encodeURIComponent(user.name || '')}&image=${encodeURIComponent(user.image || '')}&providerAccountId=${encodeURIComponent(account.providerAccountId)}&accessToken=${encodeURIComponent(account.access_token || '')}&tokenType=${encodeURIComponent(account.token_type || '')}&scope=${encodeURIComponent(account.scope || '')}&message=${encodeURIComponent('Complete your profile to join our community!')}`
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
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
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
      
      // Update user activity on sign in
      if (user?.id) {
        updateUserActivityAsync(user.id)
      }
    },
    async signOut({ session, token }) {
      console.log('SignOut event:', { userEmail: session?.user?.email || token?.email })
      
      // Update user activity on sign out (they were active when they signed out)
      const userId = session?.user?.id || token?.id
      if (userId) {
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
