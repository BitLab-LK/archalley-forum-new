"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ImageIcon, Send } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/lib/auth-context"

export default function PostCreator() {
  const [content, setContent] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          isAnonymous,
        }),
      })

      if (response.ok) {
        setContent("")
        setIsAnonymous(false)
        // Refresh the page or update the posts list
        window.location.reload()
      }
    } catch (error) {
      console.error("Error creating post:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard>
      <Card className="mb-6">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={isAnonymous ? undefined : user?.image} />
                <AvatarFallback>{isAnonymous ? "?" : user?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder={`What's on your mind, ${isAnonymous ? "Anonymous" : user?.name?.split(" ")[0]}?`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[100px] resize-none border-0 p-0 focus-visible:ring-0"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center space-x-4">
                <Button type="button" variant="ghost" size="sm">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Photo
                </Button>

                <div className="flex items-center space-x-2">
                  <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} disabled={isLoading} />
                  <Label htmlFor="anonymous" className="text-sm">
                    Post anonymously
                  </Label>
                </div>
              </div>

              <Button type="submit" disabled={!content.trim() || isLoading} size="sm">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthGuard>
  )
}
