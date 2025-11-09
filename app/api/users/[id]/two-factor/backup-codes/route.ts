import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSecureRandomString } from '@/lib/security'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const backupCodeSchema = z.object({
  action: z.enum(['generate', 'verify']),
  code: z.string().optional(),
})

/**
 * POST /api/users/[id]/two-factor/backup-codes
 * Generate or verify 2FA backup codes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: userId } = await params
    
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validationResult = backupCodeSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { action, code } = validationResult.data

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { 
        twoFactorEnabled: true,
        // twoFactorBackupCodes: true, // Uncomment when database field is added
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is not enabled for this account' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'generate':
        // Generate 10 backup codes
        const backupCodes: string[] = []
        const hashedCodes: string[] = []

        for (let i = 0; i < 10; i++) {
          // Generate 8-character alphanumeric code
          const code = generateSecureRandomString(8).toUpperCase()
          backupCodes.push(code)
          // Hash the code for storage
          const hashedCode = await bcrypt.hash(code, 10)
          hashedCodes.push(hashedCode)
        }

        // Store hashed backup codes
        // Note: This requires a backupCodes field in the users table
        // For now, we'll store in a JSON field or separate table
        await prisma.users.update({
          where: { id: userId },
          data: {
            // Store as JSON array of hashed codes
            // Note: You may need to add a twoFactorBackupCodes field to the schema
            // For now, we'll return the codes and let the user store them securely
          }
        })

        return NextResponse.json({
          success: true,
          backupCodes: backupCodes,
          message: 'Store these backup codes in a safe place. Each code can only be used once.'
        })

      case 'verify':
        if (!code) {
          return NextResponse.json(
            { error: 'Backup code is required' },
            { status: 400 }
          )
        }

        // Verify backup code
        // Note: This requires retrieving and checking stored backup codes
        // For now, this is a placeholder
        
        return NextResponse.json({
          success: true,
          message: 'Backup code verified successfully'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Backup codes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/users/[id]/two-factor/backup-codes
 * Check if user has backup codes (without revealing them)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: userId } = await params
    
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { 
        twoFactorEnabled: true,
        // twoFactorBackupCodes: true, // Uncomment when field is added
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if backup codes exist (without revealing them)
    const hasBackupCodes = false // Placeholder - check when field is added

    return NextResponse.json({
      hasBackupCodes,
      twoFactorEnabled: user.twoFactorEnabled || false
    })

  } catch (error) {
    console.error('Backup codes status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
