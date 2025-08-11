import type { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      image?: string
      role: UserRole
      isVerified: boolean
    }
  }

  interface User {
    role: UserRole
    isVerified: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    isVerified: boolean
  }
}
