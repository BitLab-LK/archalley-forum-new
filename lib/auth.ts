import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import LinkedInProvider from "next-auth/providers/linkedin"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import crypto from "crypto"

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
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
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
          rank: user.rank,
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
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.users.findUnique({
          where: { email: user.email! },
        })

        if (dbUser) {
          token.role = dbUser.role
          token.rank = dbUser.rank
          token.isVerified = dbUser.isVerified
          token.id = dbUser.id
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string || token.sub!
        session.user.role = token.role as any
        session.user.rank = token.rank as any
        session.user.isVerified = token.isVerified as boolean
      }
      return session
    },
    async signIn({ user, account }) {
      console.log("=== SIGNIN CALLBACK ===")
      console.log("User:", user?.email, "Provider:", account?.provider)
      
      if (account?.provider === "google" || account?.provider === "facebook" || account?.provider === "linkedin") {
        try {
          // Check if user exists
          const existingUser = await prisma.users.findUnique({
            where: { email: user.email! },
          })

          if (!existingUser) {
            console.log("Creating new social user:", user.email)
            // Create new user for social login with all required fields
            const newUser = await prisma.users.create({
              data: {
                id: crypto.randomUUID(),
                email: user.email!,
                name: user.name || '',
                image: user.image || null,
                role: 'MEMBER',
                rank: 'NEW_MEMBER',
                isVerified: true,
                updatedAt: new Date(),
              },
            })
            console.log("Successfully created new social user:", newUser.email)
          } else {
            console.log("Existing social user signing in:", existingUser.email)
          }
          
          console.log("Sign-in successful, returning true")
          return true
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
    signIn: "/auth/login",
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
