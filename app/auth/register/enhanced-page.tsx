"use client"

import type React from "react"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { 
  Facebook, 
  Mail, 
  AlertCircle, 
  Loader2, 
  CheckCircle, 
  Calendar as CalendarIcon,
  Plus,
  Minus,
  Upload,
  Linkedin
} from "lucide-react"

interface WorkExperience {
  id: string
  jobTitle: string
  company: string
  startDate: Date | undefined
  endDate: Date | undefined
  isCurrent: boolean
  description: string
}

interface Education {
  id: string
  degree: string
  institution: string
  startDate: Date | undefined
  endDate: Date | undefined
  isCurrent: boolean
  description: string
}

export default function EnhancedRegisterPage() {
  const [activeTab, setActiveTab] = useState("register")
  
  // Simple date formatting function
  const formatDate = (date: Date | undefined) => {
    if (!date) return null
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  }
  
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
  const [portfolioUrl, setPortfolioUrl] = useState("")
  
  // Social Media
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [facebookUrl, setFacebookUrl] = useState("")
  const [instagramUrl, setInstagramUrl] = useState("")
  
  // Work Experience
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([
    {
      id: "1",
      jobTitle: "",
      company: "",
      startDate: undefined,
      endDate: undefined,
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
      startDate: undefined,
      endDate: undefined,
      isCurrent: false,
      description: "",
    }
  ])
  
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()])
      setSkillInput("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove))
  }

  const addWorkExperience = () => {
    const newExp: WorkExperience = {
      id: Date.now().toString(),
      jobTitle: "",
      company: "",
      startDate: undefined,
      endDate: undefined,
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
    setWorkExperience(workExperience.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ))
  }

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      degree: "",
      institution: "",
      startDate: undefined,
      endDate: undefined,
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
    setEducation(education.map(edu => 
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

    try {
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
        portfolioUrl,
        linkedinUrl,
        facebookUrl,
        instagramUrl,
        workExperience: workExperience.filter(exp => exp.jobTitle && exp.company).map(exp => ({
          jobTitle: exp.jobTitle,
          company: exp.company,
          startDate: exp.startDate?.toISOString(),
          endDate: exp.endDate?.toISOString(),
          isCurrent: exp.isCurrent,
          description: exp.description,
        })),
        education: education.filter(edu => edu.degree && edu.institution).map(edu => ({
          degree: edu.degree,
          institution: edu.institution,
          startDate: edu.startDate?.toISOString(),
          endDate: edu.endDate?.toISOString(),
          isCurrent: edu.isCurrent,
          description: edu.description,
        })),
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-4xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Archalley Forum</CardTitle>
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
            
            <TabsContent value="login" className="space-y-4">
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Login functionality will redirect to the existing login page
                </p>
                <Button asChild className="mt-4">
                  <Link href="/auth/login">Go to Login</Link>
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Social Registration */}
              <div className="space-y-2">
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
                  <span className="bg-background px-2 text-muted-foreground">Or register with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  
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
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="createMemberProfile"
                        defaultChecked
                        disabled
                      />
                      <Label htmlFor="createMemberProfile" className="text-sm text-muted-foreground">
                        Create a Member Profile: This will create a public professional profile on other
                        members can learn more about you, based on your skills, work
                        history, education, and contact details.
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Professional Profile */}
                <div className="space-y-4">
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
                    <div className="flex space-x-2">
                      <Input
                        id="skills"
                        placeholder="e.g., BIM, Project Management, AutoCAD"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        disabled={isLoading}
                      />
                      <Button type="button" onClick={addSkill} disabled={isLoading}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
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

                  <div className="space-y-2">
                    <Label htmlFor="bio">About/Summary</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portfolioUrl">Portfolio/Website Link</Label>
                    <Input
                      id="portfolioUrl"
                      type="url"
                      placeholder="https://www.yourportfolio.com"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Social Media Profiles */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Social Media Profiles</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      placeholder="LinkedIn Profile URL"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebookUrl">Facebook Profile URL</Label>
                    <Input
                      id="facebookUrl"
                      type="url"
                      placeholder="Facebook Profile URL"
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagramUrl">Instagram Profile URL</Label>
                    <Input
                      id="instagramUrl"
                      type="url"
                      placeholder="Instagram Profile URL"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Work Experience */}
                <div className="space-y-4">
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

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date (YYYY-MM)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !exp.startDate && "text-muted-foreground"
                                )}
                                disabled={isLoading}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {exp.startDate ? formatDate(exp.startDate) : "Start date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={exp.startDate}
                                onSelect={(date) => updateWorkExperience(exp.id, 'startDate', date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>End Date (YYYY-MM) - Leave blank if currently</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !exp.endDate && "text-muted-foreground"
                                )}
                                disabled={isLoading || exp.isCurrent}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {exp.endDate ? formatDate(exp.endDate) : exp.isCurrent ? "Present" : "End date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={exp.endDate}
                                onSelect={(date) => updateWorkExperience(exp.id, 'endDate', date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`current-${exp.id}`}
                          checked={exp.isCurrent}
                          onCheckedChange={(checked) => {
                            updateWorkExperience(exp.id, 'isCurrent', checked)
                            if (checked) {
                              updateWorkExperience(exp.id, 'endDate', undefined)
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

                {/* Education */}
                <div className="space-y-4">
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
                      
                      <div className="space-y-2">
                        <Label>Degree</Label>
                        <Input
                          placeholder="Degree"
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

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date (YYYY-MM)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !edu.startDate && "text-muted-foreground"
                                )}
                                disabled={isLoading}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {edu.startDate ? formatDate(edu.startDate) : "Start date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={edu.startDate}
                                onSelect={(date) => updateEducation(edu.id, 'startDate', date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>End Date (YYYY-MM) - Leave blank if currently</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !edu.endDate && "text-muted-foreground"
                                )}
                                disabled={isLoading || edu.isCurrent}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {edu.endDate ? formatDate(edu.endDate) : edu.isCurrent ? "Present" : "End date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={edu.endDate}
                                onSelect={(date) => updateEducation(edu.id, 'endDate', date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`current-edu-${edu.id}`}
                          checked={edu.isCurrent}
                          onCheckedChange={(checked) => {
                            updateEducation(edu.id, 'isCurrent', checked)
                            if (checked) {
                              updateEducation(edu.id, 'endDate', undefined)
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

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Register
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
