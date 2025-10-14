/**
 * API endpoint to check session validity
 * Used by client-side session monitor
 */

import { NextRequest, NextResponse } from "next/server"
import { isSessionValid } from "@/lib/session-invalidation"

export async function GET(request: NextRequest) {
  try {
    const sessionCheck = await isSessionValid(request)
    
    if (!sessionCheck.isValid) {
      return NextResponse.json(
        { 
          valid: false, 
          reason: sessionCheck.reason,
          requiresReauth: true
        }, 
        { status: 401 }
      )
    }
    
    return NextResponse.json({ 
      valid: true, 
      userId: sessionCheck.userId 
    })
    
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json(
      { 
        valid: false, 
        reason: "Session check failed",
        requiresReauth: true
      }, 
      { status: 500 }
    )
  }
}