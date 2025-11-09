"use client"

import type React from "react"
import { getNames } from "country-list"
import { useState, useEffect, useCallback } from "react"
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
import { Switch } from "@/components/ui/switch"
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

import { saveLastUrl, getLastUrl, clearLastUrl } from "@/lib/auth-utils"

const SESSION_STORAGE_KEY = 'archalley-last-url'

export default function SimplifiedEnhancedRegisterPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  // Get callbackUrl from URL params or sessionStorage
  const urlCallbackUrl = searchParams.get('callbackUrl')
  const [callbackUrl, setCallbackUrl] = useState(urlCallbackUrl || getLastUrl())
  const [activeTab, setActiveTab] = useState("register")
  const [createMemberProfile, setCreateMemberProfile] = useState(false)

  // Track animation state to prevent repeated animations
  const [hasAnimated, setHasAnimated] = useState(false)
  
  // Clean up OAuth flags on component mount (without page reload)
  useEffect(() => {
    const oauthAttempt = localStorage.getItem('oauth_attempt')
    const oauthTimestamp = localStorage.getItem('oauth_timestamp')
    
    if (oauthAttempt && oauthTimestamp) {
      const attemptTime = parseInt(oauthTimestamp)
      const now = Date.now()
      const fiveMinutes = 5 * 60 * 1000
      
      // Clean up old flags if attempt was too old
      if (now - attemptTime >= fiveMinutes) {
        localStorage.removeItem('oauth_attempt')
        localStorage.removeItem('oauth_timestamp')
      }
    }
    
    // Mark that initial animation has been shown
    setHasAnimated(true)
  }, [])

  // Set active tab based on URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'login' || tab === 'register') {
      setActiveTab(tab)
    }
    
    // Handle messages from URL parameters (e.g., after registration completion)
    const urlMessage = searchParams.get('message')
    if (urlMessage) {
      setMessage(decodeURIComponent(urlMessage))
    }
    
    // If callbackUrl is in URL params, save it to sessionStorage and update state
    const urlCallbackUrl = searchParams.get('callbackUrl')
    if (urlCallbackUrl) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, urlCallbackUrl)
      setCallbackUrl(urlCallbackUrl)
    } else {
      // Otherwise, use sessionStorage value or default
      const storedUrl = sessionStorage.getItem(SESSION_STORAGE_KEY) || '/'
      setCallbackUrl(storedUrl)
    }
  }, [searchParams])

  // Handle pre-filled data from social OAuth
  useEffect(() => {
    const provider = searchParams.get('provider')
    const email = searchParams.get('email')
    const name = searchParams.get('name')
    const image = searchParams.get('image')
    const providerAccountId = searchParams.get('providerAccountId')
    const accessToken = searchParams.get('accessToken')
    const tokenType = searchParams.get('tokenType')
    const scope = searchParams.get('scope')

    if (provider && email) {
      console.log('Social OAuth registration detected:', { provider, email, name })
      
      // Store OAuth data for registration
      setOauthData({
        provider,
        providerAccountId: providerAccountId || '',
        accessToken: accessToken || '',
        tokenType: tokenType || '',
        scope: scope || ''
      })
      
      // Pre-fill the form with social data
      setEmail(decodeURIComponent(email))
      if (name) {
        const names = decodeURIComponent(name).split(' ')
        setFirstName(names[0] || '')
        setLastName(names.slice(1).join(' ') || '')
      }
      if (image) {
        // We'll handle profile image URL separately since it's not a File object
        setSocialProfileImage(decodeURIComponent(image))
      }
      // Show a message that this is social registration
      setError("")
      setSuccess(false)
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
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null)
  const [socialProfileImage, setSocialProfileImage] = useState<string>("")
  
  // Privacy Settings
  const [emailPrivacy, setEmailPrivacy] = useState("EVERYONE")
  const [phonePrivacy, setPhonePrivacy] = useState("MEMBERS_ONLY")
  const [profilePhotoPrivacy, setProfilePhotoPrivacy] = useState("EVERYONE")
  
  // Professional Profile
  const [headline, setHeadline] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState("")
  const [professions, setProfessions] = useState<string[]>([])
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
  const [message, setMessage] = useState("")
  const [oauthData, setOauthData] = useState<{
    provider?: string
    providerAccountId?: string
    accessToken?: string
    tokenType?: string
    scope?: string
  }>({})

  // Cleanup effect for profile photo preview URL
  useEffect(() => {
    return () => {
      if (profilePhotoPreview) {
        URL.revokeObjectURL(profilePhotoPreview)
      }
    }
  }, [profilePhotoPreview])

  const professionsList = [
    "3D Visualizer",
    "Acoustic Consultant",
    "Animator / Motion Graphics Designer",
    "Architect",
    "BIM Modeler",
    "Branding Consultant",
    "Carpenter",
    "Civil Engineer",
    "Contractor",
    "Draughtsman",
    "Electrician",
    "Electrical Engineer",
    "Elevator Technician",
    "Environmental Engineer",
    "Fabricator",
    "Façade Engineer",
    "Fire Consultant",
    "Furniture Designer",
    "Geotechnical Engineer",
    "Graphic Designer",
    "Green Building Consultant",
    "HVAC Technician",
    "Interior Designer",
    "Landscape Architect",
    "Machine Operator",
    "Mason",
    "Marketing Specialist",
    "Materials Engineer",
    "Mechanical Engineer",
    "MEP Engineer",
    "Painter",
    "Photographer",
    "Plumber",
    "Plumbing Engineer",
    "Procurement Specialist",
    "Product Designer",
    "Project Manager",
    "Quantity Surveyor",
    "Safety Officer (HSE)",
    "Site Supervisor",
    "Smart Building Consultant",
    "Social Media Manager",
    "Structural Engineer",
    "Surveyor",
    "Technical Officer",
    "Tile Setter",
    "Urban Planner",
    "Videographer",
    "Welder",
    "Lighting Consultant"
  ]

  // Use country-list package for countries, add "Other" manually, Sri Lanka at top
  const countryNames = Object.values(getNames()) as string[]
  const countries: string[] = [
    "Sri Lanka",
    ...countryNames.filter((c: string) => c !== "Sri Lanka").sort((a: string, b: string) => a.localeCompare(b)),
    "Other"
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

  const addProfession = (profession: string) => {
    if (profession && !professions.includes(profession)) {
      setProfessions([...professions, profession])
    }
  }

  const removeProfession = (professionToRemove: string) => {
    setProfessions(professions.filter(prof => prof !== professionToRemove))
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

    console.log('🚀 Registration submit started')
    console.log('📁 Current profilePhoto state:', profilePhoto ? {
      name: profilePhoto.name,
      size: profilePhoto.size,
      type: profilePhoto.type
    } : 'No file')

    const provider = searchParams.get('provider')
    const isSocialRegistration = !!provider
    console.log('🔒 Social registration:', isSocialRegistration)

    // Validation
    if (!isSocialRegistration && password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (!isSocialRegistration && password.length < 6) {
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
          console.log('🔄 Starting profile photo upload:', profilePhoto.name, profilePhoto.size, profilePhoto.type)
          setIsUploadingPhoto(true)
          const uploadFormData = new FormData()
          uploadFormData.append('images', profilePhoto)
          
          console.log('📤 Sending upload request to /api/upload/registration')
          const uploadResponse = await fetch('/api/upload/registration', {
            method: 'POST',
            body: uploadFormData,
          })
          
          console.log('📥 Upload response status:', uploadResponse.status, uploadResponse.statusText)
          
          let uploadData
          try {
            uploadData = await uploadResponse.json()
            console.log('📥 Upload response data:', uploadData)
          } catch (jsonError) {
            console.error('❌ Failed to parse upload response as JSON:', jsonError)
            console.log('📄 Response text:', await uploadResponse.text())
            throw new Error('Upload response is not valid JSON')
          }
          
          if (uploadResponse.ok && uploadData.images && uploadData.images.length > 0) {
            profileImageUrl = uploadData.images[0].url
            console.log('✅ Profile photo uploaded successfully:', profileImageUrl)
          } else {
            console.warn('⚠️ Profile photo upload failed:', uploadData.error || 'Unknown error')
            console.warn('⚠️ Response status:', uploadResponse.status)
            // Continue with registration even if photo upload fails
          }
        } catch (uploadError) {
          console.error('❌ Profile photo upload error:', uploadError)
          // Continue with registration even if photo upload fails
        } finally {
          setIsUploadingPhoto(false)
        }
      } else if (socialProfileImage) {
        // Use social profile image if no file was uploaded
        profileImageUrl = socialProfileImage
      }

      const formData = {
        firstName,
        lastName,
        email,
        phoneNumber,
        password: isSocialRegistration ? undefined : password, // Don't send password for social registration
        headline,
        skills,
        professions,
        country,
        city,
        bio,
        websiteUrl,
        portfolioLinks,
        socialMediaLinks,
        profileImageUrl, // Add the uploaded image URL or social image
        workExperience: workExperience.filter(exp => exp.jobTitle && exp.company),
        education: education.filter(edu => edu.degree && edu.institution),
        isSocialRegistration,
        provider,
        callbackUrl, // Include callbackUrl for redirect after registration
        // Privacy settings
        emailPrivacy,
        phonePrivacy,
        profilePhotoPrivacy,
        // Include OAuth data for account linking
        ...(isSocialRegistration && oauthData.provider ? {
          providerAccountId: oauthData.providerAccountId,
          accessToken: oauthData.accessToken,
          tokenType: oauthData.tokenType,
          scope: oauthData.scope,
        } : {})
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

      // Handle post-registration flow
      if (isSocialRegistration) {
        // For social registration, use auto-login endpoint to avoid account selection
        setTimeout(async () => {
          try {
            console.log(`Creating session directly for ${email} via ${provider}...`)
            
            const autoLoginResponse = await fetch("/api/auth/auto-login", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email,
                provider,
                callbackUrl: data.redirectTo || callbackUrl
              }),
            })

            const autoLoginData = await autoLoginResponse.json()

            if (autoLoginResponse.ok) {
              console.log("Auto-login successful, redirecting to:", data.redirectTo || callbackUrl)
              // Clear sessionStorage and redirect
              clearLastUrl()
              // Successful auto-login, redirect to callbackUrl or homepage
              window.location.href = data.redirectTo || callbackUrl || "/"
            } else {
              console.error("Auto-login failed:", autoLoginData.error)
              // Keep callbackUrl in sessionStorage for manual login
              // Fallback to manual login if auto-login fails
              router.push(`/auth/register?tab=login&message=✅ Registration complete! Click "${provider?.toUpperCase()}" to finish&provider=${provider}`)
            }
          } catch (error) {
            console.error("Auto-login error:", error)
            // Keep callbackUrl in sessionStorage for manual login
            // Fallback to manual login if auto-login fails
            router.push(`/auth/register?tab=login&message=✅ Registration complete! Click "${provider?.toUpperCase()}" to finish&provider=${provider}`)
          }
        }, 1500) // Give user moment to see success, then auto-login
      } else {
        // For email/password registration, show message about email verification
        if (data.requiresVerification) {
          // Keep callbackUrl in sessionStorage for after verification
          // Show success message and redirect to login with message
          setTimeout(() => {
            router.push(`/auth/register?tab=login&message=${encodeURIComponent(data.message)}`)
          }, 2000)
        } else {
          // Fallback (should not happen for email/password registration)
          clearLastUrl()
          setTimeout(() => {
            router.push(callbackUrl || "/")
          }, 2000)
        }
      }
    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = useCallback(async (provider: string) => {
    setIsLoading(true)
    setError("") // Clear any previous errors
    
    try {
      console.log(`Attempting ${provider} login...`)
      
      // Set OAuth attempt flags before redirecting (with shorter timeout)
      localStorage.setItem('oauth_attempt', provider)
      localStorage.setItem('oauth_timestamp', Date.now().toString())
      
      // For social logins, save callbackUrl to sessionStorage and let NextAuth handle redirect
      // NextAuth will use the callbackUrl parameter, and we'll also have it in sessionStorage as backup
      const lastUrl = getLastUrl()
      await signIn(provider, { 
        callbackUrl: lastUrl || '/',
        redirect: true // Let NextAuth handle the redirect
      })
    } catch (error) {
      console.error("Social login exception:", error)
      // Clear OAuth flags on error
      localStorage.removeItem('oauth_attempt')
      localStorage.removeItem('oauth_timestamp')
      setError(`An error occurred during ${provider} login. Please try again.`)
      setIsLoading(false)
    }
    // Don't set loading to false here since we're redirecting
  }, [])

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
        // Get last URL from sessionStorage, clear it, and redirect
        const lastUrl = getLastUrl()
        clearLastUrl()
        router.push(lastUrl)
        router.refresh()
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    const provider = searchParams.get('provider')
    const isSocialRegistration = !!provider

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
        <Card className="w-full max-w-md animate-scale-in animate-delay-100">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 animate-pulse-glow" />
              <h2 className="text-2xl font-bold">Account Created!</h2>
              {isSocialRegistration ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Your profile has been created successfully! You're being automatically logged in and redirected to the homepage.
                  </p>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#ffa500' }}></div>
                    <span className="text-sm text-muted-foreground">Logging you in...</span>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    Your professional profile has been created successfully. You're being signed in...
                  </p>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#ffa500' }}></div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-4 sm:py-12 px-2 sm:px-4 lg:px-8 ${!hasAnimated ? 'animate-fade-in' : ''}`}>
      <Card className={`w-full max-w-2xl ${!hasAnimated ? 'animate-scale-in animate-delay-100' : ''}`}>
        <CardHeader className="space-y-1 p-4 sm:p-6">
          <CardTitle className={`text-xl sm:text-2xl font-bold text-center ${!hasAnimated ? 'animate-fade-in-up animate-delay-200' : ''}`} style={{ color: '#ffa500' }}>
            {activeTab === "login" ? "Welcome to Archalley" : "Join Archalley"}
          </CardTitle>
          <CardDescription className={`text-center text-sm sm:text-base ${!hasAnimated ? 'animate-fade-in-up animate-delay-300' : ''}`}>
            {activeTab === "login" 
              ? "Sign in to continue or create a new account" 
              : "Professional Networking for Construction & Related Industries"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className={`w-full ${!hasAnimated ? 'animate-fade-in-up animate-delay-400' : ''}`}>
            <TabsList className="grid w-full grid-cols-2 smooth-transition hover-lift">
              <TabsTrigger value="login" className="smooth-transition">Login</TabsTrigger>
              <TabsTrigger value="register" className="smooth-transition">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className={`space-y-6 ${!hasAnimated ? 'animate-fade-in-up animate-delay-500' : ''}`}>
              {/* Success Message */}
              {message && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/50 animate-fade-in-up animate-delay-600">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    {message}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Social Login */}
              <div className={`space-y-2 sm:space-y-3 ${!hasAnimated ? 'animate-fade-in-up animate-delay-700' : ''}`}>
                <Button
                  variant={searchParams.get('provider') === 'google' ? "default" : "outline"}
                  className={`w-full text-sm sm:text-base smooth-transition hover-lift ${searchParams.get('provider') === 'google' ? 'ring-2 ring-blue-500 bg-blue-600 hover:bg-blue-700 text-white animate-pulse' : ''}`}
                  type="button"
                  onClick={() => handleSocialLogin("google")}
                  disabled={isLoading}
                  size="sm"
                >
                  <Mail className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Continue with Google
                  {searchParams.get('provider') === 'google' && <span className="ml-2">👈</span>}
                </Button>
                <Button
                  variant={searchParams.get('provider') === 'facebook' ? "default" : "outline"}
                  className={`w-full text-sm sm:text-base smooth-transition hover-lift ${searchParams.get('provider') === 'facebook' ? 'ring-2 ring-blue-500 bg-blue-600 hover:bg-blue-700 text-white animate-pulse' : ''}`}
                  type="button"
                  onClick={() => handleSocialLogin("facebook")}
                  disabled={isLoading}
                  size="sm"
                >
                  <Facebook className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Continue with Facebook
                  {searchParams.get('provider') === 'facebook' && <span className="ml-2">👈</span>}
                </Button>
                <Button
                  variant={searchParams.get('provider') === 'linkedin' ? "default" : "outline"}
                  className={`w-full text-sm sm:text-base smooth-transition hover-lift ${searchParams.get('provider') === 'linkedin' ? 'ring-2 ring-blue-500 bg-blue-600 hover:bg-blue-700 text-white animate-pulse' : ''}`}
                  type="button"
                  onClick={() => handleSocialLogin("linkedin")}
                  disabled={isLoading}
                  size="sm"
                >
                  <Linkedin className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Continue with LinkedIn
                  {searchParams.get('provider') === 'linkedin' && <span className="ml-2">👈</span>}
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
              <form onSubmit={handleLogin} className={`space-y-4 ${!hasAnimated ? 'animate-fade-in-up animate-delay-800' : ''}`}>
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
                    className="smooth-transition focus:scale-105"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="loginPassword">Password</Label>
                    <Button variant="link" className="px-0 font-normal text-sm h-auto smooth-transition hover-lift" asChild>
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
                    className="smooth-transition focus:scale-105"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full smooth-transition hover-lift" 
                  disabled={isLoading}
                  style={{ backgroundColor: '#ffa500', borderColor: '#ffa500' }}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className={`space-y-6 ${!hasAnimated ? 'animate-fade-in-up animate-delay-500' : ''}`}>
              {error && (
                <Alert variant="destructive" className="animate-fade-in-up animate-delay-600">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Social Registration */}
              <div className={`space-y-3 ${!hasAnimated ? 'animate-fade-in-up animate-delay-700' : ''}`}>
                <Button
                  variant="outline"
                  className="w-full smooth-transition hover-lift"
                  type="button"
                  onClick={() => handleSocialLogin("google")}
                  disabled={isLoading}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Continue with Google
                </Button>
                <Button
                  variant="outline"
                  className="w-full smooth-transition hover-lift"
                  type="button"
                  onClick={() => handleSocialLogin("facebook")}
                  disabled={isLoading}
                >
                  <Facebook className="mr-2 h-4 w-4" />
                  Continue with Facebook
                </Button>
                <Button
                  variant="outline"
                  className="w-full smooth-transition hover-lift"
                  type="button"
                  onClick={() => handleSocialLogin("linkedin")}
                  disabled={isLoading}
                >
                  <Linkedin className="mr-2 h-4 w-4" />
                  Continue with LinkedIn
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

              <form onSubmit={handleSubmit} className={`space-y-6 ${!hasAnimated ? 'animate-fade-in-up animate-delay-800' : ''}`}>
                {/* Social Registration Indicator */}
                {searchParams.get('provider') && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-fade-in-up animate-delay-900">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center smooth-transition hover:scale-110">
                        {searchParams.get('provider') === 'google' && <Mail className="h-4 w-4 text-white" />}
                        {searchParams.get('provider') === 'facebook' && <Facebook className="h-4 w-4 text-white" />}
                        {searchParams.get('provider') === 'linkedin' && <Linkedin className="h-4 w-4 text-white" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900">Welcome! Complete Your Profile</h4>
                        <p className="text-sm text-blue-700">We've pre-filled your basic info from {searchParams.get('provider')?.charAt(0).toUpperCase()}{searchParams.get('provider')?.slice(1)}. Complete your profile to join our community!</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Registration Form Fields */}
                <div className="grid grid-cols-2 gap-4 animate-fade-in-up animate-delay-1000">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="Enter your first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      disabled={isLoading}
                      className="smooth-transition focus:scale-105"
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
                      className="smooth-transition focus:scale-105"
                    />
                  </div>
                </div>

                <div className="space-y-2 animate-fade-in-up animate-delay-1100">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email">Email Address</Label>
                    <Label htmlFor="emailPrivacy" className="text-sm">Visibility</Label>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="flex-1 smooth-transition focus:scale-105"
                    />
                    <Select value={emailPrivacy} onValueChange={setEmailPrivacy}>
                      <SelectTrigger className="w-[140px] smooth-transition hover:scale-105">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EVERYONE">Everyone</SelectItem>
                        <SelectItem value="MEMBERS_ONLY">Members Only</SelectItem>
                        <SelectItem value="ONLY_ME">Only Me</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Label htmlFor="phonePrivacy" className="text-sm">Visibility</Label>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="phoneNumber"
                      placeholder="+1 (555) 123-4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Select value={phonePrivacy} onValueChange={setPhonePrivacy}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EVERYONE">Everyone</SelectItem>
                        <SelectItem value="MEMBERS_ONLY">Members Only</SelectItem>
                        <SelectItem value="ONLY_ME">Only Me</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!searchParams.get('provider') && (
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
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="profilePhoto">Profile Photo</Label>
                    <Label htmlFor="profilePhotoPrivacy" className="text-sm">Visibility</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Image Preview Circle */}
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                        {profilePhotoPreview ? (
                          <img 
                            src={profilePhotoPreview} 
                            alt="Profile preview" 
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <Upload className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      {profilePhotoPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfilePhoto(null)
                            setProfilePhotoPreview(null)
                            // Reset the file input
                            const fileInput = document.getElementById('profilePhoto') as HTMLInputElement
                            if (fileInput) fileInput.value = ''
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    
                    {/* Button and Privacy Dropdown */}
                    <Input
                      id="profilePhoto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        console.log('📁 File selected:', file ? {
                          name: file.name,
                          size: file.size,
                          type: file.type
                        } : 'No file')
                        setProfilePhoto(file)
                        
                        // Create preview URL
                        if (file) {
                          const previewUrl = URL.createObjectURL(file)
                          setProfilePhotoPreview(previewUrl)
                        } else {
                          setProfilePhotoPreview(null)
                        }
                      }}
                      disabled={isLoading}
                      className="hidden"
                    />
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('profilePhoto')?.click()}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {profilePhoto ? 'Change Photo' : 'Choose Photo'}
                    </Button>
                    
                    <Select value={profilePhotoPrivacy} onValueChange={setProfilePhotoPrivacy}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EVERYONE">Everyone</SelectItem>
                        <SelectItem value="MEMBERS_ONLY">Members Only</SelectItem>
                        <SelectItem value="ONLY_ME">Only Me</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Welcome Notice */}
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/50">
                  <AlertDescription className="text-blue-700 dark:text-blue-300">
                    Welcome to your Archalley professional profile. You can manage its visibility and switch between Public or Private mode at anytime.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label className="text-base font-medium">Profile Visibility</Label>
                    <div className="flex items-center space-x-3">
                      <span className={`text-sm font-medium transition-colors ${!createMemberProfile ? 'text-gray-900' : 'text-gray-500'}`}>
                        Private
                      </span>
                      <Switch
                        id="createMemberProfile"
                        checked={createMemberProfile}
                        onCheckedChange={setCreateMemberProfile}
                        disabled={isLoading}
                        className="data-[state=checked]:bg-orange-500"
                      />
                      <span className={`text-sm font-medium transition-colors ${createMemberProfile ? 'text-orange-600' : 'text-gray-500'}`}>
                        Public
                      </span>
                    </div>
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
                      <Label htmlFor="professions">Profession(s)</Label>
                      <div className="space-y-2">
                        <Select onValueChange={addProfession} disabled={isLoading}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select profession(s)" />
                          </SelectTrigger>
                          <SelectContent>
                            {professionsList
                              .filter(prof => !professions.includes(prof))
                              .map((profession) => (
                                <SelectItem key={profession} value={profession}>
                                  {profession}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        
                        {/* Display selected professions */}
                        {professions.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
                            {professions.map((profession) => (
                              <Badge key={profession} variant="secondary" className="flex items-center gap-1">
                                {profession}
                                <button
                                  type="button"
                                  onClick={() => removeProfession(profession)}
                                  className="ml-1 text-gray-500 hover:text-gray-700"
                                  disabled={isLoading}
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Select value={country} onValueChange={setCountry} disabled={isLoading}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((ctry: string) => (
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
                      
                      <div className="flex gap-2">
                        <div className="w-1/3">
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
                        </div>
                        
                        <div className="flex-1">
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
