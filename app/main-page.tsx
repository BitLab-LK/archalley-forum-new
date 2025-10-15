"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Building2, 
  Users, 
  MessageSquare, 
  Trophy, 
  ArrowRight,
  Lightbulb,
  Target,
  Compass
} from "lucide-react"

export default function MainPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4" variant="secondary">
              Welcome to Archalley
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Discover Innovative
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                {" "}Architecture
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your gateway to cutting-edge architectural designs, construction insights, 
              and a thriving community of professionals and enthusiasts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/forum">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Join Our Forum
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#features">
                  <Compass className="mr-2 h-5 w-5" />
                  Explore Features
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for Architecture
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From project showcases to professional networking, discover all the tools 
              and resources for architectural excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Forum Feature */}
            <Card className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Community Forum</CardTitle>
                <CardDescription>
                  Connect with architects, designers, and enthusiasts. Share projects, 
                  get feedback, and discuss industry trends.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="group">
                  <Link href="/forum">
                    Visit Forum
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Projects Feature */}
            <Card className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Project Portfolio</CardTitle>
                <CardDescription>
                  Discover inspiring architectural projects across multiple categories, 
                  from residential to commercial and beyond.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="group">
                  <Link href="/projects">
                    Browse Projects
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Academic Feature */}
            <Card className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Academic Hub</CardTitle>
                <CardDescription>
                  Access research papers, student projects, and academic resources 
                  from universities worldwide.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="group">
                  <Link href="/academic">
                    Explore Research
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* News Feature */}
            <Card className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Latest News</CardTitle>
                <CardDescription>
                  Stay updated with industry news, regulations, awards, and 
                  technological advancements in architecture.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="group">
                  <Link href="/news">
                    Read News
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Articles Feature */}
            <Card className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Expert Articles</CardTitle>
                <CardDescription>
                  In-depth articles and insights from industry experts covering 
                  design theory, technology, and best practices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="group">
                  <Link href="/articles">
                    Read Articles
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Events Feature */}
            <Card className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Events & Conferences</CardTitle>
                <CardDescription>
                  Discover conferences, workshops, exhibitions, and networking 
                  events in the architecture community.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" asChild className="group">
                  <Link href="/events">
                    View Events
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Join the Community?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Connect with thousands of architecture professionals and enthusiasts. 
            Share your work, learn from experts, and grow your network.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/register">
                Get Started Today
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/forum">
                Explore Forum
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}