import { useState, useEffect, useRef } from "react"
import io from "socket.io-client"
import { useAuth } from "@/lib/auth-context"

let socket: any = null

export function usePostComments(postId: string) {
  const { user } = useAuth()
  const [comments, setComments] = useState<any[]>([])
  const [commentInput, setCommentInput] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const commentListRef = useRef<HTMLDivElement>(null)

  // Fetch comments
  useEffect(() => {
    if (!postId) return
    setLoading(true)
    fetch(`/api/comments?postId=${postId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.comments)) {
          setComments(
            data.comments.map((c: any) => ({
              ...c,
              upvotes: c.upvotes ?? 0,
              downvotes: c.downvotes ?? 0,
              replies: c.replies?.map((r: any) => ({
                ...r,
                upvotes: r.upvotes ?? 0,
                downvotes: r.downvotes ?? 0,
              })) ?? []
            }))
          )
        }
      })
      .finally(() => setLoading(false))
  }, [postId])

  // Socket.io real-time updates
  useEffect(() => {
    if (!socket && user) {
      socket = io({ path: "/api/socketio", auth: { userId: user.id } })
    }
    if (!socket) return
    socket.emit("join-post", postId)
    socket.on("new-comment", (comment: any) => {
      setComments(prev => [comment, ...prev])
    })
    socket.on("new-reply", (reply: any) => {
      setComments(prev => prev.map(c =>
        c.id === reply.parentId
          ? { ...c, replies: [...c.replies, reply] }
          : c
      ))
    })
    socket.on("comment-vote-update", (data: { commentId: string, upvotes: number, downvotes: number, userVote: "UP" | "DOWN" | null }) => {
      setComments(prev => prev.map(c =>
        c.id === data.commentId
          ? { ...c, upvotes: data.upvotes, downvotes: data.downvotes, userVote: data.userVote?.toLowerCase() as "up" | "down" | undefined }
          : {
              ...c,
              replies: c.replies?.map((r: any) =>
                r.id === data.commentId
                  ? { ...r, upvotes: data.upvotes, downvotes: data.downvotes, userVote: data.userVote?.toLowerCase() as "up" | "down" | undefined }
                  : r
              )
            }
      ))
    })
    return () => {
      socket?.off("new-comment")
      socket?.off("new-reply")
      socket?.off("comment-vote-update")
    }
  }, [postId, user?.id])

  // Add comment or reply
  const addComment = async () => {
    if (!commentInput.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          content: commentInput,
          parentId: replyTo || undefined
        })
      })
      const data = await res.json()
      if (res.ok && data.comment) {
        const normalizedComment = {
          ...data.comment,
          upvotes: 0,
          downvotes: 0,
          userVote: undefined,
          replies: data.comment.replies?.map((r: any) => ({
            ...r,
            upvotes: 0,
            downvotes: 0,
            userVote: undefined,
          })) ?? []
        }
        if (replyTo) {
          socket?.emit("new-reply", { postId, reply: { ...normalizedComment, parentId: replyTo } })
        } else {
          socket?.emit("new-comment", { postId, comment: normalizedComment })
        }
        setCommentInput("")
        setReplyTo(null)
        setTimeout(() => {
          if (commentListRef.current) commentListRef.current.scrollTop = 0
        }, 100)
      }
    } finally {
      setLoading(false)
    }
  }

  // Vote on comment or reply
  const voteComment = async (commentId: string, type: "up" | "down") => {
    if (!user) return
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        let upvotes = c.upvotes ?? 0
        let downvotes = c.downvotes ?? 0
        let newUserVote: "up" | "down" | undefined = c.userVote
        if (c.userVote === type) {
          newUserVote = undefined
          if (type === "up") upvotes--
          else downvotes--
        } else if (c.userVote) {
          if (type === "up") {
            upvotes++
            downvotes--
          } else {
            upvotes--
            downvotes++
          }
          newUserVote = type
        } else {
          newUserVote = type
          if (type === "up") upvotes++
          else downvotes++
        }
        return { ...c, upvotes, downvotes, userVote: newUserVote }
      }
      return {
        ...c,
        replies: c.replies?.map((r: any) => {
          if (r.id === commentId) {
            let upvotes = r.upvotes ?? 0
            let downvotes = r.downvotes ?? 0
            let newUserVote: "up" | "down" | undefined = r.userVote
            if (r.userVote === type) {
              newUserVote = undefined
              if (type === "up") upvotes--
              else downvotes--
            } else if (r.userVote) {
              if (type === "up") {
                upvotes++
                downvotes--
              } else {
                upvotes--
                downvotes++
              }
              newUserVote = type
            } else {
              newUserVote = type
              if (type === "up") upvotes++
              else downvotes++
            }
            return { ...r, upvotes, downvotes, userVote: newUserVote }
          }
          return r
        })
      }
    }))
    try {
      await fetch(`/api/comments/${commentId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType: type })
      })
      socket?.emit("comment-vote", { commentId, postId, type: type.toUpperCase() })
    } catch (error) {
      console.error("Error voting:", error)
    }
  }

  return {
    comments,
    commentInput,
    setCommentInput,
    replyTo,
    setReplyTo,
    addComment,
    voteComment,
    loading,
    commentListRef
  }
} 