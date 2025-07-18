import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    
    console.log("Testing login for email:", email)
    
    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        rank: true,
        isVerified: true,
        createdAt: true,
      }
    })
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "User not found",
        email: email
      })
    }
    
    console.log("User found:", { 
      id: user.id, 
      email: user.email, 
      hasPassword: !!user.password,
      role: user.role,
      rank: user.rank
    })
    
    if (!user.password) {
      return NextResponse.json({ 
        success: false, 
        message: "User has no password (social login only?)",
        user: { id: user.id, email: user.email, hasPassword: false }
      })
    }
    
    // Test password comparison
    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    console.log("Password validation result:", isPasswordValid)
    
    return NextResponse.json({ 
      success: isPasswordValid,
      message: isPasswordValid ? "Login would succeed" : "Password mismatch",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        rank: user.rank,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        hasPassword: !!user.password
      }
    })
    
  } catch (error) {
    console.error("Login test error:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Test failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
