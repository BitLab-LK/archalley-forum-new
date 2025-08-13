import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import LinkedInProvider from "next-auth/providers/linkedin"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
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
    async signIn({ user, account, profile }) {
      console.log("=== SIGNIN CALLBACK ===")
      console.log("User:", user?.email, "Provider:", account?.provider)
      console.log("Account details:", account)
      console.log("Profile details:", profile)
      
      if (account?.provider === "google" || account?.provider === "facebook" || account?.provider === "linkedin") {
        try {
          // Check if user exists
          const existingUser = await prisma.users.findUnique({
            where: { email: user.email! },
          })

          if (!existingUser) {
            console.log("New social user detected:", user.email)
            // Redirect to registration with OAuth data for account linking
            const redirectUrl = `/auth/register?provider=${account.provider}&email=${encodeURIComponent(user.email!)}&name=${encodeURIComponent(user.name || '')}&image=${encodeURIComponent(user.image || '')}&providerAccountId=${encodeURIComponent(account.providerAccountId)}&accessToken=${encodeURIComponent(account.access_token || '')}&tokenType=${encodeURIComponent(account.token_type || '')}&scope=${encodeURIComponent(account.scope || '')}`
            return redirectUrl
          } else {
            console.log("Existing social user signing in:", existingUser.email)
            
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
              console.log("Linking social account to existing user:", user.email)
              // Link the social account to the existing user
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
            await prisma.users.update({
              where: { id: existingUser.id },
              data: {
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
                updatedAt: new Date(),
              },
            })
            
            console.log("Sign-in successful for existing user, returning true")
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
    signOut: "/",  // Redirect to home page after sign out
    error: "/auth/error", // Error code passed in query string as ?error=
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log('SignIn event:', { user: user.email, provider: account?.provider, isNewUser })
    },
    async signOut({ session, token }) {
      console.log('SignOut event:', { userEmail: session?.user?.email || token?.email })
    },
  },
  // Security configurations
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
}
