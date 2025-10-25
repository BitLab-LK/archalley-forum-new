import { Metadata } from 'next'
import { 
  getAllCategories,
  getArticlesPosts
} from '@/lib/wordpress-api'
import ArticlesPageClient from './articles-page-client'

// Force dynamic rendering to avoid build timeouts
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Architecture Articles | Archalley',
  description: 'Discover in-depth articles, research papers, and expert insights on architecture, design theory, and construction technology.',
}

export default async function ArticlesPage() {
  try {
    // Fetch articles from category ID 41
    const articles = await getArticlesPosts(1, 20)
    const categories = await getAllCategories()
    
    console.log(`✅ Articles page: Fetched ${articles.length} articles from WordPress`)
    return <ArticlesPageClient initialArticles={articles} initialCategories={categories} />
  } catch (error) {
    console.error('❌ Articles page: Error fetching articles:', error)
    // Fall back to client-side fetching
    return <ArticlesPageClient />
  }
}