"use client"

import StaggeredAnimation from "@/components/staggered-animation"
import EnhancedScrollAnimation from "@/components/enhanced-scroll-animation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Box, 
  Users, 
  MessageCircle, 
  Award, 
  ChevronRight,
  Lightbulb,
  Newspaper
} from "lucide-react"

interface AnimatedContentWrapperProps {
  children: React.ReactNode
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
  delay?: number
  triggerOnce?: boolean
}

export function AnimatedContentWrapper({ 
  children, 
  direction = 'up', 
  delay = 0,
  triggerOnce = false 
}: AnimatedContentWrapperProps) {
  return (
    <EnhancedScrollAnimation 
      direction={direction} 
      delay={delay}
      triggerOnce={triggerOnce}
      duration={800}
      threshold={0.15}
    >
      {children}
    </EnhancedScrollAnimation>
  )
}

export function AnimatedFeaturesSection() {
  const features = [
    {
      key: "forum",
      icon: MessageCircle,
      title: "Community Forum",
      description: "Connect with architects, designers, and enthusiasts. Share projects, get feedback, and discuss industry trends.",
      href: "/forum",
      buttonText: "Visit Forum"
    },
    {
      key: "projects", 
      icon: Box,
      title: "Project Portfolio",
      description: "Discover inspiring architectural projects across multiple categories, from residential to commercial and beyond.",
      href: "/projects",
      buttonText: "Browse Projects"
    },
    {
      key: "academic",
      icon: Lightbulb, 
      title: "Academic Hub",
      description: "Access research papers, student projects, and academic resources from universities worldwide.",
      href: "/academic",
      buttonText: "Explore Research"
    },
    {
      key: "news",
      icon: Newspaper,
      title: "Latest News", 
      description: "Stay updated with industry news, regulations, awards, and technological advancements in architecture.",
      href: "/news",
      buttonText: "Read News"
    },
    {
      key: "articles",
      icon: Users,
      title: "Expert Articles",
      description: "In-depth articles and insights from industry experts covering design theory, technology, and best practices.",
      href: "/articles", 
      buttonText: "Read Articles"
    },
    {
      key: "events",
      icon: Award,
      title: "Events & Conferences",
      description: "Discover conferences, workshops, exhibitions, and networking events in the architecture community.",
      href: "/events",
      buttonText: "View Events"
    }
  ]

  return (
    <section id="features" className="py-12 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <EnhancedScrollAnimation direction="up" delay={100} duration={800}>
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for Architecture
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From project showcases to professional networking, discover all the tools 
              and resources for architectural excellence.
            </p>
          </div>
        </EnhancedScrollAnimation>

        <StaggeredAnimation 
          staggerDelay={120} 
          direction="up"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.key} className="group hover:shadow-lg transition-all duration-300 border-0 bg-background/60 backdrop-blur">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="ghost" size="sm" asChild className="group p-0 h-auto">
                    <Link href={feature.href}>
                      {feature.buttonText}
                      <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </StaggeredAnimation>
      </div>
    </section>
  )
}