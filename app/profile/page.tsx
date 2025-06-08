"use client"

import { useState, useEffect } from "react"
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
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const { user } = useAuth()
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    company: "",
    profession: "",
    bio: "",
    location: "",
    website: "",
    phone: "",
    profileVisibility: true,
    socialLinks: {
      linkedin: "",
      twitter: "",
      instagram: "",
    },
  })

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return
      
      try {
        const response = await fetch(`/api/users/${user.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch user profile")
        }
        
        const data = await response.json()
        setProfileData({
          name: data.user.name || "",
          email: data.user.email || "",
          company: data.user.company || "",
          profession: data.user.profession || "",
          bio: data.user.bio || "",
          location: data.user.location || "",
          website: data.user.website || "",
          phone: data.user.phone || "",
          profileVisibility: data.user.profileVisibility ?? true,
          socialLinks: {
            linkedin: data.user.linkedinUrl || "",
            twitter: data.user.twitterUrl || "",
            instagram: data.user.instagramUrl || "",
          },
        })
      } catch (err) {
        setError("Failed to load profile data")
        console.error("Profile fetch error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [user?.id])

  const handleSaveProfile = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profileData.name,
          company: profileData.company,
          profession: profileData.profession,
          bio: profileData.bio,
          location: profileData.location,
          website: profileData.website,
          phone: profileData.phone,
          profileVisibility: profileData.profileVisibility,
          linkedinUrl: profileData.socialLinks.linkedin,
          twitterUrl: profileData.socialLinks.twitter,
          instagramUrl: profileData.socialLinks.instagram,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      setIsEditing(false)
    } catch (err) {
      setError("Failed to update profile")
      console.error("Profile update error:", err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center text-red-500">{error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AuthGuard>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user?.image || "/placeholder.svg"} alt={profileData.name} />
                    <AvatarFallback className="text-2xl">{profileData.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button size="icon" variant="secondary" className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full">
                      <Camera className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 className="text-2xl font-bold">{profileData.name}</h1>
                    {user?.isVerified && <CheckCircle className="w-6 h-6 text-blue-500" />}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <Badge variant="secondary" className="text-sm">
                      {user?.rank || "New Member"}
                    </Badge>
                    {profileData.location && (
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {profileData.location}
                      </span>
                    )}
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Member since {new Date(user?.createdAt || "").toLocaleDateString()}
                    </span>
                  </div>

                  {profileData.bio && (
                    <p className="text-gray-700 dark:text-gray-300 mb-4">{profileData.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-lg">{user?._count?.posts || 0}</div>
                      <div className="text-gray-500">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">{user?._count?.comments || 0}</div>
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
                            disabled
                            className="bg-muted"
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
                        {profileData.phone && (
                          <div>
                            <Label className="text-sm font-medium">Phone</Label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.phone}</p>
                          </div>
                        )}
                        {profileData.website && (
                          <div>
                            <Label className="text-sm font-medium">Website</Label>
                            <a
                              href={profileData.website}
                              className="text-sm text-primary hover:underline flex items-center"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <LinkIcon className="w-4 h-4 mr-1" />
                              {profileData.website}
                            </a>
                          </div>
                        )}
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
                              <SelectValue placeholder="Select profession" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="architect">Architect</SelectItem>
                              <SelectItem value="interior-designer">Interior Designer</SelectItem>
                              <SelectItem value="urban-planner">Urban Planner</SelectItem>
                              <SelectItem value="construction-manager">Construction Manager</SelectItem>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
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
                        {profileData.company && (
                          <div>
                            <Label className="text-sm font-medium">Company</Label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.company}</p>
                          </div>
                        )}
                        {profileData.profession && (
                          <div>
                            <Label className="text-sm font-medium">Profession</Label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {profileData.profession.split("-").map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(" ")}
                            </p>
                          </div>
                        )}
                        {profileData.bio && (
                          <div>
                            <Label className="text-sm font-medium">Bio</Label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.bio}</p>
                          </div>
                        )}
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
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
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
                      disabled={!isEditing}
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
    </AuthGuard>
  )
}
