import { Server as SocketIOServer } from 'socket.io'
import { prisma } from './prisma'

// Stats cache to avoid excessive database queries
let statsCache: {
  data: any
  timestamp: number
  ttl: number
} | null = null

const STATS_CACHE_TTL = 30000 // 30 seconds cache

export interface StatsData {
  totalUsers: number
  totalPosts: number
  totalComments: number
  activeUsers: number
  recentPosts: number
  timestamp: string
}

export async function getStatsData(): Promise<StatsData> {
  // Check cache first
  if (statsCache && Date.now() - statsCache.timestamp < statsCache.ttl) {
    return statsCache.data
  }

  // Calculate the date 24 hours ago
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  // Use Promise.all for better performance with parallel queries
  const [totalUsers, totalPosts, totalComments, activeUsers, recentActivity] = await Promise.all([
    // Get total users (exclude suspended users)
    prisma.users.count({
      where: {
        isSuspended: false
      }
    }),
    
    // Get total posts
    prisma.post.count(),
    
    // Get total comments
    prisma.comment.count(),
    
    // Get active users (users who have been active within the last 24 hours)
    prisma.users.count({
      where: {
        lastActiveAt: {
          gte: twentyFourHoursAgo
        },
        isSuspended: false
      }
    }),
    
    // Get recent activity stats for additional insights
    prisma.post.count({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo
        }
      }
    })
  ])

  const data: StatsData = {
    totalUsers,
    totalPosts,
    totalComments,
    activeUsers,
    recentPosts: recentActivity,
    timestamp: new Date().toISOString()
  }

  // Update cache
  statsCache = {
    data,
    timestamp: Date.now(),
    ttl: STATS_CACHE_TTL
  }

  return data
}

export function invalidateStatsCache() {
  statsCache = null
}

// Global reference to Socket.IO server (will be set from server.js)
let io: SocketIOServer | null = null

export function setSocketIOServer(server: SocketIOServer) {
  io = server
}

export async function broadcastStatsUpdate(eventType: 'user_created' | 'user_deleted' | 'user_role_updated' | 'post_created' | 'post_deleted' | 'comment_created' | 'comment_deleted') {
  if (!io) {
    console.warn('Socket.IO server not available for stats broadcast')
    return
  }

  try {
    // Invalidate cache to force fresh data
    invalidateStatsCache()
    
    // Get fresh stats
    const stats = await getStatsData()
    
    // Broadcast to admin users only
    io.to('admin-stats').emit('stats-update', {
      stats,
      eventType,
      timestamp: new Date().toISOString()
    })
    
    console.log(`📊 Broadcasted stats update for ${eventType}:`, {
      totalUsers: stats.totalUsers,
      totalPosts: stats.totalPosts,
      totalComments: stats.totalComments,
      activeUsers: stats.activeUsers
    })
  } catch (error) {
    console.error('Error broadcasting stats update:', error)
  }
}

// Helper functions to call when data changes
export async function onUserCreated() {
  await broadcastStatsUpdate('user_created')
}

export async function onUserDeleted() {
  await broadcastStatsUpdate('user_deleted')
}

export async function onPostCreated() {
  await broadcastStatsUpdate('post_created')
}

export async function onPostDeleted() {
  await broadcastStatsUpdate('post_deleted')
}

export async function onCommentCreated() {
  await broadcastStatsUpdate('comment_created')
}

export async function onCommentDeleted() {
  await broadcastStatsUpdate('comment_deleted')
}

export async function onUserRoleUpdated() {
  await broadcastStatsUpdate('user_role_updated')
}