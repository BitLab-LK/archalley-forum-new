import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateAdminAccess, logAdminAction } from '@/lib/admin-security'

export async function GET(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const validationResult = await validateAdminAccess(request)
    if (!validationResult.isValid || !validationResult.session?.user?.id) {
      return validationResult.response
    }

    const { postId } = await params

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Fetch the complete post data for editing
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        isPinned: true,
        isLocked: true,
        isHidden: true,
        isAnonymous: true,
        viewCount: true,
        authorId: true,
        primaryCategoryId: true,
        categoryIds: true,
        users: {
          select: {
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        primaryCategory: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        _count: {
          select: {
            Comment: true,
            flags: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true,
      post: {
        ...post,
        author: post.users,
        category: post.primaryCategory,
        stats: {
          comments: post._count?.Comment || 0,
          flags: post._count?.flags || 0
        },
        status: {
          isAnonymous: post.isAnonymous,
          isPinned: post.isPinned,
          isLocked: post.isLocked,
          isHidden: post.isHidden,
          isFlagged: (post._count?.flags || 0) > 0
        }
      }
    })

  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const validationResult = await validateAdminAccess(request)
    if (!validationResult.isValid || !validationResult.session?.user?.id) {
      return validationResult.response
    }
    const { session } = validationResult
    const { postId } = await params

    const body = await request.json()
    const { action, data } = body

    if (!postId || !action) {
      return NextResponse.json(
        { error: 'Post ID and action are required' },
        { status: 400 }
      )
    }

    // Check if user has edit permissions (ADMIN or SUPER_ADMIN only)
    if (action === 'edit' && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only Admins and Super Admins can edit posts' },
        { status: 403 }
      )
    }

    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { 
        id: true, 
        title: true, 
        content: true,
        primaryCategoryId: true,
        authorId: true 
      }
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (action === 'edit') {
      const { title, content, primaryCategoryId } = data

      if (!title?.trim() || !content?.trim()) {
        return NextResponse.json(
          { error: 'Title and content are required' },
          { status: 400 }
        )
      }

      // Validate category if provided
      if (primaryCategoryId) {
        const categoryExists = await prisma.categories.findUnique({
          where: { id: primaryCategoryId }
        })
        
        if (!categoryExists) {
          return NextResponse.json(
            { error: 'Invalid category selected' },
            { status: 400 }
          )
        }
      }

      // Update the post
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          title: title.trim(),
          content: content.trim(),
          primaryCategoryId: primaryCategoryId || null,
          updatedAt: new Date()
        }
      })

      await logAdminAction(session.user.id, 'POST_EDITED', {
        postId,
        originalTitle: existingPost.title,
        newTitle: title.trim(),
        originalContent: existingPost.content?.substring(0, 100),
        newContent: content.trim().substring(0, 100),
        originalCategoryId: existingPost.primaryCategoryId,
        newCategoryId: primaryCategoryId || null
      })

      return NextResponse.json({ 
        success: true,
        message: 'Post updated successfully',
        post: updatedPost
      })
    }

    // Handle visibility toggle for moderators and admins
    if (action === 'hide') {
      const isHidden = data === true || data === 'true'
      
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          isHidden: isHidden,
          updatedAt: new Date()
        }
      })

      await logAdminAction(session.user.id, 'POST_VISIBILITY_CHANGED', {
        postId,
        action: isHidden ? 'hidden' : 'unhidden',
        previousState: !isHidden
      })

      return NextResponse.json({ 
        success: true,
        message: `Post ${isHidden ? 'hidden' : 'unhidden'} successfully`,
        post: updatedPost
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}