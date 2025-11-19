import { Metadata } from 'next'
import CompetitionPageClient from './competition-page-client'

export const metadata: Metadata = {
  title: 'Archalley Competition 2025 | Christmas in Future',
  description: 'Join us for Archalley Competition 2025 with the theme "Christmas in Future"',
}

export default function ArchalleyCompetition2025Page() {
  return <CompetitionPageClient />
}

