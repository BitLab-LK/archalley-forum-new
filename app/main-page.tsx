import ServerBlogCarousel from "@/components/server-blog-carousel"
import ServerProjectsSection from "@/components/server-projects-section"
import ServerArticlesSection from "@/components/server-articles-section"
import ServerNewsSection from "@/components/server-news-section"
import ServerTrendingSection from "@/components/server-trending-section"
import ServerInstagramSlider from "@/components/server-instagram-slider"
import AdBannerComponent from "@/components/ad-banner"
import { AdSessionManager } from "@/components/ad-session-manager"
import SidebarYouTube from "@/components/sidebar-youtube"
import SidebarFacebook from "@/components/sidebar-facebook"

export default function MainPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Ad Session Management */}
      <AdSessionManager />
      
      {/* Featured Blog Carousel - Hero Section */}
      <ServerBlogCarousel />

      {/* Main Content Layout - Grid with Sidebar */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Column (75%) */}
          <div className="w-full lg:w-3/4">
            {/* Projects Section */}
            <ServerProjectsSection />
            
            {/* Ad Banner between Projects and Articles */}
            <div className="my-8">
              <AdBannerComponent 
                size="680x180" 
                className="w-full rounded-lg overflow-hidden" 
                positionId="projects-articles-horizontal"
                autoRotate={true}
                rotationInterval={45}
                showLabel={false}
              />
            </div>
            
            {/* Articles Section */}
            <ServerArticlesSection />
          </div>

          {/* Sidebar Column (25%) */}
          <div className="w-full lg:w-1/4">
            {/* Ad Banner in sidebar */}
            <div className="mb-8">
              <AdBannerComponent 
                size="350x350" 
                className="w-full rounded-lg overflow-hidden" 
                positionId="sidebar-ad"
                autoRotate={true}
                rotationInterval={45}
                showLabel={false}
              />
            </div>
            
            {/* Trending Section */}
            <ServerTrendingSection />
          </div>
        </div>
      </div>

      {/* Horizontal Ad Banner */}
      <div className="container mx-auto px-4 py-8">
        <AdBannerComponent 
          size="970x180" 
          className="w-full rounded-lg overflow-hidden" 
          positionId="horizontal-ad-1"
          autoRotate={true}
          rotationInterval={60}
          showLabel={false}
        />
      </div>

      {/* News Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Column (75%) */}
          <div className="w-full lg:w-3/4">
            <ServerNewsSection />
          </div>

          {/* Sidebar Column (25%) */}
          <div className="w-full lg:w-1/4">
            <div className="space-y-8">
              {/* YouTube Section */}
              <SidebarYouTube />

              {/* Facebook Section */}
              <SidebarFacebook />
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Ad Banner */}
      <div className="container mx-auto px-4 py-8">
        <AdBannerComponent 
          size="970x180" 
          className="w-full rounded-lg overflow-hidden" 
          positionId="horizontal-ad-2"
          autoRotate={true}
          rotationInterval={60}
          showLabel={false}
        />
      </div>

      {/* Instagram Slider */}
      <ServerInstagramSlider />
    </main>
  )
}
