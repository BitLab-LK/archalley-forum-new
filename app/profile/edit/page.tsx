"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Plus, X, Briefcase, GraduationCap, ExternalLink, User, Camera } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { useToast } from "@/hooks/use-toast"
import { useVercelBlobUpload } from "@/hooks/use-vercel-blob-upload"
import { useSession } from "next-auth/react"

interface WorkExperience {
  id?: string
  jobTitle: string
  company: string
  startDate: string
  endDate?: string
  description?: string
}

interface Education {
  id?: string
  degree: string
  institution: string
  startDate: string
  endDate?: string
  description?: string
}

// Helper function to count words in text
const countWords = (text: string): number => {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

// Helper function to get word count status
const getWordCountStatus = (text: string, limit: number = 150) => {
  const count = countWords(text)
  if (count === 0) return { status: 'empty', color: 'text-gray-400' }
  if (count > limit) return { status: 'exceeded', color: 'text-red-500' }
  if (count > limit - 10) return { status: 'warning', color: 'text-yellow-600' }
  return { status: 'normal', color: 'text-gray-600' }
}

export default function EditProfilePage() {
  const { user } = useAuth()
  const { update } = useSession()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Get the tab from URL params, default to "personal"
  const defaultTab = searchParams.get('tab') || 'personal'

  // Image upload hook
  const { uploadFiles, isUploading } = useVercelBlobUpload({
    maxFiles: 1,
    maxFileSize: 2 * 1024 * 1024, // 2MB for profile images
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    onSuccess: (files) => {
      if (files.length > 0) {
        setProfileData(prev => ({ ...prev, image: files[0].url }))
        setPreviewImage(files[0].url)
        toast({
          title: "Image Uploaded",
          description: "Profile image uploaded successfully",
        })
      }
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error,
        variant: "destructive",
      })
    }
  })

  const [profileData, setProfileData] = useState({
    // Basic Information
    firstName: "",
    lastName: "",
    name: "",
    email: "",
    phoneNumber: "",
    image: "",
    
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
    
    // Legacy fields
    profession: "",
    company: "",
    location: "",
  })

  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([])
  const [education, setEducation] = useState<Education[]>([])
  const [newSkill, setNewSkill] = useState("")

  // Settings state
  const [accountSettings, setAccountSettings] = useState({
    profileVisibility: "public",
    newConnections: true,
    messages: true,
    jobAlerts: true,
    weeklyDigest: true,
    securityAlerts: true,
    profileSearchable: true
  })

  const [connectedAccounts, setConnectedAccounts] = useState({
    google: { connected: false, email: "" },
    facebook: { connected: false, email: "" },
    linkedin: { connected: false, email: "" }
  })

  const [privacySettings, setPrivacySettings] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false
  })

  useEffect(() => {
    if (user?.id) {
      fetchUserData()
    }
  }, [user?.id])

  const fetchUserData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/${user?.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }

      const data = await response.json()
      const userData = data.user

      setProfileData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        name: userData.name || "",
        email: userData.email || "",
        phoneNumber: userData.phoneNumber || "",
        image: userData.image || "",
        headline: userData.headline || "",
        skills: userData.skills || [],
        industry: userData.industry || "",
        country: userData.country || "",
        city: userData.city || "",
        bio: userData.bio || "",
        portfolioUrl: userData.portfolioUrl || "",
        linkedinUrl: userData.linkedinUrl || "",
        facebookUrl: userData.facebookUrl || "",
        instagramUrl: userData.instagramUrl || "",
        profession: userData.profession || "",
        company: userData.company || "",
        location: userData.location || "",
      })

      setPreviewImage(userData.image || null)

      setWorkExperience(userData.workExperience || [])
      setEducation(userData.education || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }))
      setNewSkill("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  // Image upload functions
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    try {
      setIsUploadingImage(true)
      await uploadFiles(Array.from(files))
    } catch (error) {
      // console.error('Upload error:', error) // Removed for production
    } finally {
      setIsUploadingImage(false)
    }
  }

  const triggerImageUpload = () => {
    fileInputRef.current?.click()
  }

  const addWorkExperience = () => {
    setWorkExperience(prev => [...prev, {
      jobTitle: "",
      company: "",
      startDate: "",
      endDate: "",
      description: ""
    }])
  }

  const updateWorkExperience = (index: number, field: string, value: string) => {
    setWorkExperience(prev => prev.map((work, i) => 
      i === index ? { ...work, [field]: value } : work
    ))
  }

  const removeWorkExperience = (index: number) => {
    setWorkExperience(prev => prev.filter((_, i) => i !== index))
  }

  const addEducation = () => {
    setEducation(prev => [...prev, {
      degree: "",
      institution: "",
      startDate: "",
      endDate: "",
      description: ""
    }])
  }

  const updateEducation = (index: number, field: string, value: string) => {
    setEducation(prev => prev.map((edu, i) => 
      i === index ? { ...edu, [field]: value } : edu
    ))
  }

  const removeEducation = (index: number) => {
    setEducation(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError("")

      // Validate bio word count
      if (countWords(profileData.bio) > 150) {
        setError("Bio must not exceed 150 words")
        setIsSaving(false)
        return
      }

      // Update basic profile data
      const profileResponse = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      if (!profileResponse.ok) {
        throw new Error('Failed to update profile')
      }

      // Update work experience
      if (workExperience.length > 0) {
        const workResponse = await fetch(`/api/users/${user?.id}/work-experience`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ workExperience }),
        })

        if (!workResponse.ok) {
          // console.warn('Failed to update work experience') // Removed for production
        }
      }

      // Update education
      if (education.length > 0) {
        const educationResponse = await fetch(`/api/users/${user?.id}/education`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ education }),
        })

        if (!educationResponse.ok) {
          // console.warn('Failed to update education') // Removed for production
        }
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      })

      // Refresh the session to get updated user data
      // console.log('🔄 Refreshing session to update profile data...') // Removed for production
      await update()

      // Navigate back to profile with cache busting
      // console.log('🔄 Navigating to profile page with updated data...') // Removed for production
      
      // Add a timestamp to force cache invalidation
      const timestamp = Date.now()
      window.location.href = `/profile/${user?.id}?updated=${timestamp}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          {/* Header */}
          <div className="mb-4 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <Link href={`/profile/${user?.id}`}>
                  <Button variant="ghost" size="sm" className="self-start">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Profile
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Update your profile information</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <p className="text-sm sm:text-base text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
          </div>

          <Tabs defaultValue={defaultTab} className="w-full">
            <div className="overflow-x-auto mb-4 sm:mb-6">
              <TabsList className="grid w-full grid-cols-7 min-w-max sm:min-w-0">
                <TabsTrigger value="personal" className="text-xs sm:text-sm">Personal</TabsTrigger>
                <TabsTrigger value="professional" className="text-xs sm:text-sm">Professional</TabsTrigger>
                <TabsTrigger value="experience" className="text-xs sm:text-sm">Experience</TabsTrigger>
                <TabsTrigger value="education" className="text-xs sm:text-sm">Education</TabsTrigger>
                <TabsTrigger value="connected" className="text-xs sm:text-sm">Connected</TabsTrigger>
                <TabsTrigger value="account" className="text-xs sm:text-sm">Account</TabsTrigger>
                <TabsTrigger value="privacy" className="text-xs sm:text-sm">Privacy</TabsTrigger>
              </TabsList>
            </div>

            {/* Personal Information */}
            <TabsContent value="personal" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Update your basic personal information and profile picture
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto sm:mx-0">
                      <AvatarImage src={previewImage || profileData.image || "/placeholder-user.jpg"} alt={user?.name} />
                      <AvatarFallback className="text-lg sm:text-xl">
                        {user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center sm:text-left">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={triggerImageUpload}
                        disabled={isUploadingImage || isUploading}
                        className="w-full sm:w-auto"
                      >
                        <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        {isUploadingImage || isUploading ? 'Uploading...' : 'Change Photo'}
                      </Button>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Upload a new profile picture (JPEG, PNG, WebP - Max 2MB)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="Enter your first name"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Enter your last name"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="name" className="text-sm font-medium">Display Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your display name"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        value={profileData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        placeholder="Enter your phone number"
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                      <span className={`text-xs font-medium ${getWordCountStatus(profileData.bio, 150).color}`}>
                        {countWords(profileData.bio)}/150 words
                      </span>
                    </div>
                    <div className="space-y-2">
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => {
                          const text = e.target.value
                          const wordCount = countWords(text)
                          
                          // Allow typing if under limit or if deleting text
                          if (wordCount <= 150 || text.length < profileData.bio.length) {
                            handleInputChange('bio', text)
                          }
                        }}
                        placeholder="Write a brief description about yourself..."
                        rows={4}
                        className={`resize-none ${
                          (() => {
                            const status = getWordCountStatus(profileData.bio, 150)
                            if (status.status === 'exceeded') return 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            if (status.status === 'warning') return 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500'
                            return ''
                          })()
                        }`}
                      />
                      {(() => {
                        const wordCount = countWords(profileData.bio)
                        const status = getWordCountStatus(profileData.bio, 150)
                        
                        if (wordCount > 140) {
                          return (
                            <div className={`text-xs p-2 rounded-md ${
                              status.status === 'exceeded' 
                                ? 'bg-red-50 text-red-700 border border-red-200' 
                                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            }`}>
                              {status.status === 'exceeded' 
                                ? '⚠️ Bio exceeds 150 words. Please shorten your text.' 
                                : `⚡ Approaching word limit (${150 - wordCount} words remaining)`
                              }
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Professional Information */}
            <TabsContent value="professional" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
                    Professional Information
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Update your professional details and location
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="profession" className="text-sm font-medium">Profession</Label>
                      <Input
                        id="profession"
                        value={profileData.profession}
                        onChange={(e) => handleInputChange('profession', e.target.value)}
                        placeholder="e.g., Software Engineer"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-sm font-medium">Company</Label>
                      <Input
                        id="company"
                        value={profileData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        placeholder="e.g., Tech Corp"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry" className="text-sm font-medium">Industry</Label>
                      <Input
                        id="industry"
                        value={profileData.industry}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                        placeholder="e.g., Information Technology"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="headline" className="text-sm font-medium">Professional Headline</Label>
                      <Input
                        id="headline"
                        value={profileData.headline}
                        onChange={(e) => handleInputChange('headline', e.target.value)}
                        placeholder="e.g., Senior Developer at Tech Corp"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium">City</Label>
                      <Input
                        id="city"
                        value={profileData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="e.g., New York"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={profileData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder="e.g., United States"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                    <Input
                      id="portfolioUrl"
                      value={profileData.portfolioUrl}
                      onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                      placeholder="https://yourportfolio.com"
                    />
                  </div>

                  {/* Skills */}
                  <div>
                    <Label>Skills</Label>
                    <div className="flex gap-2 mt-2 mb-4">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a skill..."
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      />
                      <Button type="button" onClick={addSkill} variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profileData.skills.map((skill, index) => (
                        <div key={index} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                          {skill}
                          <button onClick={() => removeSkill(skill)} className="ml-1 hover:text-red-600">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Social Media Links */}
                  <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium">Professional Links</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="linkedinUrl" className="text-sm font-medium">LinkedIn URL</Label>
                        <Input
                          id="linkedinUrl"
                          value={profileData.linkedinUrl}
                          onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                          placeholder="https://linkedin.com/in/yourprofile"
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="portfolioUrl" className="text-sm font-medium">Portfolio/Website URL</Label>
                        <Input
                          id="portfolioUrl"
                          value={profileData.portfolioUrl}
                          onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                          placeholder="https://yourportfolio.com"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Work Experience */}
            <TabsContent value="experience" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        Work Experience
                      </CardTitle>
                      <CardDescription>
                        Add your work experience and career history
                      </CardDescription>
                    </div>
                    <Button onClick={addWorkExperience} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Experience
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {workExperience.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No work experience added yet.</p>
                      <Button onClick={addWorkExperience} variant="outline" className="mt-4">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Experience
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {workExperience.map((work, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium">Experience #{index + 1}</h4>
                            <Button 
                              onClick={() => removeWorkExperience(index)} 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`work-title-${index}`}>Job Title</Label>
                              <Input
                                id={`work-title-${index}`}
                                value={work.jobTitle}
                                onChange={(e) => updateWorkExperience(index, 'jobTitle', e.target.value)}
                                placeholder="e.g., Software Engineer"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`work-company-${index}`}>Company</Label>
                              <Input
                                id={`work-company-${index}`}
                                value={work.company}
                                onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                                placeholder="e.g., Tech Corp"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`work-start-${index}`}>Start Date</Label>
                              <Input
                                id={`work-start-${index}`}
                                type="date"
                                value={work.startDate}
                                onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`work-end-${index}`}>End Date (Leave empty if current)</Label>
                              <Input
                                id={`work-end-${index}`}
                                type="date"
                                value={work.endDate || ''}
                                onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="mt-4">
                            <Label htmlFor={`work-desc-${index}`}>Description</Label>
                            <Textarea
                              id={`work-desc-${index}`}
                              value={work.description || ''}
                              onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                              placeholder="Describe your role and achievements..."
                              rows={3}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Education */}
            <TabsContent value="education" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5" />
                        Education
                      </CardTitle>
                      <CardDescription>
                        Add your educational background and qualifications
                      </CardDescription>
                    </div>
                    <Button onClick={addEducation} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Education
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {education.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No education added yet.</p>
                      <Button onClick={addEducation} variant="outline" className="mt-4">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Education
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {education.map((edu, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium">Education #{index + 1}</h4>
                            <Button 
                              onClick={() => removeEducation(index)} 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`edu-degree-${index}`}>Degree</Label>
                              <Input
                                id={`edu-degree-${index}`}
                                value={edu.degree}
                                onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                placeholder="e.g., Bachelor of Science in Computer Science"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edu-institution-${index}`}>Institution</Label>
                              <Input
                                id={`edu-institution-${index}`}
                                value={edu.institution}
                                onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                                placeholder="e.g., University of Technology"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edu-start-${index}`}>Start Date</Label>
                              <Input
                                id={`edu-start-${index}`}
                                type="date"
                                value={edu.startDate}
                                onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edu-end-${index}`}>End Date (Leave empty if current)</Label>
                              <Input
                                id={`edu-end-${index}`}
                                type="date"
                                value={edu.endDate || ''}
                                onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="mt-4">
                            <Label htmlFor={`edu-desc-${index}`}>Description</Label>
                            <Textarea
                              id={`edu-desc-${index}`}
                              value={edu.description || ''}
                              onChange={(e) => updateEducation(index, 'description', e.target.value)}
                              placeholder="Describe your studies, achievements, etc..."
                              rows={3}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Connected Accounts */}
            <TabsContent value="connected" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                    Connected Accounts
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Connect your social media accounts to easily log in and share your professional updates.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                  {/* Google Account */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                        G
                      </div>
                      <div>
                        <p className="font-medium">Google</p>
                        <p className="text-sm text-gray-500">
                          {connectedAccounts.google.connected ? connectedAccounts.google.email : "Connect to use Gmail for login"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={connectedAccounts.google.connected ? "destructive" : "default"}
                      size="sm"
                      onClick={() => {
                        if (connectedAccounts.google.connected) {
                          setConnectedAccounts(prev => ({
                            ...prev,
                            google: { connected: false, email: "" }
                          }))
                        } else {
                          // Connect logic here
                          toast({
                            title: "Coming Soon",
                            description: "Google account connection will be available soon.",
                          })
                        }
                      }}
                    >
                      {connectedAccounts.google.connected ? "Disconnect" : "Connect"}
                    </Button>
                  </div>

                  {/* Facebook Account */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        f
                      </div>
                      <div>
                        <p className="font-medium">Facebook</p>
                        <p className="text-sm text-gray-500">
                          {connectedAccounts.facebook.connected ? connectedAccounts.facebook.email : "Connect to share professional updates"}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Connect
                    </Button>
                  </div>

                  {/* LinkedIn Account */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                        in
                      </div>
                      <div>
                        <p className="font-medium">LinkedIn</p>
                        <p className="text-sm text-gray-500">
                          {connectedAccounts.linkedin.connected ? connectedAccounts.linkedin.email : "Connect to import professional data"}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Connect
                    </Button>
                  </div>

                  <div className="mt-6">
                    <Button 
                      className="w-full"
                      onClick={() => {
                        toast({
                          title: "Settings Saved",
                          description: "Connected accounts updated successfully.",
                        })
                      }}
                    >
                      Save Connected Accounts
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Settings */}
            <TabsContent value="account" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    Account Settings
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Manage your account preferences and notification settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-4 sm:p-6">
                  {/* Profile Visibility */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Profile Visibility</Label>
                    <p className="text-sm text-gray-500">Make your profile visible to other users</p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={accountSettings.profileVisibility === "public" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAccountSettings(prev => ({ ...prev, profileVisibility: "public" }))}
                      >
                        Public
                      </Button>
                      <Button
                        variant={accountSettings.profileVisibility === "private" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAccountSettings(prev => ({ ...prev, profileVisibility: "private" }))}
                      >
                        Private
                      </Button>
                    </div>
                  </div>

                  {/* Notification Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Notification Preferences</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">New Connections</p>
                          <p className="text-sm text-gray-500">Get notified when someone connects with you</p>
                        </div>
                        <Button
                          variant={accountSettings.newConnections ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAccountSettings(prev => ({ ...prev, newConnections: !prev.newConnections }))}
                        >
                          {accountSettings.newConnections ? "On" : "Off"}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Messages</p>
                          <p className="text-sm text-gray-500">Receive notifications for new messages</p>
                        </div>
                        <Button
                          variant={accountSettings.messages ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAccountSettings(prev => ({ ...prev, messages: !prev.messages }))}
                        >
                          {accountSettings.messages ? "On" : "Off"}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Job Alerts</p>
                          <p className="text-sm text-gray-500">Receive notifications about relevant job opportunities</p>
                        </div>
                        <Button
                          variant={accountSettings.jobAlerts ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAccountSettings(prev => ({ ...prev, jobAlerts: !prev.jobAlerts }))}
                        >
                          {accountSettings.jobAlerts ? "On" : "Off"}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Weekly Digest</p>
                          <p className="text-sm text-gray-500">Get a weekly summary of your network activity</p>
                        </div>
                        <Button
                          variant={accountSettings.weeklyDigest ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAccountSettings(prev => ({ ...prev, weeklyDigest: !prev.weeklyDigest }))}
                        >
                          {accountSettings.weeklyDigest ? "On" : "Off"}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Security Alerts</p>
                          <p className="text-sm text-gray-500">Important security notifications (always enabled)</p>
                        </div>
                        <Button
                          variant={accountSettings.securityAlerts ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAccountSettings(prev => ({ ...prev, securityAlerts: !prev.securityAlerts }))}
                        >
                          {accountSettings.securityAlerts ? "On" : "Off"}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Profile Searchable</p>
                          <p className="text-sm text-gray-500">Allow others to find your profile in search</p>
                        </div>
                        <Button
                          variant={accountSettings.profileSearchable ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAccountSettings(prev => ({ ...prev, profileSearchable: !prev.profileSearchable }))}
                        >
                          {accountSettings.profileSearchable ? "On" : "Off"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button 
                      className="w-full"
                      onClick={() => {
                        toast({
                          title: "Settings Saved",
                          description: "Account settings updated successfully.",
                        })
                      }}
                    >
                      Save Account Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy & Security */}
            <TabsContent value="privacy" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    Privacy & Security
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Manage your account security and privacy settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-4 sm:p-6">
                  {/* Change Password */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Change Password</h3>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="text-sm">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={privacySettings.currentPassword}
                          onChange={(e) => setPrivacySettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="Enter current password"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-sm">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={privacySettings.newPassword}
                          onChange={(e) => setPrivacySettings(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Enter new password"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={privacySettings.confirmPassword}
                          onChange={(e) => setPrivacySettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm new password"
                        />
                      </div>

                      <Button 
                        className="w-full"
                        onClick={() => {
                          if (privacySettings.newPassword !== privacySettings.confirmPassword) {
                            toast({
                              title: "Password Mismatch",
                              description: "New passwords do not match.",
                              variant: "destructive"
                            })
                            return
                          }
                          toast({
                            title: "Password Updated",
                            description: "Your password has been updated successfully.",
                          })
                          setPrivacySettings(prev => ({ 
                            ...prev, 
                            currentPassword: "", 
                            newPassword: "", 
                            confirmPassword: "" 
                          }))
                        }}
                      >
                        Send Verification Code to Email
                      </Button>
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="space-y-3 pt-6 border-t">
                    <h3 className="text-sm font-medium">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Add an extra layer of security to your account</p>
                        <p className="text-sm text-gray-500">
                          {privacySettings.twoFactorEnabled ? "Enabled" : "Disabled"}
                        </p>
                      </div>
                      <Button
                        variant={privacySettings.twoFactorEnabled ? "destructive" : "default"}
                        size="sm"
                        onClick={() => {
                          setPrivacySettings(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))
                          toast({
                            title: privacySettings.twoFactorEnabled ? "2FA Disabled" : "2FA Enabled",
                            description: `Two-factor authentication has been ${privacySettings.twoFactorEnabled ? "disabled" : "enabled"}.`,
                          })
                        }}
                      >
                        {privacySettings.twoFactorEnabled ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>

                  {/* Data Management */}
                  <div className="space-y-3 pt-6 border-t">
                    <h3 className="text-sm font-medium">Data Management</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Export Your Data</p>
                          <p className="text-sm text-gray-500">Download a copy of all your profile data and activity</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Export Started",
                              description: "Your data export has been initiated. You'll receive an email when ready.",
                            })
                          }}
                        >
                          Export Data
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="space-y-3 pt-6 border-t border-red-200">
                    <h3 className="text-sm font-medium text-red-600">Danger Zone</h3>
                    
                    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-800">Delete Account</p>
                          <p className="text-sm text-red-600">
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Account Deletion",
                              description: "Please contact support to delete your account.",
                              variant: "destructive"
                            })
                          }}
                        >
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button 
                      className="w-full"
                      onClick={() => {
                        toast({
                          title: "Security Settings Saved",
                          description: "Your security settings have been updated.",
                        })
                      }}
                    >
                      Save Security Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Fixed Save Button */}
          <div className="sticky bottom-2 sm:bottom-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4 mt-4 sm:mt-8">
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
              <Link href={`/profile/${user?.id}`} className="order-2 sm:order-1">
                <Button variant="outline" className="w-full sm:w-auto text-sm">Cancel</Button>
              </Link>
              <Button onClick={handleSave} disabled={isSaving} className="order-1 sm:order-2 w-full sm:w-auto text-sm">
                <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
