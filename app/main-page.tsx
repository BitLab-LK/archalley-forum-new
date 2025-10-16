import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ServerBlogCarousel from "@/components/server-blog-carousel"
import ServerProjectsSection from "@/components/server-projects-section"
import ServerArticlesSection from "@/components/server-articles-section"
import ServerNewsSection from "@/components/server-news-section"
import ServerHorizontalTrendingSection from "@/components/server-horizontal-trending-section"
import SocialMediaSection from "@/components/social-media-section"
import ServerInstagramSlider from "@/components/server-instagram-slider"
import { AnimatedContentWrapper, AnimatedFeaturesSection } from "@/components/animated-wrappers"
import { SquareAd } from "@/components/ad-banner"
import { 
  MessageCircle, 
  Navigation
} from "lucide-react"

export default function MainPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-32 md:py-40 lg:py-48">
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
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Join Our Forum
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#features">
                  <Navigation className="mr-2 h-5 w-5" />
                  Explore Features
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Horizontal Trending Section */}
      <ServerHorizontalTrendingSection />

      {/* Main Content Layout - Full width sections with animations */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-12">
          {/* Featured Blog Carousel - Full width */}
          <AnimatedContentWrapper direction="up" delay={100}>
            <ServerBlogCarousel />
          </AnimatedContentWrapper>

          {/* Projects Section - Full width */}
          <AnimatedContentWrapper direction="up" delay={200}>
            <ServerProjectsSection />
          </AnimatedContentWrapper>

          {/* Articles Section - Full width */}
          <AnimatedContentWrapper direction="up" delay={300}>
            <ServerArticlesSection />
          </AnimatedContentWrapper>

          {/* News Section - Full width */}
          <AnimatedContentWrapper direction="up" delay={400}>
            <ServerNewsSection />
          </AnimatedContentWrapper>

          {/* Sidebar Ad - Centered below content */}
          <AnimatedContentWrapper direction="fade" delay={500}>
            <div className="flex justify-center pt-4">
              <SquareAd />
            </div>
          </AnimatedContentWrapper>
        </div>
      </div>

      {/* Features Section - Moved after main content for better flow */}
      <AnimatedFeaturesSection />

      {/* CTA Section - Simplified */}
      <section className="py-12 bg-gradient-to-r from-primary/5 to-secondary/5">
        <AnimatedContentWrapper direction="up" delay={200}>
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
        </AnimatedContentWrapper>
      </section>

      {/* Footer Content - Social & Instagram combined */}
      <div className="bg-muted/50">
        <SocialMediaSection />
        <ServerInstagramSlider />
      </div>
    </div>
  )
}
