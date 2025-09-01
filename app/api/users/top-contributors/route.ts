import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface TopContributor {
  id: string
  name: string | null
  image: string | null
  isVerified: boolean | null
  _count: {
    Post: number
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '4', 10)

    // Fetch top contributors based on post count
    const topContributors: TopContributor[] = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        isVerified: true,
        _count: {
          select: {
            Post: true
          }
        }
      },
      orderBy: {
        Post: {
          _count: 'desc'
        }
      },
      take: limit,
      where: {
        Post: {
          some: {} // Only users who have at least one post
        }
      }
    })

    // Format the response with calculated rank
    const contributors = topContributors.map((user: TopContributor, index: number) => ({
      id: user.id,
      name: user.name || 'Anonymous',
      avatar: user.image || '/placeholder-user.jpg',
      rank: `#${index + 1}`, // Calculate rank based on position
      posts: user._count.Post,
      isVerified: user.isVerified || false
    }))

    return NextResponse.json({
      contributors,
      success: true
    })

  } catch (error) {
    console.error('Top Contributors API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch top contributors',
        contributors: [],
        success: false
      },
      { status: 500 }
    )
  }
}
