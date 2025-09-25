import { prisma } from './prisma'

/**
 * Updates a user's lastActiveAt timestamp to track activity
 * This is used for calculating active users in stats
 */
export async function updateUserActivity(userId: string): Promise<void> {
  try {
    await prisma.users.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() }
    })
  } catch (error) {
    // Don't throw error - activity tracking shouldn't break main functionality
    console.warn('Failed to update user activity:', error)
  }
}

/**
 * Updates user activity in the background without blocking the main request
 */
export function updateUserActivityAsync(userId: string): void {
  // Use setImmediate to run in next tick without blocking
  setImmediate(async () => {
    await updateUserActivity(userId)
  })
}