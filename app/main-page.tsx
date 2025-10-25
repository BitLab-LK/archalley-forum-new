import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ServerBlogCarousel from "@/components/server-blog-carousel"
import ServerProjectsSection from "@/components/server-projects-section"
import ServerArticlesSection from "@/components/server-articles-section"
import ServerNewsSection from "@/components/server-news-section"
import ServerHorizontalTrendingSection from "@/components/server-horizontal-trending-section"
import ServerInstagramSlider from "@/components/server-instagram-slider"
import { AnimatedContentWrapper, AnimatedFeaturesSection } from "@/components/animated-wrappers"
import AdBannerComponent from "@/components/ad-banner"
import { AdSessionManager } from "@/components/ad-session-manager"
import SidebarYouTube from "@/components/sidebar-youtube"
import SidebarFacebook from "@/components/sidebar-facebook"
import ArchAlleySidebar from "@/components/archalley-sidebar"
import { 
  MessageCircle, 
  Navigation
} from "lucide-react"

export default function MainPage() {
  return (
    <div className="min-h-screen">
      {/* Ad Session Management */}
      <AdSessionManager />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-32 md:py-40 lg:py-48">
        <div className="container mx-auto px-4">
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

      {/* Main Content Layout - Grid with Sidebar */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Column (75%) */}
          <div className="w-full lg:w-3/4 space-y-16">
            {/* Featured Blog Carousel */}
            <AnimatedContentWrapper direction="up" delay={100}>
              <ServerBlogCarousel />
            </AnimatedContentWrapper>

            {/* Projects Section */}
            <AnimatedContentWrapper direction="up" delay={200}>
              <ServerProjectsSection />
            </AnimatedContentWrapper>

      {/* Horizontal Ad - Between Projects and Articles */}
      <AnimatedContentWrapper direction="fade" delay={250}>
        <div className="container mx-auto px-4 py-8">
          {/* Clean horizontal ad container - no labels */}
          <div className="bg-gradient-to-r from-gray-50/30 via-white/50 to-gray-50/30 dark:from-gray-900/30 dark:via-gray-800/20 dark:to-gray-900/30 rounded-lg p-4 shadow-sm border border-gray-100/50 dark:border-gray-800/50">
            <div className="flex justify-center">
              <div className="w-full max-w-4xl">
                <AdBannerComponent 
                  size="970x180" 
                  className="w-full rounded-lg overflow-hidden" 
                  positionId="projects-articles-horizontal"
                  autoRotate={true}
                  rotationInterval={45}
                  showLabel={false}
                />
              </div>
            </div>
          </div>
          
          {/* Mobile version */}
          <div className="lg:hidden mt-4">
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                <AdBannerComponent 
                  size="350x350" 
                  className="w-full rounded-lg overflow-hidden" 
                  positionId="projects-articles-mobile"
                  autoRotate={true}
                  rotationInterval={45}
                  showLabel={false}
                />
              </div>
            </div>
          </div>
        </div>
      </AnimatedContentWrapper>

            {/* Articles Section */}
            <AnimatedContentWrapper direction="up" delay={300}>
              <ServerArticlesSection />
            </AnimatedContentWrapper>

      {/* Horizontal Ad - Between Articles and News */}
      <AnimatedContentWrapper direction="fade" delay={350}>
        <div className="container mx-auto px-4 py-8">
          {/* Clean horizontal ad container - no labels */}
          <div className="bg-gradient-to-r from-gray-50/30 via-white/50 to-gray-50/30 dark:from-gray-900/30 dark:via-gray-800/20 dark:to-gray-900/30 rounded-lg p-4 shadow-sm border border-gray-100/50 dark:border-gray-800/50">
            <div className="flex justify-center">
              <div className="w-full max-w-4xl">
                <AdBannerComponent 
                  size="970x180" 
                  className="w-full rounded-lg overflow-hidden" 
                  positionId="articles-news-horizontal"
                  autoRotate={true}
                  rotationInterval={45}
                  showLabel={false}
                />
              </div>
            </div>
          </div>
          
          {/* Mobile version */}
          <div className="lg:hidden mt-4">
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                <AdBannerComponent 
                  size="350x350" 
                  className="w-full rounded-lg overflow-hidden" 
                  positionId="articles-news-mobile"
                  autoRotate={true}
                  rotationInterval={45}
                  showLabel={false}
                />
              </div>
            </div>
          </div>
        </div>
      </AnimatedContentWrapper>

            {/* News Section */}
            <AnimatedContentWrapper direction="up" delay={400}>
              <ServerNewsSection />
            </AnimatedContentWrapper>
          </div>

          {/* Sidebar Column (25%) */}
          <div className="w-full lg:w-1/4">
            <div className="sticky top-8 space-y-8">
              {/* ArchAlley Style Sidebar */}
              <ArchAlleySidebar />

              {/* Additional sidebar content can go here */}
              <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg p-6">
                <h3 className="font-semibold mb-3">Join Our Community</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect with architects and designers worldwide
                </p>
                <Button size="sm" className="w-full" asChild>
                  <Link href="/forum">Join Forum</Link>
                </Button>
              </div>

              {/* YouTube Section */}
              <AnimatedContentWrapper direction="up" delay={200}>
                <SidebarYouTube />
              </AnimatedContentWrapper>

              {/* Facebook Section */}
              <AnimatedContentWrapper direction="up" delay={250}>
                <SidebarFacebook />
              </AnimatedContentWrapper>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Ad - Above Features Section */}
      <section className="py-8 bg-gradient-to-r from-gray-50/30 via-white/50 to-gray-50/30 dark:from-gray-900/30 dark:via-gray-800/20 dark:to-gray-900/30">
        <AnimatedContentWrapper direction="fade" delay={100}>
          <div className="container mx-auto px-4">
            <div className="flex justify-center">
              <div className="w-full max-w-5xl">
                <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 shadow-sm border border-gray-100/50 dark:border-gray-700/50 backdrop-blur-sm">
                  <AdBannerComponent 
                    size="970x180" 
                    className="w-full rounded-lg overflow-hidden" 
                    positionId="pre-features-leaderboard"
                    autoRotate={true}
                    rotationInterval={60}
                    showLabel={false}
                  />
                </div>
              </div>
            </div>
            
            {/* Mobile version */}
            <div className="lg:hidden mt-4">
              <div className="flex justify-center">
                <div className="w-full max-w-sm">
                  <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3 shadow-sm border border-gray-100/50 dark:border-gray-700/50 backdrop-blur-sm">
                    <AdBannerComponent 
                      size="320x320" 
                      className="w-full rounded-lg overflow-hidden" 
                      positionId="pre-features-mobile"
                      autoRotate={true}
                      rotationInterval={60}
                      showLabel={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedContentWrapper>
      </section>

      {/* Features Section - Moved after main content for better flow */}
      <AnimatedFeaturesSection />

      {/* CTA Section - Simplified */}
      <section className="py-12 bg-gradient-to-r from-primary/5 to-secondary/5">
        <AnimatedContentWrapper direction="up" delay={200}>
          <div className="container mx-auto text-center px-4">
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

      {/* Footer Content - Instagram */}
      <div className="bg-muted/50">
        <ServerInstagramSlider />
      </div>
    </div>
  )
}
