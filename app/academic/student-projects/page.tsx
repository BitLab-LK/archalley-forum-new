import { Metadata } from 'next'
import { getStudentProjects } from '@/lib/wordpress-api'
import StudentProjectsClient from './student-projects-client'

export const metadata: Metadata = {
  title: 'Student Projects | Archalley',
  description: 'Explore student projects, coursework, academic portfolios, and creative work from our architecture and design students.',
  keywords: 'student projects, architecture students, design portfolio, coursework, thesis projects, academic work, capstone projects',
}

export default async function StudentProjectsPage() {
  // Fetch student projects from WordPress
  const posts = await getStudentProjects(1, 100) // Fetch more for better client-side filtering
  
  return <StudentProjectsClient initialProjects={posts} />
}
