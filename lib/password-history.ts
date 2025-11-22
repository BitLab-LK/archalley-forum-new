import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import crypto from "crypto"

/**
 * Check if password was used in the last N passwords
 * @param userId - User ID
 * @param newPassword - New password to check
 * @param maxHistory - Maximum number of passwords to check (default: 5)
 * @returns true if password was used recently, false otherwise
 */
export async function isPasswordInHistory(
  userId: string,
  newPassword: string,
  maxHistory: number = 5
): Promise<boolean> {
  try {
    // Get last N password hashes from history
    const passwordHistory = await prisma.$queryRaw<Array<{ passwordHash: string }>>`
      SELECT "passwordHash"
      FROM "PasswordHistory"
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
      LIMIT ${maxHistory}
    `

    // Check if new password matches any of the historical passwords
    for (const history of passwordHistory) {
      const matches = await bcrypt.compare(newPassword, history.passwordHash)
      if (matches) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error("Error checking password history:", error)
    // On error, allow the password change (fail open for better UX)
    return false
  }
}

/**
 * Add password to history
 * @param userId - User ID
 * @param passwordHash - Hashed password to store
 * @param maxHistory - Maximum number of passwords to keep (default: 5)
 */
export async function addPasswordToHistory(
  userId: string,
  passwordHash: string,
  maxHistory: number = 5
): Promise<void> {
  try {
    // Add new password to history
    await prisma.$executeRaw`
      INSERT INTO "PasswordHistory" ("id", "userId", "passwordHash", "createdAt")
      VALUES (${crypto.randomUUID()}, ${userId}, ${passwordHash}, CURRENT_TIMESTAMP)
    `

    // Keep only the last N passwords
    // Delete older passwords beyond maxHistory
    await prisma.$executeRaw`
      DELETE FROM "PasswordHistory"
      WHERE "userId" = ${userId}
      AND "id" NOT IN (
        SELECT "id"
        FROM "PasswordHistory"
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" DESC
        LIMIT ${maxHistory}
      )
    `
  } catch (error) {
    console.error("Error adding password to history:", error)
    // Don't throw - password history is not critical
  }
}

/**
 * Clear password history for a user
 * @param userId - User ID
 */
export async function clearPasswordHistory(userId: string): Promise<void> {
  try {
    await prisma.$executeRaw`
      DELETE FROM "PasswordHistory"
      WHERE "userId" = ${userId}
    `
  } catch (error) {
    console.error("Error clearing password history:", error)
  }
}
