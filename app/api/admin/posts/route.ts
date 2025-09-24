import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateAdminAccess, logAdminAction } from '@/lib/admin-security'

export async function GET(request: NextRequest) {
  try {
    const validationResult = await validateAdminAccess(request)
    if (!validationResult.isValid || !validationResult.session?.user?.id) {
      return validationResult.response
    }
    const { session } = validationResult

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') // all, flagged, pinned, locked
    const category = searchParams.get('category')
    const author = searchParams.get('author')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const search = searchParams.get('search')

    // Build where clause
    const whereClause: any = {}

    if (status === 'flagged') {
      // Need to find posts that have flags - we'll do this with a subquery
      const flaggedPostIds = await prisma.flags.findMany({
        where: { postId: { not: null } },
        select: { postId: true },
        distinct: ['postId']
      })
      whereClause.id = { in: flaggedPostIds.map(f => f.postId).filter(Boolean) }
    } else if (status === 'pinned') {
      whereClause.isPinned = true
    } else if (status === 'locked') {
      whereClause.isLocked = true
    }

    if (category) {
      whereClause.categoryId = category
    }

    if (author) {
      whereClause.authorId = author
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      orderBy: {
        [sortBy]: sortOrder
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        isPinned: true,
        isLocked: true,
        isAnonymous: true,
        viewCount: true,
        authorId: true,
        categoryId: true,
        users: {
          select: {
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        categories: {
          select: {
            name: true,
            color: true,
            icon: true
          }
        },
        _count: {
          select: {
            Comment: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Get flags for these posts separately
    const postIds = posts.map(p => p.id)
    const flags = await prisma.flags.findMany({
      where: {
        postId: { in: postIds }
      },
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
        postId: true,
        users: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Get vote counts for these posts
    const voteCounts = await prisma.votes.groupBy({
      by: ['postId'],
      where: {
        postId: { in: postIds }
      },
      _count: {
        id: true
      }
    })

    // Get total count for pagination
    const totalPosts = await prisma.post.count({ where: whereClause })

    const formattedPosts = posts.map(post => {
      const postFlags = flags.filter(f => f.postId === post.id)
      const voteCount = voteCounts.find(v => v.postId === post.id)?._count.id || 0

      return {
        id: post.id,
        title: post.title,
        content: post.content?.substring(0, 200) + (post.content?.length > 200 ? "..." : ""),
        author: {
          name: post.users?.name || 'Unknown',
          email: post.users?.email || '',
          image: post.users?.image || null,
          role: post.users?.role || 'MEMBER'
        },
        category: post.categories ? {
          name: post.categories.name,
          color: post.categories.color,
          icon: post.categories.icon
        } : null,
        stats: {
          comments: post._count?.Comment || 0,
          votes: voteCount,
          flags: postFlags.length
        },
        flags: postFlags,
        status: {
          isAnonymous: post.isAnonymous,
          isPinned: post.isPinned,
          isLocked: post.isLocked,
          isFlagged: postFlags.length > 0
        },
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString()
      }
    })

    await logAdminAction(session.user.id, 'POSTS_VIEWED', {
      filters: { status, category, author, search },
      resultCount: formattedPosts.length
    })

    return NextResponse.json({ 
      posts: formattedPosts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasNext: page < Math.ceil(totalPosts / limit),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const validationResult = await validateAdminAccess(request)
    if (!validationResult.isValid || !validationResult.session?.user?.id) {
      return validationResult.response
    }
    const { session } = validationResult

    const body = await request.json()
    const { postId, action, value } = body

    if (!postId || !action) {
      return NextResponse.json(
        { error: 'Post ID and action are required' },
        { status: 400 }
      )
    }

    let updateData: any = {}
    let actionDescription = ''

    switch (action) {
      case 'pin':
        updateData.isPinned = value
        actionDescription = value ? 'pinned' : 'unpinned'
        break
      case 'lock':
        updateData.isLocked = value
        actionDescription = value ? 'locked' : 'unlocked'
        break
      case 'approve':
        // Mark all flags as resolved
        await prisma.flags.updateMany({
          where: { postId, status: 'PENDING' },
          data: { status: 'RESOLVED' }
        })
        actionDescription = 'approved (flags resolved)'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.post.update({
        where: { id: postId },
        data: updateData
      })
    }

    await logAdminAction(session.user.id, 'POST_MODERATED', {
      postId,
      action: actionDescription,
      value
    })

    return NextResponse.json({ 
      success: true,
      message: `Post ${actionDescription} successfully`
    })

  } catch (error) {
    console.error('Error moderating post:', error)
    return NextResponse.json(
      { error: 'Failed to moderate post' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const validationResult = await validateAdminAccess(request)
    if (!validationResult.isValid || !validationResult.session?.user?.id) {
      return validationResult.response
    }
    const { session } = validationResult

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { title: true, authorId: true }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Delete post and related data in transaction
    await prisma.$transaction([
      prisma.flags.deleteMany({ where: { postId } }),
      prisma.comment.deleteMany({ where: { postId } }),
      prisma.votes.deleteMany({ where: { postId } }),
      prisma.attachments.deleteMany({ where: { postId } }),
      prisma.post.delete({ where: { id: postId } })
    ])

    await logAdminAction(session.user.id, 'POST_DELETED', {
      postId,
      postTitle: post.title,
      originalAuthorId: post.authorId
    })

    return NextResponse.json({ 
      success: true,
      message: 'Post deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}