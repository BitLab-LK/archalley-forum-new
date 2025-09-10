import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if user is requesting their own data or is admin
    if (session.user.id !== id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch connected accounts for the user
    const accounts = await prisma.account.findMany({
      where: {
        userId: id
      },
      select: {
        id: true,
        provider: true,
        providerAccountId: true,
        type: true,
        // Note: We don't expose access_token, refresh_token, etc. for security
      }
    })

    // Map accounts to include email information
    const accountsWithDetails = accounts.map(account => ({
      id: account.id,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      type: account.type,
      // For OAuth accounts, we can try to get email from the user's main email
      // if it matches the provider domain
      email: getProviderEmail(account.provider, session.user.email)
    }))

    return NextResponse.json(accountsWithDetails)
  } catch (error) {
    console.error("Error fetching connected accounts:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if user is requesting their own data
    if (session.user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const url = new URL(request.url)
    const provider = url.searchParams.get('provider')

    if (!provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 })
    }

    // Don't allow disconnecting the primary account used for login
    const accounts = await prisma.account.findMany({
      where: { userId: id }
    })

    if (accounts.length <= 1) {
      return NextResponse.json(
        { error: "Cannot disconnect the last connected account" },
        { status: 400 }
      )
    }

    // Delete the account
    await prisma.account.deleteMany({
      where: {
        userId: id,
        provider: provider
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error disconnecting account:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

// Helper function to get provider email
function getProviderEmail(provider: string, userEmail: string | null | undefined): string {
  if (!userEmail) return ""
  
  // For OAuth providers, we can make educated guesses about email domains
  switch (provider) {
    case 'google':
      if (userEmail.endsWith('@gmail.com') || userEmail.endsWith('@googlemail.com')) {
        return userEmail
      }
      return userEmail // Could be Google Workspace email
    case 'facebook':
      return userEmail // Facebook doesn't have a specific domain pattern
    case 'linkedin':
      return userEmail // LinkedIn doesn't have a specific domain pattern
    default:
      return userEmail
  }
}
