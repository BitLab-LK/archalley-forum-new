"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Facebook, 
  Mail, 
  AlertCircle, 
  Loader2, 
  CheckCircle, 
  Plus,
  Minus,
  Upload,
  Linkedin
} from "lucide-react"

interface WorkExperience {
  id: string
  jobTitle: string
  company: string
  startDate: string
  endDate: string
  isCurrent: boolean
  description: string
}

interface Education {
  id: string
  degree: string
  institution: string
  startDate: string
  endDate: string
  isCurrent: boolean
  description: string
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

export default function SimplifiedEnhancedRegisterPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("register")
  const [createMemberProfile, setCreateMemberProfile] = useState(false)

  // Set active tab based on URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'login' || tab === 'register') {
      setActiveTab(tab)
    }
  }, [searchParams])
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  
  // Basic Information
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  
  // Professional Profile
  const [headline, setHeadline] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState("")
  const [industry, setIndustry] = useState("")
  const [country, setCountry] = useState("")
  const [city, setCity] = useState("")
  const [bio, setBio] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([])
  const [portfolioLinkInput, setPortfolioLinkInput] = useState("")
  
  // Social Media
  const [socialMediaLinks, setSocialMediaLinks] = useState<{platform: string, url: string}[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState("")
  const [socialMediaUrl, setSocialMediaUrl] = useState("")
  
  // Work Experience
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([
    {
      id: "1",
      jobTitle: "",
      company: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
    }
  ])
  
  // Education
  const [education, setEducation] = useState<Education[]>([
    {
      id: "1",
      degree: "",
      institution: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
    }
  ])
  
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const industries = [
    "Architecture",
    "Interior Design", 
    "Urban Planning",
    "Construction Management",
    "Civil Engineering",
    "Structural Engineering",
    "Landscape Architecture",
    "Project Management",
    "Real Estate Development",
    "Building Information Modeling (BIM)",
    "Sustainable Design",
    "Heritage Conservation",
    "Other"
  ]

  const countries = [
    "United States", "Canada", "United Kingdom", "Australia", "Germany", 
    "France", "Netherlands", "Spain", "Italy", "Singapore", "UAE", 
    "India", "China", "Japan", "South Korea", "Other"
  ]

  const socialMediaPlatforms = [
    "LinkedIn",
    "Facebook", 
    "Instagram",
    "Twitter/X",
    "YouTube",
    "TikTok",
    "Behance",
    "Dribbble",
    "GitHub",
    "Other"
  ]

  const addSkill = () => {
    if (skillInput.trim()) {
      // Split by comma and process each skill
      const newSkills = skillInput
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill && !skills.includes(skill)) // Remove empty and duplicate skills
      
      if (newSkills.length > 0) {
        setSkills([...skills, ...newSkills])
        setSkillInput("")
      }
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove))
  }

  const addPortfolioLink = () => {
    if (portfolioLinkInput.trim() && !portfolioLinks.includes(portfolioLinkInput.trim())) {
      setPortfolioLinks([...portfolioLinks, portfolioLinkInput.trim()])
      setPortfolioLinkInput("")
    }
  }

  const removePortfolioLink = (linkToRemove: string) => {
    setPortfolioLinks(portfolioLinks.filter(link => link !== linkToRemove))
  }

  const addSocialMediaLink = () => {
    if (selectedPlatform && socialMediaUrl.trim()) {
      // Check if platform already exists
      const existingIndex = socialMediaLinks.findIndex(link => link.platform === selectedPlatform)
      
      if (existingIndex >= 0) {
        // Update existing platform URL
        const updatedLinks = [...socialMediaLinks]
        updatedLinks[existingIndex].url = socialMediaUrl.trim()
        setSocialMediaLinks(updatedLinks)
      } else {
        // Add new platform
        setSocialMediaLinks([...socialMediaLinks, { platform: selectedPlatform, url: socialMediaUrl.trim() }])
      }
      
      setSelectedPlatform("")
      setSocialMediaUrl("")
    }
  }

  const removeSocialMediaLink = (platform: string) => {
    setSocialMediaLinks(socialMediaLinks.filter(link => link.platform !== platform))
  }

  const addWorkExperience = () => {
    const newExp: WorkExperience = {
      id: Date.now().toString(),
      jobTitle: "",
      company: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
    }
    setWorkExperience([...workExperience, newExp])
  }

  const removeWorkExperience = (id: string) => {
    if (workExperience.length > 1) {
      setWorkExperience(workExperience.filter(exp => exp.id !== id))
    }
  }

  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: any) => {
    console.log('Updating work experience:', id, field, value)
    setWorkExperience(prev => prev.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ))
  }

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      degree: "",
      institution: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
    }
    setEducation([...education, newEdu])
  }

  const removeEducation = (id: string) => {
    if (education.length > 1) {
      setEducation(education.filter(edu => edu.id !== id))
    }
  }

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    console.log('Updating education:', id, field, value)
    setEducation(prev => prev.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    if (!agreeToTerms) {
      setError("You must agree to the terms and conditions")
      setIsLoading(false)
      return
    }

    // Validate bio word count if creating member profile
    if (createMemberProfile && countWords(bio) > 150) {
      setError("About/Summary section must not exceed 150 words")
      setIsLoading(false)
      return
    }

    try {
      let profileImageUrl = ""

      // Upload profile photo first if provided
      if (profilePhoto) {
        try {
          setIsUploadingPhoto(true)
          const uploadFormData = new FormData()
          uploadFormData.append('images', profilePhoto)
          
          const uploadResponse = await fetch('/api/upload/registration', {
            method: 'POST',
            body: uploadFormData,
          })
          
          const uploadData = await uploadResponse.json()
          
          if (uploadResponse.ok && uploadData.images && uploadData.images.length > 0) {
            profileImageUrl = uploadData.images[0].url
            console.log('📸 Profile photo uploaded successfully:', profileImageUrl)
          } else {
            console.warn('⚠️ Profile photo upload failed:', uploadData.error)
            // Continue with registration even if photo upload fails
          }
        } catch (uploadError) {
          console.warn('⚠️ Profile photo upload error:', uploadError)
          // Continue with registration even if photo upload fails
        } finally {
          setIsUploadingPhoto(false)
        }
      }

      const formData = {
        firstName,
        lastName,
        email,
        phoneNumber,
        password,
        headline,
        skills,
        industry,
        country,
        city,
        bio,
        websiteUrl,
        portfolioLinks,
        socialMediaLinks,
        profileImageUrl, // Add the uploaded image URL
        workExperience: workExperience.filter(exp => exp.jobTitle && exp.company),
        education: education.filter(edu => edu.degree && edu.institution),
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      setSuccess(true)

      // Auto-login after successful registration
      setTimeout(async () => {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.ok) {
          router.push("/")
          router.refresh()
        }
      }, 2000)
    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true)
    try {
      await signIn(provider, { callbackUrl: "/" })
    } catch (error) {
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else if (result?.ok) {
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h2 className="text-2xl font-bold">Account Created!</h2>
              <p className="text-muted-foreground">
                Your professional profile has been created successfully. You're being signed in...
              </p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#ffa500' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center" style={{ color: '#ffa500' }}>
            {activeTab === "login" ? "Archalley Forum" : "Join Archalley Forum"}
          </CardTitle>
          <CardDescription className="text-center">
            Professional Networking for Construction & Related Industries
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-6">
              {/* Social Login */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  onClick={() => handleSocialLogin("google")}
                  disabled={isLoading}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Login with Google
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  onClick={() => handleSocialLogin("facebook")}
                  disabled={isLoading}
                >
                  <Facebook className="mr-2 h-4 w-4" />
                  Login with Facebook
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  onClick={() => handleSocialLogin("linkedin")}
                  disabled={isLoading}
                >
                  <Linkedin className="mr-2 h-4 w-4" />
                  Login with LinkedIn
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">OR</span>
                </div>
              </div>

              {/* Email Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginEmail">Email Address</Label>
                  <Input
                    id="loginEmail"
                    type="email"
                    placeholder="m@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="loginPassword">Password</Label>
                    <Button variant="link" className="px-0 font-normal text-sm h-auto" asChild>
                      <Link href="/auth/forgot-password">Forgot Password?</Link>
                    </Button>
                  </div>
                  <Input
                    id="loginPassword"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                  style={{ backgroundColor: '#ffa500', borderColor: '#ffa500' }}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Social Registration */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  onClick={() => handleSocialLogin("google")}
                  disabled={isLoading}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Register with Google
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  onClick={() => handleSocialLogin("facebook")}
                  disabled={isLoading}
                >
                  <Facebook className="mr-2 h-4 w-4" />
                  Register with Facebook
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  onClick={() => handleSocialLogin("linkedin")}
                  disabled={isLoading}
                >
                  <Linkedin className="mr-2 h-4 w-4" />
                  Register with LinkedIn
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">OR</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Registration Form Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="Enter your first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Enter your last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="+1 (555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profilePhoto">Profile Photo</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="profilePhoto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
                      disabled={isLoading}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('profilePhoto')?.click()}
                      disabled={isLoading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {profilePhoto ? profilePhoto.name : "No file chosen"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="createMemberProfile"
                      checked={createMemberProfile}
                      onCheckedChange={(checked) => setCreateMemberProfile(checked === true)}
                      disabled={isLoading}
                    />
                    <Label htmlFor="createMemberProfile" className="text-sm text-muted-foreground">
                      Create a Member Profile: This will create a public professional profile so other
                      members can learn more about you, based on your skills, work
                      history, education, and contact details.
                    </Label>
                  </div>
                </div>

                {/* Professional Profile - Only show if createMemberProfile is checked */}
                {createMemberProfile && (
                  <div className="space-y-4 animate-in slide-in-from-top-5 duration-300">
                    <h3 className="text-lg font-semibold">Professional Profile</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="headline">Headline</Label>
                      <Input
                        id="headline"
                        placeholder="e.g., Civil Engineer at XYZ Constructions"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="skills">Skills (comma-separated)</Label>
                      <Input
                        id="skills"
                        placeholder="e.g., BIM, Project Management, AutoCAD, Civil Engineering"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addSkill()
                          }
                        }}
                        disabled={isLoading}
                      />
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                              {skill} ×
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="bio">About/Summary</Label>
                        <span className={`text-xs font-medium ${getWordCountStatus(bio, 150).color}`}>
                          {countWords(bio)}/150 words
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Textarea
                          id="bio"
                          placeholder="Tell us about yourself..."
                          value={bio}
                          onChange={(e) => {
                            const text = e.target.value
                            const wordCount = countWords(text)
                            
                            // Allow typing if under limit or if deleting text
                            if (wordCount <= 150 || text.length < bio.length) {
                              setBio(text)
                            }
                          }}
                          rows={4}
                          disabled={isLoading}
                          className={`resize-none ${
                            (() => {
                              const status = getWordCountStatus(bio, 150)
                              if (status.status === 'exceeded') return 'border-red-300 focus:border-red-500 focus:ring-red-500'
                              if (status.status === 'warning') return 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500'
                              return ''
                            })()
                          }`}
                        />
                        {(() => {
                          const wordCount = countWords(bio)
                          const status = getWordCountStatus(bio, 150)
                          
                          if (wordCount > 140) {
                            return (
                              <div className={`text-xs p-2 rounded-md ${
                                status.status === 'exceeded' 
                                  ? 'bg-red-50 text-red-700 border border-red-200' 
                                  : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                              }`}>
                                {status.status === 'exceeded' 
                                  ? '⚠️ Summary exceeds 150 words. Please shorten your text.' 
                                  : `⚡ Approaching word limit (${150 - wordCount} words remaining)`
                                }
                              </div>
                            )
                          }
                          return null
                        })()}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry/Field of Work</Label>
                      <Select value={industry} onValueChange={setIndustry} disabled={isLoading}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((ind) => (
                            <SelectItem key={ind} value={ind}>
                              {ind}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Select value={country} onValueChange={setCountry} disabled={isLoading}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((ctry) => (
                              <SelectItem key={ctry} value={ctry}>
                                {ctry}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          placeholder="e.g., London"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Portfolio/Website Links - Only show if createMemberProfile is checked */}
                {createMemberProfile && (
                  <div className="space-y-4 animate-in slide-in-from-top-5 duration-300">
                    <h3 className="text-lg font-semibold">Portfolio/Website Links</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="websiteUrl">Personal/Company Website</Label>
                      <Input
                        id="websiteUrl"
                        type="url"
                        placeholder="https://www.yourcompany.com"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="portfolioLinkInput">Portfolio Links</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={addPortfolioLink}
                          disabled={isLoading || !portfolioLinkInput.trim()}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      <Input
                        id="portfolioLinkInput"
                        type="url"
                        placeholder="https://www.behance.net/yourprofile or project links"
                        value={portfolioLinkInput}
                        onChange={(e) => setPortfolioLinkInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addPortfolioLink()
                          }
                        }}
                        disabled={isLoading}
                      />
                      {portfolioLinks.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Added Portfolio & Project Links:</Label>
                          <div className="space-y-1">
                            {portfolioLinks.map((link, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <span className="text-sm truncate mr-2">{link}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removePortfolioLink(link)}
                                  disabled={isLoading}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Social Media Profiles - Only show if createMemberProfile is checked */}
                {createMemberProfile && (
                  <div className="space-y-4 animate-in slide-in-from-top-5 duration-300">
                    <h3 className="text-lg font-semibold">Social Media Profiles</h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Add Social Media Profile</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={addSocialMediaLink}
                          disabled={isLoading || !selectedPlatform || !socialMediaUrl.trim()}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={selectedPlatform} onValueChange={setSelectedPlatform} disabled={isLoading}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            {socialMediaPlatforms.map((platform) => (
                              <SelectItem key={platform} value={platform}>
                                {platform}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Input
                          type="url"
                          placeholder="https://platform.com/yourprofile"
                          value={socialMediaUrl}
                          onChange={(e) => setSocialMediaUrl(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addSocialMediaLink()
                            }
                          }}
                          disabled={isLoading || !selectedPlatform}
                        />
                      </div>

                      {socialMediaLinks.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Added Social Media Profiles:</Label>
                          <div className="space-y-1">
                            {socialMediaLinks.map((link, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <div className="flex-1">
                                  <span className="text-sm font-medium">{link.platform}:</span>
                                  <span className="text-sm ml-2 truncate">{link.url}</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSocialMediaLink(link.platform)}
                                  disabled={isLoading}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Work Experience - Only show if createMemberProfile is checked */}
                {createMemberProfile && (
                  <div className="space-y-4 animate-in slide-in-from-top-5 duration-300">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Work Experience</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addWorkExperience} disabled={isLoading}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    
                    {workExperience.map((exp, index) => (
                      <div key={exp.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Experience {index + 1}</span>
                          {workExperience.length > 1 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeWorkExperience(exp.id)}
                              disabled={isLoading}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Job Title</Label>
                            <Input
                              placeholder="Job Title"
                              value={exp.jobTitle}
                              onChange={(e) => updateWorkExperience(exp.id, 'jobTitle', e.target.value)}
                              disabled={isLoading}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Company</Label>
                            <Input
                              placeholder="Company"
                              value={exp.company}
                              onChange={(e) => updateWorkExperience(exp.id, 'company', e.target.value)}
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                              type="month"
                              value={exp.startDate}
                              onChange={(e) => updateWorkExperience(exp.id, 'startDate', e.target.value)}
                              disabled={isLoading}
                              min="1950-01"
                              max="2050-12"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                              type="month"
                              value={exp.endDate}
                              onChange={(e) => updateWorkExperience(exp.id, 'endDate', e.target.value)}
                              disabled={isLoading || exp.isCurrent}
                              min="1950-01"
                              max="2050-12"
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`current-${exp.id}`}
                            checked={exp.isCurrent}
                            onCheckedChange={(checked) => {
                              console.log('Work checkbox - before:', exp.isCurrent, 'checked value:', checked)
                              updateWorkExperience(exp.id, 'isCurrent', !!checked)
                              if (checked) {
                                updateWorkExperience(exp.id, 'endDate', "")
                              }
                            }}
                            disabled={isLoading}
                          />
                          <Label htmlFor={`current-${exp.id}`}>I currently work here</Label>
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            placeholder="Describe your role and responsibilities..."
                            value={exp.description}
                            onChange={(e) => updateWorkExperience(exp.id, 'description', e.target.value)}
                            rows={2}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Education - Only show if createMemberProfile is checked */}
                {createMemberProfile && (
                  <div className="space-y-4 animate-in slide-in-from-top-5 duration-300">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Education</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addEducation} disabled={isLoading}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    
                    {education.map((edu, index) => (
                      <div key={edu.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Education {index + 1}</span>
                          {education.length > 1 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeEducation(edu.id)}
                              disabled={isLoading}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Qualifications</Label>
                            <Input
                              placeholder="Qualifications"
                              value={edu.degree}
                              onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                              disabled={isLoading}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Institution</Label>
                            <Input
                              placeholder="Institution"
                              value={edu.institution}
                              onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                              type="month"
                              value={edu.startDate}
                              onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                              disabled={isLoading}
                              min="1950-01"
                              max="2050-12"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                              type="month"
                              value={edu.endDate}
                              onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                              disabled={isLoading || edu.isCurrent}
                              min="1950-01"
                              max="2050-12"
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`current-edu-${edu.id}`}
                            checked={edu.isCurrent}
                            onCheckedChange={(checked) => {
                              console.log('Education checkbox - before:', edu.isCurrent, 'checked value:', checked)
                              updateEducation(edu.id, 'isCurrent', !!checked)
                              if (checked) {
                                updateEducation(edu.id, 'endDate', "")
                              }
                            }}
                            disabled={isLoading}
                          />
                          <Label htmlFor={`current-edu-${edu.id}`}>I currently study here</Label>
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            placeholder="Describe your studies..."
                            value={edu.description}
                            onChange={(e) => updateEducation(edu.id, 'description', e.target.value)}
                            rows={2}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Terms and Conditions */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeToTerms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="agreeToTerms" className="text-sm">
                    I agree to the{" "}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || isUploadingPhoto}
                  style={{ backgroundColor: '#ffa500', borderColor: '#ffa500' }}
                >
                  {(isLoading || isUploadingPhoto) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isUploadingPhoto ? "Uploading Photo..." : isLoading ? "Creating Account..." : "Register"}
                </Button>
              </form>

              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
