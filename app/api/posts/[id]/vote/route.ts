import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const voteSchema = z.object({
  type: z.enum(["UP", "DOWN"]),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type } = voteSchema.parse(body)

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: params.id },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if user already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: params.id,
        },
      },
    })

    if (existingVote) {
      if (existingVote.type === type) {
        // Remove vote if same type
        await prisma.vote.delete({
          where: { id: existingVote.id },
        })
      } else {
        // Update vote type
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { type },
        })
      }
    } else {
      // Create new vote
      await prisma.vote.create({
        data: {
          type,
          userId: session.user.id,
          postId: params.id,
        },
      })
    }

    // Update post vote counts
    const [upvotes, downvotes] = await Promise.all([
      prisma.vote.count({
        where: { postId: params.id, type: "UP" },
      }),
      prisma.vote.count({
        where: { postId: params.id, type: "DOWN" },
      }),
    ])

    await prisma.post.update({
      where: { id: params.id },
      data: { upvotes, downvotes },
    })

    return NextResponse.json({ upvotes, downvotes })
  } catch (error) {
    console.error("Vote error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
