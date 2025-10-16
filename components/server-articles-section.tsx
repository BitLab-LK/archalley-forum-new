import { getAllCategories, getPostsByCategory, type WordPressPost } from "@/lib/wordpress-api"
import ArticlesSection from "@/components/articles-section"

export default async function ServerArticlesSection() {
  try {
    // Fetch categories to find the articles category ID
    const categories = await getAllCategories()
    const articlesCategoryId = categories.find((cat) => cat.slug === "articles")?.id || 0
    
    let articles: WordPressPost[] = []
    if (articlesCategoryId > 0) {
      // Fetch article posts
      articles = await getPostsByCategory(articlesCategoryId, 1, 6)
    }
    
    return <ArticlesSection initialArticles={articles} initialCategories={categories} />
  } catch (error) {
    console.error('Failed to fetch articles on server:', error)
    // Fall back to client-side fetching
    return <ArticlesSection />
  }
}