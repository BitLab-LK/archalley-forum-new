import { Metadata } from 'next'
import { getResidentialProjects } from '@/lib/wordpress-api'
import ResidentialProjectsClient from './residential-projects-client'

export const metadata: Metadata = {
  title: 'Residential Architecture | Archalley',
  description: 'Explore our residential architecture projects including houses, villas, apartments, and residential buildings.',
  keywords: 'residential architecture, house design, villa design, apartment design, residential building, home architecture',
}

export default async function ResidentialProjectsPage() {
  // Fetch residential architecture projects from WordPress
  const projects = await getResidentialProjects(1, 100) // Fetch more for better client-side filtering
  
  return <ResidentialProjectsClient initialProjects={projects} />
}
