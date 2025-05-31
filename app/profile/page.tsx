"use client"

import { useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Camera, CheckCircle, MapPin, Calendar, LinkIcon } from "lucide-react"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    company: "Archalley Design Studio",
    profession: "Architect",
    bio: "Passionate architect with 10+ years of experience in sustainable design and urban planning. Love creating spaces that inspire and connect communities.",
    location: "San Francisco, CA",
    website: "https://johndoe.com",
    phone: "+1 (555) 123-4567",
    profileVisibility: true,
    socialLinks: {
      linkedin: "https://linkedin.com/in/johndoe",
      twitter: "https://twitter.com/johndoe",
      instagram: "https://instagram.com/johndoe",
    },
  })

  const userStats = {
    posts: 156,
    upvotes: 1234,
    comments: 567,
    rank: "Community Expert",
    joinDate: "January 2023",
    isVerified: true,
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src="/placeholder.svg?height=96&width=96" />
                    <AvatarFallback className="text-2xl">JD</AvatarFallback>
                  </Avatar>
                  <Button size="icon" variant="secondary" className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full">
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 className="text-2xl font-bold">{profileData.name}</h1>
                    {userStats.isVerified && <CheckCircle className="w-6 h-6 text-blue-500" />}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <Badge variant="secondary" className="text-sm">
                      {userStats.rank}
                    </Badge>
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {profileData.location}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Joined {userStats.joinDate}
                    </span>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-4">{profileData.bio}</p>

                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-lg">{userStats.posts}</div>
                      <div className="text-gray-500">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">{userStats.upvotes}</div>
                      <div className="text-gray-500">Upvotes</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">{userStats.comments}</div>
                      <div className="text-gray-500">Comments</div>
                    </div>
                  </div>
                </div>

                <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "secondary" : "default"}>
                  <Edit className="w-4 h-4 mr-2" />
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Profile Content */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            value={profileData.website}
                            onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Email</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.email}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Phone</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.phone}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Website</Label>
                          <a
                            href={profileData.website}
                            className="text-sm text-primary hover:underline flex items-center"
                          >
                            <LinkIcon className="w-4 h-4 mr-1" />
                            {profileData.website}
                          </a>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Professional Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="company">Company</Label>
                          <Input
                            id="company"
                            value={profileData.company}
                            onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profession">Profession</Label>
                          <Select
                            value={profileData.profession}
                            onValueChange={(value) => setProfileData({ ...profileData, profession: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="architect">Architect</SelectItem>
                              <SelectItem value="interior-designer">Interior Designer</SelectItem>
                              <SelectItem value="urban-planner">Urban Planner</SelectItem>
                              <SelectItem value="construction-manager">Construction Manager</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={profileData.bio}
                            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                            rows={4}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Company</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.company}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Profession</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.profession}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Bio</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.bio}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsEditing(false)}>Save Changes</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="posts">
              <Card>
                <CardHeader>
                  <CardTitle>My Posts</CardTitle>
                  <CardDescription>All your forum posts and contributions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-gray-500 py-8">Your posts will appear here</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>Manage your privacy and visibility preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Profile Visibility</Label>
                      <p className="text-sm text-gray-500">Make your profile visible in the public directory</p>
                    </div>
                    <Switch
                      checked={profileData.profileVisibility}
                      onCheckedChange={(checked) => setProfileData({ ...profileData, profileVisibility: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your recent forum activity and interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-gray-500 py-8">Your activity will appear here</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
