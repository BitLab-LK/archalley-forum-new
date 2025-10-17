import { Metadata } from 'next'
import { 
  getAllCategories,
  getPostsByCategory,
  type WordPressCategory,
  type WordPressPost
} from '@/lib/wordpress-api'
import ArticlesPageClient from './articles-page-client'

export const metadata: Metadata = {
  title: 'Architecture Articles | Archalley',
  description: 'Discover in-depth articles, research papers, and expert insights on architecture, design theory, and construction technology.',
}

export default async function ArticlesPage() {
  // Try to fetch articles from WordPress
  let initialArticles: WordPressPost[] = []
  let initialCategories: WordPressCategory[] = []
  
  try {
    // Fetch all categories first
    const categories = await getAllCategories()
    initialCategories = categories
    
    // Look for "articles" category (case insensitive)
    const articlesCategory = categories.find((cat: WordPressCategory) => 
      cat.slug.toLowerCase().includes('article') || 
      cat.name.toLowerCase().includes('article')
    )
    
    if (articlesCategory) {
      // Fetch articles from the articles category
      const articles = await getPostsByCategory(articlesCategory.id, 1, 20)
      initialArticles = articles
    }
  } catch (error) {
    console.error('Error fetching articles:', error)
  }

  return <ArticlesPageClient initialArticles={initialArticles} initialCategories={initialCategories} />
}