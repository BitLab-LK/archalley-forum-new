import { Metadata } from 'next'
import CategoryListing from '@/components/category-listing'

export const metadata: Metadata = {
  title: 'Student Projects | Archalley',
  description: 'Explore student projects, coursework, academic portfolios, and creative work from our architecture and design students.',
  keywords: 'student projects, architecture students, design portfolio, coursework, thesis projects, academic work, capstone projects',
}

export default async function StudentProjectsPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const pageParam = typeof searchParams?.page === 'string' ? searchParams?.page : Array.isArray(searchParams?.page) ? searchParams?.page[0] : null
  return <CategoryListing categoryId={59} title="Student Projects" basePath="/academic/student-projects" pageParam={pageParam} />
}
