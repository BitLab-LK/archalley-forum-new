"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, ArrowRight, Star, Briefcase, GraduationCap } from "lucide-react"
import EnhancedRegisterPage from "./enhanced-page"

export default function RegisterPage() {
  const [useEnhancedForm, setUseEnhancedForm] = useState(false)

  if (useEnhancedForm) {
    return <EnhancedRegisterPage />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center">Join Archalley Forum</CardTitle>
          <CardDescription className="text-center text-lg">
            Professional Networking for Construction & Related Industries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Professional Profile Option */}
            <div 
              onClick={() => setUseEnhancedForm(true)}
              className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer group hover:border-primary"
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">Professional Profile</h3>
                  <Badge variant="secondary">Recommended</Badge>
                </div>
                
                <p className="text-muted-foreground">
                  Create a comprehensive professional profile with work experience, education, and skills
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>Enhanced networking opportunities</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Briefcase className="h-4 w-4 text-blue-500" />
                    <span>Work experience tracking</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-green-500" />
                    <span>Education history</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span>Skills and social media integration</span>
                  </div>
                </div>
                
                <Button className="w-full group-hover:bg-primary/90">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Registration Option */}
            <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-6 w-6 text-muted-foreground" />
                  <h3 className="text-xl font-semibold">Quick Registration</h3>
                </div>
                
                <p className="text-muted-foreground">
                  Basic registration with essential information only. You can always enhance your profile later.
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>• Basic contact information</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>• Company and profession</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>• Quick setup (2-3 minutes)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>• Upgrade to professional later</span>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/auth/register/simple">
                    Quick Start
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="text-sm text-muted-foreground">
              Both registration types include access to all forum features
            </div>
            
            <div className="text-center text-sm border-t pt-4">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Sign in here
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
