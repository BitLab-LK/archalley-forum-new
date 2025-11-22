"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Camera, CheckCircle, MapPin, Calendar, LinkIcon, Settings, Briefcase, GraduationCap, Globe, FileText, Shield, Share2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import ActivityFeed from "@/components/activity-feed"
import { PostBadges } from "@/components/post-badges"

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

export default function ProfilePage() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const userBadges: UserBadge[] = []
  const { user, isLoading: authLoading } = useAuth()

  // Redirect to /profile/{uuid} when user accesses /profile
  useEffect(() => {
    if (!authLoading && user?.id) {
      router.replace(`/profile/${user.id}`)
    }
  }, [user?.id, authLoading, router])

  const transformedBadges = userBadges.map(ub => ({
    id: ub.badges.id,
    name: ub.badges.name,
    description: ub.badges.description,
    icon: ub.badges.icon,
    color: ub.badges.color,
    level: ub.badges.level,
    type: ub.badges.type
  }))

  const [profileData, setProfileData] = useState({
    // Basic Information
    firstName: "",
    lastName: "",
    name: "",
    email: "",
    phoneNumber: "",
    
    // Professional Profile
    headline: "",
    skills: [] as string[],
    industry: "",
    country: "",
    city: "",
    bio: "",
    portfolioUrl: "",
    
    // Social Media
    linkedinUrl: "",
    facebookUrl: "",
    instagramUrl: "",
    
    // Work Experience & Education
    workExperience: [] as any[],
    education: [] as any[],
    
    // Settings
    profileVisibility: true,
  })

  // Skip data fetching since we're redirecting to /profile/{uuid}
  // The redirect happens immediately, so we don't need to fetch profile data here

  const handleSaveProfile = useCallback(async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Basic Information
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          name: `${profileData.firstName} ${profileData.lastName}`.trim(),
          phoneNumber: profileData.phoneNumber,
          
          // Professional Profile
          headline: profileData.headline,
          skills: profileData.skills,
          industry: profileData.industry,
          country: profileData.country,
          city: profileData.city,
          bio: profileData.bio,
          portfolioUrl: profileData.portfolioUrl,
          
          // Social Media
          linkedinUrl: profileData.linkedinUrl,
          facebookUrl: profileData.facebookUrl,
          instagramUrl: profileData.instagramUrl,
          
          // Settings
          profileVisibility: profileData.profileVisibility,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      setIsEditing(false)
    } catch (err) {
      console.error("Failed to update profile", err)
    }
  }, [user?.id, profileData])

  // Show loading state while auth is loading or while redirecting
  if (authLoading || user?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen animate-fade-in">
        <div className="text-center animate-scale-in animate-delay-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground animate-fade-in-up animate-delay-200">Redirecting to your profile...</p>
        </div>
      </div>
    )
  }

  // If user is not authenticated, AuthGuard will handle redirect to login
  // If user is authenticated but no ID (shouldn't happen), show error
  if (!user?.id && !authLoading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen animate-fade-in">
          <Card className="max-w-md w-full animate-scale-in animate-delay-100">
            <CardContent className="pt-6">
              <div className="text-center text-red-500 animate-fade-in-up animate-delay-200">
                Unable to load user profile
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    )
  }

  // This should not be reached in normal flow due to redirect above
  // But keeping it as fallback for edge cases
  return (
    <AuthGuard>
      <main className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8 animate-fade-in">
        <div className="space-y-4 sm:space-y-6">
          {/* Profile Header */}
          <Card className="bg-white border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 smooth-transition hover-lift animate-fade-in-up animate-delay-100">
            <CardContent className="p-3 sm:p-8">
              {/* Mobile Layout - Stacked */}
              <div className="block sm:hidden space-y-3">
                {/* Header with Edit Button in absolute top-right */}
                <div className="relative">
                  {/* Edit Button - Absolute top-right */}
                  <Button 
                    onClick={() => setIsEditing(!isEditing)} 
                    variant={isEditing ? "secondary" : "default"}
                    size="sm"
                    className={`absolute top-0 right-0 px-2 py-1 text-xs z-10 smooth-transition hover-lift ${isEditing 
                      ? "bg-gray-100 hover:bg-gray-200 text-gray-700" 
                      : "bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
                    }`}
                  >
                    <User className="w-3 h-3 mr-1" />
                    {isEditing ? "Cancel" : "Edit"}
                  </Button>
                  
                  {/* Avatar + Name Row */}
                  <div className="flex items-center space-x-3 pr-16">
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-12 h-12 smooth-transition hover:scale-110">
                        <AvatarImage src={user?.image || "/placeholder.svg"} alt={profileData.name} />
                        <AvatarFallback className="text-sm">{profileData.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {isEditing && (
                      <Button size="icon" variant="secondary" className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full smooth-transition hover-lift">
                        <Camera className="w-2 h-2" />
                      </Button>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1 mb-1">
                        <h1 className="text-base font-bold truncate">{profileData.name}</h1>
                        {user?.isVerified && <CheckCircle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
                      </div>
                      {profileData.headline && (
                        <p className="text-xs text-gray-600 truncate">{profileData.headline}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Badges Row */}
                {userBadges.length > 0 && (
                  <div className="flex justify-start">
                    <PostBadges 
                      badges={transformedBadges}
                      maxDisplay={2}
                      size="sm"
                    />
                  </div>
                )}

                {/* Second Row: Location and Date */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                  {(profileData.city || profileData.country) && (
                  <span className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{[profileData.city, profileData.country].filter(Boolean).join(", ")}</span>
                  </span>
                  )}
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                    Joined {new Date(user?.createdAt || "").toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>

                {/* Third Row: Stats */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-center">
                    <div className="font-bold text-sm">{user?._count?.posts || 0}</div>
                    <div className="text-gray-500">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-sm">{user?._count?.comments || 0}</div>
                    <div className="text-gray-500">Comments</div>
                  </div>
                </div>

                {/* Bio if present */}
                {profileData.bio && (
                  <p className="text-xs text-gray-700 line-clamp-2">{profileData.bio}</p>
                )}
              </div>

              {/* Desktop Layout - Original */}
              <div className="hidden sm:flex sm:flex-row sm:space-y-0 sm:space-x-6">
                <div className="flex items-center space-x-4 sm:flex-col sm:items-start sm:space-x-0">
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-24 h-24 smooth-transition hover:scale-110">
                      <AvatarImage src={user?.image || "/placeholder.svg"} alt={profileData.name} />
                      <AvatarFallback className="text-2xl">{profileData.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {isEditing && (
                    <Button size="icon" variant="secondary" className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full smooth-transition hover-lift">
                      <Camera className="w-4 h-4" />
                    </Button>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h1 className="text-2xl font-bold">{profileData.name}</h1>
                      {user?.isVerified && <CheckCircle className="w-6 h-6 text-yellow-500" />}
                    </div>
                    {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.isAdmin) && (
                      <Badge variant="outline">Public Profile</Badge>
                    )}
                  </div>

                  {userBadges.length > 0 && (
                    <div className="mb-3">
                      <PostBadges 
                        badges={transformedBadges}
                        maxDisplay={5}
                        size="md"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {(profileData.city || profileData.country) && (
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span>{[profileData.city, profileData.country].filter(Boolean).join(", ")}</span>
                    </span>
                    )}
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                      Member since {new Date(user?.createdAt || "").toLocaleDateString()}
                    </span>
                  </div>

                  {profileData.bio && (
                  <p className="text-base text-gray-700 dark:text-gray-300 mb-4">{profileData.bio}</p>
                  )}

                  <div className="flex items-center gap-6 text-sm">
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

                <div className="flex">
                  <Button 
                    onClick={() => setIsEditing(!isEditing)} 
                    variant={isEditing ? "secondary" : "default"}
                    size="sm"
                    className={`smooth-transition hover-lift ${isEditing 
                      ? "bg-gray-100 hover:bg-gray-200 text-gray-700" 
                      : "bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
                    }`}
                  >
                    <User className="w-4 h-4 mr-2" />
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Content */}
          <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6 animate-fade-in-up animate-delay-200">
            <div className="overflow-x-auto">
              <TabsList className="grid w-full grid-cols-4 bg-gray-50 border border-gray-200 min-w-max sm:min-w-0 smooth-transition hover-lift">
                <TabsTrigger value="overview" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white text-xs sm:text-sm smooth-transition">Overview</TabsTrigger>
                <TabsTrigger value="posts" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white text-xs sm:text-sm smooth-transition">Posts</TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white text-xs sm:text-sm smooth-transition">Settings</TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white text-xs sm:text-sm smooth-transition">Activity</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 animate-fade-in-up animate-delay-300">
                {/* Basic Information */}
                <Card className="group bg-white border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden smooth-transition hover-lift animate-scale-in animate-delay-400">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 p-4 sm:p-6">
                    <CardTitle className="text-slate-900 flex items-center gap-3 text-base sm:text-lg">
                      <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm smooth-transition hover:scale-110">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold">Personal Information</span>
                        <p className="text-sm text-slate-600 font-normal mt-1">Basic personal details and contact information</p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-6">
                    {isEditing ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={profileData.firstName}
                              onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={profileData.lastName}
                              onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            value={profileData.email}
                            disabled
                            className="bg-muted cursor-not-allowed"
                          />
                          <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber">Phone Number</Label>
                          <Input
                            id="phoneNumber"
                            value={profileData.phoneNumber}
                            onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">First Name</Label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.firstName || "Not provided"}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Last Name</Label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.lastName || "Not provided"}</p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Email Address</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.email}</p>
                        </div>
                        {profileData.phoneNumber && (
                        <div>
                          <Label className="text-sm font-medium">Phone Number</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.phoneNumber}</p>
                        </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Professional Profile */}
                <Card className="group bg-white border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden smooth-transition hover-lift animate-scale-in animate-delay-500">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 p-4 sm:p-6">
                    <CardTitle className="text-slate-900 flex items-center gap-3 text-base sm:text-lg">
                      <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm smooth-transition hover:scale-110">
                        <Briefcase className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold">Professional Profile</span>
                        <p className="text-sm text-slate-600 font-normal mt-1">Career and professional expertise</p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-6">
                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="headline">Headline</Label>
                          <Input
                            id="headline"
                            value={profileData.headline}
                            onChange={(e) => setProfileData({ ...profileData, headline: e.target.value })}
                            placeholder="e.g., Civil Engineer at XYZ Constructions"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="industry">Industry</Label>
                          <Input
                            id="industry"
                            value={profileData.industry}
                            onChange={(e) => setProfileData({ ...profileData, industry: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              value={profileData.country}
                              onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={profileData.city}
                              onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio">About/Summary</Label>
                          <Textarea
                            id="bio"
                            value={profileData.bio}
                            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                            rows={4}
                            placeholder="Tell us about yourself..."
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {profileData.headline && (
                        <div>
                          <Label className="text-sm font-medium">Headline</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.headline}</p>
                        </div>
                        )}
                        {profileData.industry && (
                        <div>
                          <Label className="text-sm font-medium">Industry</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.industry}</p>
                        </div>
                        )}
                        {(profileData.country || profileData.city) && (
                        <div>
                          <Label className="text-sm font-medium">Location</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {[profileData.city, profileData.country].filter(Boolean).join(", ")}
                          </p>
                        </div>
                        )}
                        {profileData.bio && (
                        <div>
                          <Label className="text-sm font-medium">About</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.bio}</p>
                        </div>
                        )}
                        {profileData.skills && profileData.skills.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Skills</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {profileData.skills.map((skill, index) => (
                              <Badge key={`skill-${index}`} variant="secondary" className="text-xs bg-gray-100 text-slate-700 border border-gray-200 hover:bg-gray-200 transition-colors">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Portfolio & Social Links Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 animate-fade-in-up animate-delay-600">
                {/* Portfolio/Website Links */}
                <Card className="group bg-white border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden smooth-transition hover-lift animate-scale-in animate-delay-700">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 p-4 sm:p-6">
                    <CardTitle className="text-slate-900 flex items-center gap-3 text-base sm:text-lg">
                      <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm smooth-transition hover:scale-110">
                        <Globe className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold">Portfolio & Website</span>
                        <p className="text-sm text-slate-600 font-normal mt-1">Online presence and portfolio links</p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-6">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Label htmlFor="portfolioUrl">Portfolio/Website URL</Label>
                        <Input
                          id="portfolioUrl"
                          type="url"
                          value={profileData.portfolioUrl}
                          onChange={(e) => setProfileData({ ...profileData, portfolioUrl: e.target.value })}
                          placeholder="https://www.yourportfolio.com"
                        />
                      </div>
                    ) : (
                      <>
                        {profileData.portfolioUrl && (
                        <div>
                          <Label className="text-sm font-medium">Portfolio/Website</Label>
                          <a
                            href={profileData.portfolioUrl}
                            className="text-sm text-primary hover:underline flex items-center"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <LinkIcon className="w-4 h-4 mr-1" />
                            {profileData.portfolioUrl}
                          </a>
                        </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Social Media Profiles */}
                <Card className="group bg-white border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden smooth-transition hover-lift animate-scale-in animate-delay-800">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 p-4 sm:p-6">
                    <CardTitle className="text-slate-900 flex items-center gap-3 text-base sm:text-lg">
                      <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm smooth-transition hover:scale-110">
                        <LinkIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold">Social Networks</span>
                        <p className="text-sm text-slate-600 font-normal mt-1">Professional social media profiles</p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-6">
                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                          <Input
                            id="linkedinUrl"
                            type="url"
                            value={profileData.linkedinUrl}
                            onChange={(e) => setProfileData({ ...profileData, linkedinUrl: e.target.value })}
                            placeholder="LinkedIn Profile URL"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="facebookUrl">Facebook Profile</Label>
                          <Input
                            id="facebookUrl"
                            type="url"
                            value={profileData.facebookUrl}
                            onChange={(e) => setProfileData({ ...profileData, facebookUrl: e.target.value })}
                            placeholder="Facebook Profile URL"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="instagramUrl">Instagram Profile</Label>
                          <Input
                            id="instagramUrl"
                            type="url"
                            value={profileData.instagramUrl}
                            onChange={(e) => setProfileData({ ...profileData, instagramUrl: e.target.value })}
                            placeholder="Instagram Profile URL"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {profileData.linkedinUrl && (
                        <div>
                          <Label className="text-sm font-medium">LinkedIn</Label>
                          <a
                            href={profileData.linkedinUrl}
                            className="text-sm text-primary hover:underline flex items-center"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <LinkIcon className="w-4 h-4 mr-1" />
                            LinkedIn Profile
                          </a>
                        </div>
                        )}
                        {profileData.facebookUrl && (
                        <div>
                          <Label className="text-sm font-medium">Facebook</Label>
                          <a
                            href={profileData.facebookUrl}
                            className="text-sm text-primary hover:underline flex items-center"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <LinkIcon className="w-4 h-4 mr-1" />
                            Facebook Profile
                          </a>
                        </div>
                        )}
                        {profileData.instagramUrl && (
                        <div>
                          <Label className="text-sm font-medium">Instagram</Label>
                          <a
                            href={profileData.instagramUrl}
                            className="text-sm text-primary hover:underline flex items-center"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <LinkIcon className="w-4 h-4 mr-1" />
                            Instagram Profile
                          </a>
                        </div>
                        )}
                        {!profileData.linkedinUrl && !profileData.facebookUrl && !profileData.instagramUrl && (
                        <p className="text-sm text-gray-500">No social media profiles added</p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Work Experience & Education */}
              {(profileData.workExperience?.length > 0 || profileData.education?.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 animate-fade-in-up animate-delay-900">
                  {/* Work Experience */}
                  {profileData.workExperience?.length > 0 && (
                    <Card className="group bg-white border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden smooth-transition hover-lift animate-scale-in animate-delay-1000">
                      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 p-4 sm:p-6">
                        <CardTitle className="text-slate-900 flex items-center gap-3 text-base sm:text-lg">
                          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm smooth-transition hover:scale-110">
                            <Briefcase className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <span className="font-semibold">Work Experience</span>
                            <p className="text-sm text-slate-600 font-normal mt-1">Professional career history</p>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 p-4 sm:p-6">
                        {profileData.workExperience.map((exp, index) => (
                          <div key={index} className="bg-white border border-gray-100 rounded-lg p-4 hover:border-gray-200 hover:shadow-sm transition-all duration-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-900">{exp.jobTitle}</h4>
                                <p className="text-slate-600 text-sm font-medium">{exp.company}</p>
                                <p className="text-slate-500 text-xs mt-1 flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate}
                                </p>
                                {exp.description && (
                                  <p className="text-slate-600 text-sm mt-2 line-clamp-2">{exp.description}</p>
                                )}
                              </div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Education */}
                  {profileData.education?.length > 0 && (
                    <Card className="group bg-white border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden smooth-transition hover-lift animate-scale-in animate-delay-1100">
                      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 p-4 sm:p-6">
                        <CardTitle className="text-slate-900 flex items-center gap-3 text-base sm:text-lg">
                          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center shadow-sm smooth-transition hover:scale-110">
                            <GraduationCap className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <span className="font-semibold">Education</span>
                            <p className="text-sm text-slate-600 font-normal mt-1">Academic qualifications and certifications</p>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 p-4 sm:p-6">
                        {profileData.education.map((edu, index) => (
                          <div key={index} className="bg-white border border-gray-100 rounded-lg p-4 hover:border-gray-200 hover:shadow-sm transition-all duration-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-900">{edu.degree}</h4>
                                <p className="text-slate-600 text-sm font-medium">{edu.institution}</p>
                                <p className="text-slate-500 text-xs mt-1 flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {edu.startDate} - {edu.isCurrent ? "Present" : edu.endDate}
                                </p>
                                {edu.description && (
                                  <p className="text-slate-600 text-sm mt-2 line-clamp-2">{edu.description}</p>
                                )}
                              </div>
                              <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {isEditing && (
                <Card className="bg-white border border-gray-100 shadow-md animate-fade-in-up animate-delay-1200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing(false)} 
                        className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 smooth-transition hover-lift"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSaveProfile} 
                        className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 smooth-transition hover-lift"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="posts">
              <Card className="bg-white border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in-up animate-delay-300">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center smooth-transition hover:scale-110">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-slate-900">My Posts</CardTitle>
                      <p className="text-sm text-slate-600">All your forum posts and contributions</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium mb-2">No posts yet</p>
                    <p className="text-gray-400 text-sm mb-6">Start sharing your thoughts with the community</p>
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                      Create Your First Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card className="bg-white border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100 p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-slate-900">Account Settings</CardTitle>
                      <p className="text-sm text-slate-600">Manage your profile and account preferences</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link href="/profile/edit">
                      <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:bg-slate-50 hover:border-slate-200">
                        <User className="w-5 h-5" />
                        <span className="text-sm">Edit Profile</span>
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:bg-slate-50 hover:border-slate-200" 
                            onClick={() => window.location.href = '/profile/edit?tab=account'}>
                      <Settings className="w-5 h-5" />
                      <span className="text-sm">Account Settings</span>
                    </Button>
                    <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:bg-slate-50 hover:border-slate-200"
                            onClick={() => window.location.href = '/profile/edit?tab=connected'}>
                      <LinkIcon className="w-5 h-5" />
                      <span className="text-sm">Connected Accounts</span>
                    </Button>
                    <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:bg-slate-50 hover:border-slate-200"
                            onClick={() => window.location.href = '/profile/edit?tab=privacy'}>
                      <Shield className="w-5 h-5" />
                      <span className="text-sm">Privacy & Security</span>
                    </Button>
                    <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:bg-slate-50 hover:border-slate-200"
                            onClick={() => window.location.href = '/profile/edit?tab=professional'}>
                      <Briefcase className="w-5 h-5" />
                      <span className="text-sm">Professional Info</span>
                    </Button>
                    <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:bg-slate-50 hover:border-slate-200"
                            onClick={() => window.location.href = '/profile/edit?tab=experience'}>
                      <GraduationCap className="w-5 h-5" />
                      <span className="text-sm">Experience & Education</span>
                    </Button>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-md font-medium mb-4 text-slate-900">Quick Actions</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button variant="ghost" className="w-full justify-start" 
                              onClick={() => window.location.href = '/profile/edit?tab=personal'}>
                        <Camera className="w-4 h-4 mr-2" />
                        Change Profile Picture
                      </Button>
                      <Button variant="ghost" className="w-full justify-start"
                              onClick={() => {
                                navigator.clipboard.writeText(window.location.origin + `/profile/${user?.id}`)
                                // Add toast notification here if available
                              }}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <ActivityFeed 
                userId={user?.id || ""} 
                userName={user?.name || ""}
                isOwnProfile={true}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </AuthGuard>
  )
}
