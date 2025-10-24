import { Metadata } from 'next'
import { getResearchPosts } from '@/lib/wordpress-api'
import ResearchClient from './research-client'

export const metadata: Metadata = {
  title: 'Research & Publications | Archalley',
  description: 'Explore our academic research, publications, papers, and studies in architecture and design.',
  keywords: 'research, academic publications, architecture research, design papers, studies, thesis, journal articles',
}

export default async function ResearchPage() {
  // Fetch research posts from WordPress
  const posts = await getResearchPosts(1, 100) // Fetch more for better client-side filtering
  
  return <ResearchClient initialProjects={posts} />
}
