import { Metadata } from 'next'
import CompetitionPageClient from './competition-page-client'

export const metadata: Metadata = {
  title: 'Archalley Competition 2025 | Christmas in Future',
  description: 'Join us for Archalley Competition 2025 with the theme "Christmas in Future". Showcase your architectural design and win exciting prizes.',
  keywords: 'archalley competition, architecture competition, christmas in future, design competition 2025, architectural design',
  openGraph: {
    title: 'Archalley Competition 2025 | Christmas in Future',
    url: 'https://www.archalley.com/competition',
    siteName: 'Archalley',
    images: [
      {
        url: 'https://www.archalley.com/archalley-logo.png',
        width: 1200,
        height: 630,
        alt: 'Archalley Competition 2025 - Christmas in Future',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Archalley Competition 2025 | Christmas in Future',
    images: ['https://www.archalley.com/archalley-logo.png'],
  },
}

export default function ArchalleyCompetition2025Page() {
  return <CompetitionPageClient />
}

