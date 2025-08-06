import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const checkPhoneSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber } = checkPhoneSchema.parse(body)

    console.log('📞 Checking phone number availability:', phoneNumber)

    // Check if phone number already exists
    const existingPhoneUser = await prisma.users.findFirst({
      where: { phone: phoneNumber },
    })

    const available = !existingPhoneUser
    
    console.log(`📞 Phone number ${phoneNumber} is ${available ? 'available' : 'taken'}`)

    return NextResponse.json({ 
      available,
      message: available ? "Phone number is available" : "Phone number is already taken"
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: error.errors 
      }, { status: 400 })
    }

    console.error("Check phone error:", error)
    return NextResponse.json({ 
      error: "Failed to check phone number availability" 
    }, { status: 500 })
  }
}
