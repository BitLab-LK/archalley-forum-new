import ServerBlogCarousel from "@/components/server-blog-carousel"
import ServerProjectsSection from "@/components/server-projects-section"
import ServerArticlesSection from "@/components/server-articles-section"
import ServerNewsSection from "@/components/server-news-section"
import ServerInstagramSlider from "@/components/server-instagram-slider"
import AdBannerComponent from "@/components/ad-banner"
import { AdSessionManager } from "@/components/ad-session-manager"
import SiteLayout from "@/components/site-layout"
import { getAllPosts, getPostsByCategory, type WordPressPost } from "@/lib/wordpress-api"
import Image from "next/image"
import Link from "next/link"

export default async function MainPage() {
  // Fetch latest posts from multiple WordPress categories
  let latestPosts: WordPressPost[] = []
  let projectsPosts: WordPressPost[] = []
  let academicPosts: WordPressPost[] = []
  let newsPosts: WordPressPost[] = []
  let articlesPosts: WordPressPost[] = []

  try {
    // Fetch posts from multiple categories in parallel
    const [
      latestPostsResult,
      projectsPostsResult,
      academicPostsResult,
      newsPostsResult,
      articlesPostsResult
    ] = await Promise.allSettled([
      getAllPosts(1, 6), // Latest posts from all categories
      getPostsByCategory(33, 1, 6), // Projects category
      getPostsByCategory(58, 1, 6), // Academic category
      getPostsByCategory(42, 1, 6), // News category
      getPostsByCategory(41, 1, 6)  // Articles category
    ])

    // Extract results safely
    latestPosts = latestPostsResult.status === 'fulfilled' ? latestPostsResult.value : []
    projectsPosts = projectsPostsResult.status === 'fulfilled' ? projectsPostsResult.value : []
    academicPosts = academicPostsResult.status === 'fulfilled' ? academicPostsResult.value : []
    newsPosts = newsPostsResult.status === 'fulfilled' ? newsPostsResult.value : []
    articlesPosts = articlesPostsResult.status === 'fulfilled' ? articlesPostsResult.value : []

    console.log(`✅ Homepage: Fetched ${latestPosts.length} latest posts, ${projectsPosts.length} projects, ${academicPosts.length} academic, ${newsPosts.length} news, ${articlesPosts.length} articles`)
  } catch (error) {
    console.error('❌ Homepage: Error fetching WordPress posts:', error)
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Ad Session Management */}
      <AdSessionManager />
      
      {/* Featured Blog Carousel - Hero Section */}
      <ServerBlogCarousel />

      {/* Main Content Layout - Standardized with SiteLayout */}
      <SiteLayout>
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
      </SiteLayout>

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
      <SiteLayout showSidebar={false}>
        <ServerNewsSection />
      </SiteLayout>

      {/* Static Bottom Ad Banner */}
      <div className="container mx-auto px-4 py-8">
        <div className="w-full flex flex-col items-center">
          <Link 
            href="https://www.jaquar.lk/en/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block"
          >
            <div className="relative overflow-hidden" style={{ width: '970px', height: '180px', maxWidth: '100%' }}>
              <Image
                src="https://wp.archalley.com/wp-content/uploads/2025/02/Exel-Banner-970-x-180-footer-banner.webp"
                alt="Exel Advertisement"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 970px"
                priority={false}
              />
            </div>
          </Link>
          <div className="text-center mt-2 text-xs uppercase tracking-[0.35em] text-gray-500">ADVERTISEMENT</div>
        </div>
      </div>

      {/* Instagram Slider */}
      <ServerInstagramSlider />
    </main>
  )
}
