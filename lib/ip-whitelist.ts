import { prisma } from "@/lib/prisma"

/**
 * IP Whitelisting for high-security accounts
 * This allows users to restrict logins to specific IP addresses
 */

/**
 * Check if IP address is whitelisted for user
 * @param userId - User ID
 * @param ipAddress - IP address to check
 * @returns true if IP is whitelisted or no whitelist exists, false if IP is blocked
 */
export async function isIPWhitelisted(userId: string, _ipAddress: string): Promise<boolean> {
  try {
    // Get user's IP whitelist
    // Note: This requires an ipWhitelist field in the users table
    // For now, we'll check if the feature is enabled
    
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        // ipWhitelist: true, // Uncomment when field is added
        // ipWhitelistEnabled: true, // Uncomment when field is added
      },
    })

    if (!user) {
      return false
    }

    // If IP whitelisting is not enabled, allow all IPs
    // const ipWhitelistEnabled = (user as any).ipWhitelistEnabled
    // if (!ipWhitelistEnabled) {
    //   return true
    // }

    // Check if IP is in whitelist
    // const ipWhitelist = (user as any).ipWhitelist || []
    // return ipWhitelist.includes(ipAddress)

    // For now, always return true (feature not fully implemented)
    return true
  } catch (error) {
    console.error("Error checking IP whitelist:", error)
    // On error, allow the request (fail open)
    return true
  }
}

/**
 * Add IP address to whitelist
 * @param userId - User ID
 * @param ipAddress - IP address to add
 */
export async function addIPToWhitelist(userId: string, _ipAddress: string): Promise<void> {
  try {
    // Note: This requires an ipWhitelist field in the users table
    // Implementation would update the user's IP whitelist array
    
    // await prisma.users.update({
    //   where: { id: userId },
    //   data: {
    //     ipWhitelist: {
    //       push: ipAddress
    //     }
    //   }
    // })
    
    console.log(`IP whitelist feature not fully implemented - would add ${_ipAddress} for user ${userId}`)
  } catch (error) {
    console.error("Error adding IP to whitelist:", error)
  }
}

/**
 * Remove IP address from whitelist
 * @param userId - User ID
 * @param ipAddress - IP address to remove
 */
export async function removeIPFromWhitelist(userId: string, _ipAddress: string): Promise<void> {
  try {
    // Note: This requires an ipWhitelist field in the users table
    // Implementation would remove the IP from the user's IP whitelist array
    
    // const user = await prisma.users.findUnique({
    //   where: { id: userId },
    //   select: { ipWhitelist: true }
    // })
    
    // if (user) {
    //   const updatedWhitelist = (user.ipWhitelist || []).filter(ip => ip !== ipAddress)
    //   await prisma.users.update({
    //     where: { id: userId },
    //     data: {
    //       ipWhitelist: updatedWhitelist
    //     }
    //   })
    // }
    
    console.log(`IP whitelist feature not fully implemented - would remove ${_ipAddress} for user ${userId}`)
  } catch (error) {
    console.error("Error removing IP from whitelist:", error)
  }
}
