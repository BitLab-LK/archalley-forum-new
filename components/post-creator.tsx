"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ImageIcon, AtSign } from "lucide-react"

export default function PostCreator() {
  const [postContent, setPostContent] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex space-x-4">
          <Avatar>
            <AvatarImage src="/placeholder.svg?height=40&width=40" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="What's on your mind? Share your thoughts about architecture, design, or construction..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="min-h-[100px] resize-none border-none shadow-none text-lg placeholder:text-gray-500"
            />

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Add Media
                </Button>
                <Button variant="ghost" size="sm">
                  <AtSign className="w-4 h-4 mr-2" />
                  Mention
                </Button>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                  <Label htmlFor="anonymous" className="text-sm">
                    Post anonymously
                  </Label>
                </div>
                <Button className="bg-primary hover:bg-primary/90">Post</Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
