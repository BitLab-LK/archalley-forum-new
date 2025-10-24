"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth-context"
import { useSocket } from "@/lib/socket-context"
import { PostBadges } from "@/components/post-badges"
import { ArrowUp, ArrowDown, Reply, Flag, Award } from "lucide-react"

interface UserBadge {
  id: string
  badges: {
    id: string
    name: string
    description: string
    icon: string
    color: string
    level: string
    type: string
  }
  earnedAt: Date
}

interface Comment {
  id: string
  content: string
  author: {
    name: string
    image?: string
    rank: string
    isVerified: boolean
    badges?: UserBadge[]
  }
  isAnonymous: boolean
  createdAt: string
  votes: number
  userVote?: "up" | "down"
  isBestAnswer?: boolean
  replies?: Comment[]
}

interface CommentSectionProps {
  postId: string
  comments: Comment[]
  canMarkBestAnswer?: boolean
}

export default function CommentSection({ postId, comments: initialComments, canMarkBestAnswer }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const { socket, joinPost, leavePost } = useSocket()

  useEffect(() => {
    if (socket) {
      joinPost(postId)
      
      // Listen for comment vote updates
      const handleCommentVoteUpdate = (data: { commentId: string, upvotes: number, downvotes: number, userVote: "UP" | "DOWN" | null }) => {
        setComments(prev => prev.map(c =>
          c.id === data.commentId
            ? { ...c, votes: data.upvotes - data.downvotes, userVote: data.userVote?.toLowerCase() as "up" | "down" | undefined }
            : {
                ...c,
                replies: c.replies?.map(r =>
                  r.id === data.commentId
                    ? { ...r, votes: data.upvotes - data.downvotes, userVote: data.userVote?.toLowerCase() as "up" | "down" | undefined }
                    : r
                )
              }
        ))
      }
      
      // Listen for new comments
      const handleNewComment = (commentData: Comment) => {
        setComments(prev => [...prev, commentData])
      }
      
      socket.on("comment-vote-update", handleCommentVoteUpdate)
      socket.on("new-comment", handleNewComment)
      
      return () => {
        socket.off("comment-vote-update", handleCommentVoteUpdate)
        socket.off("new-comment", handleNewComment)
        leavePost(postId)
      }
    }
    
    return () => {
      // Cleanup when socket is not available
    }
  }, [socket, postId, joinPost, leavePost])

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment.trim(),
          postId,
          parentId,
        }),
      })

      if (response.ok) {
        const newCommentData = await response.json()
        setNewComment("")
        setReplyingTo(null)
        
        // Emit socket event for real-time updates
        if (socket) {
          socket.emit("new-comment", {
            postId,
            comment: newCommentData
          })
        }
        
        // Add to local state immediately
        setComments(prev => [...prev, newCommentData])
      }
    } catch (error) {
      console.error("Error creating comment:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVote = async (commentId: string, voteType: "up" | "down") => {
    // Optimistic UI update
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        let newVote: "up" | "down" | undefined = voteType
        let newVotes = c.votes
        if (c.userVote === voteType) {
          newVote = undefined
          newVotes += voteType === "up" ? -1 : 1
        } else if (c.userVote) {
          newVotes += voteType === "up" ? 2 : -2
        } else {
          newVotes += voteType === "up" ? 1 : -1
        }
        return { ...c, votes: newVotes, userVote: newVote }
      }
      return {
        ...c,
        replies: c.replies?.map(r => {
          if (r.id === commentId) {
            let newVote: "up" | "down" | undefined = voteType
            let newVotes = r.votes
            if (r.userVote === voteType) {
              newVote = undefined
              newVotes += voteType === "up" ? -1 : 1
            } else if (r.userVote) {
              newVotes += voteType === "up" ? 2 : -2
            } else {
              newVotes += voteType === "up" ? 1 : -1
            }
            return { ...r, votes: newVotes, userVote: newVote }
          }
          return r
        })
      }
    }))
    try {
      await fetch(`/api/comments/${commentId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType })
      })
      socket?.emit("comment-vote", { commentId, postId, type: voteType.toUpperCase() })
    } catch (error) {
      console.error("Error voting:", error)
    }
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? "ml-8 mt-4" : "mb-6"}`}>
      <Card className={comment.isBestAnswer ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={comment.isAnonymous ? undefined : comment.author.image} />
              <AvatarFallback>{comment.isAnonymous ? "?" : comment.author.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-sm">{comment.isAnonymous ? "Anonymous" : comment.author.name}</span>
                {!comment.isAnonymous && comment.author.isVerified && (
                  <Badge variant="secondary" className="text-xs">
                    ✓
                  </Badge>
                )}
                {comment.isBestAnswer && (
                  <Badge className="text-xs bg-green-500">
                    <Award className="w-3 h-3 mr-1" />
                    Best Answer
                  </Badge>
                )}
                {/* User badges */}
                {!comment.isAnonymous && comment.author?.badges && comment.author.badges.length > 0 && (
                  <PostBadges 
                    badges={comment.author.badges.map(b => b.badges)} 
                    maxDisplay={2} 
                    size="xs"
                  />
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p className="text-sm mb-3">{comment.content}</p>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(comment.id, "up")}
                    className={`h-8 px-2 ${comment.userVote === "up" ? "text-green-600" : ""}`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium">{comment.votes}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(comment.id, "down")}
                    className={`h-8 px-2 ${comment.userVote === "down" ? "text-red-600" : ""}`}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="h-8 px-2"
                >
                  <Reply className="w-4 h-4 mr-1" />
                  Reply
                </Button>

                {canMarkBestAnswer && !comment.isBestAnswer && (
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <Award className="w-4 h-4 mr-1" />
                    Mark as Best
                  </Button>
                )}

                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Flag className="w-4 h-4" />
                </Button>
              </div>

              {replyingTo === comment.id && (
                <AuthGuard>
                  <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-4">
                    <Textarea
                      placeholder="Write a reply..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="mb-2"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <Button type="submit" size="sm" disabled={!newComment.trim() || isLoading}>
                        Reply
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setReplyingTo(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </AuthGuard>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {comment.replies?.map((reply) => (
        <CommentItem key={reply.id} comment={reply} isReply />
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Add Comment Form */}
      <AuthGuard>
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-start space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.image || "/placeholder.svg"} />
                  <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px]"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={!newComment.trim() || isLoading}>
                  {isLoading ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </AuthGuard>

      {/* Comments List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Comments ({comments.length})</h3>
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => <CommentItem key={comment.id} comment={comment} />)
        )}
      </div>
    </div>
  )
}
