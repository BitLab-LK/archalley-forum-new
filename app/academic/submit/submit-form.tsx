"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, User, GraduationCap, Award, Send } from "lucide-react"
import { toast } from "sonner"

interface FormData {
  title: string
  description: string
  authors: string
  institution: string
  projectType: string
  category: string
  year: string
  keywords: string
  abstract: string
  methodology: string
  results: string
  conclusion: string
  references: string
  contactEmail: string
  agreeToTerms: boolean
  allowPublication: boolean
}

export default function SubmitProjectForm() {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    authors: "",
    institution: "",
    projectType: "",
    category: "",
    year: "",
    keywords: "",
    abstract: "",
    methodology: "",
    results: "",
    conclusion: "",
    references: "",
    contactEmail: "",
    agreeToTerms: false,
    allowPublication: false
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.authors || !formData.contactEmail) {
        toast.error("Please fill in all required fields")
        return
      }

      if (!formData.agreeToTerms) {
        toast.error("Please agree to the terms and conditions")
        return
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      toast.success("Your academic project has been submitted successfully! We'll review it and get back to you soon.")
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        authors: "",
        institution: "",
        projectType: "",
        category: "",
        year: "",
        keywords: "",
        abstract: "",
        methodology: "",
        results: "",
        conclusion: "",
        references: "",
        contactEmail: "",
        agreeToTerms: false,
        allowPublication: false
      })
    } catch (error) {
      toast.error("Failed to submit project. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Project Information
          </CardTitle>
          <CardDescription>
            Provide basic information about your academic project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter your project title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => handleInputChange("year", e.target.value)}
                placeholder="2024"
                min="2000"
                max="2030"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Project Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Provide a brief description of your project"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="projectType">Project Type</Label>
              <Select value={formData.projectType} onValueChange={(value) => handleInputChange("projectType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="research">Research Paper</SelectItem>
                  <SelectItem value="thesis">Thesis</SelectItem>
                  <SelectItem value="dissertation">Dissertation</SelectItem>
                  <SelectItem value="capstone">Capstone Project</SelectItem>
                  <SelectItem value="portfolio">Portfolio</SelectItem>
                  <SelectItem value="case-study">Case Study</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sustainability">Sustainability</SelectItem>
                  <SelectItem value="urban-planning">Urban Planning</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="heritage">Heritage</SelectItem>
                  <SelectItem value="social">Social Architecture</SelectItem>
                  <SelectItem value="innovation">Innovation</SelectItem>
                  <SelectItem value="design">Design Theory</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords</Label>
            <Input
              id="keywords"
              value={formData.keywords}
              onChange={(e) => handleInputChange("keywords", e.target.value)}
              placeholder="architecture, sustainability, design (comma separated)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Author Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Author Information
          </CardTitle>
          <CardDescription>
            Provide details about the project authors and institution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="authors">Authors *</Label>
            <Input
              id="authors"
              value={formData.authors}
              onChange={(e) => handleInputChange("authors", e.target.value)}
              placeholder="John Doe, Jane Smith"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution">Institution</Label>
            <Input
              id="institution"
              value={formData.institution}
              onChange={(e) => handleInputChange("institution", e.target.value)}
              placeholder="University Name, School of Architecture"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email *</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => handleInputChange("contactEmail", e.target.value)}
              placeholder="your.email@university.edu"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Academic Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Academic Details
          </CardTitle>
          <CardDescription>
            Provide detailed academic information about your project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="abstract">Abstract</Label>
            <Textarea
              id="abstract"
              value={formData.abstract}
              onChange={(e) => handleInputChange("abstract", e.target.value)}
              placeholder="Provide a brief abstract of your project"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="methodology">Methodology</Label>
            <Textarea
              id="methodology"
              value={formData.methodology}
              onChange={(e) => handleInputChange("methodology", e.target.value)}
              placeholder="Describe the methodology used in your project"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="results">Results</Label>
            <Textarea
              id="results"
              value={formData.results}
              onChange={(e) => handleInputChange("results", e.target.value)}
              placeholder="Describe the results and findings"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conclusion">Conclusion</Label>
            <Textarea
              id="conclusion"
              value={formData.conclusion}
              onChange={(e) => handleInputChange("conclusion", e.target.value)}
              placeholder="Provide your conclusions and recommendations"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="references">References</Label>
            <Textarea
              id="references"
              value={formData.references}
              onChange={(e) => handleInputChange("references", e.target.value)}
              placeholder="List your references and citations"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Terms and Conditions
          </CardTitle>
          <CardDescription>
            Please review and agree to our submission terms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="agreeToTerms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
            />
            <Label htmlFor="agreeToTerms" className="text-sm">
              I agree to the terms and conditions for academic project submission *
            </Label>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="allowPublication"
              checked={formData.allowPublication}
              onCheckedChange={(checked) => handleInputChange("allowPublication", checked as boolean)}
            />
            <Label htmlFor="allowPublication" className="text-sm">
              I allow Archalley to publish my project in the academic collection
            </Label>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              By submitting your project, you confirm that:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>You are the author or have permission to submit this work</li>
              <li>The work is original and not plagiarized</li>
              <li>You have the right to grant publication permissions</li>
              <li>All co-authors have been acknowledged</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          size="lg"
          className="min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Project
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
