import type { UserRole, UserRank } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      image?: string
      role: UserRole
      rank: UserRank
      isVerified: boolean
    }
  }

  interface User {
    role: UserRole
    rank: UserRank
    isVerified: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    rank: UserRank
    isVerified: boolean
  }
}
