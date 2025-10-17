import { Metadata } from 'next'
import { 
  getAllCategories,
  getPostsByCategory,
  type WordPressCategory,
  type WordPressPost
} from '@/lib/wordpress-api'
import EventsPageClient from './events-page-client'

export const metadata: Metadata = {
  title: 'Architecture Events | Archalley',
  description: 'Discover conferences, workshops, exhibitions, and networking events in the architecture and design community.',
}

export default async function EventsPage() {
  // Try to fetch events from WordPress
  let initialEvents: WordPressPost[] = []
  let initialCategories: WordPressCategory[] = []
  
  try {
    // Fetch all categories first
    const categories = await getAllCategories()
    initialCategories = categories
    
    // Look for "events" category (case insensitive)
    const eventsCategory = categories.find((cat: WordPressCategory) => 
      cat.slug.toLowerCase().includes('event') || 
      cat.name.toLowerCase().includes('event')
    )
    
    if (eventsCategory) {
      // Fetch events from the events category
      const events = await getPostsByCategory(eventsCategory.id, 1, 20)
      initialEvents = events
    }
  } catch (error) {
    console.error('Error fetching events:', error)
  }

  return <EventsPageClient initialEvents={initialEvents} initialCategories={initialCategories} />
}