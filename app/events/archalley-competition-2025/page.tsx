import { Metadata } from 'next'
import CompetitionPageClient from './competition-page-client'

export const metadata: Metadata = {
  title: 'Archalley Competition 2025 | Christmas in Future',
  keywords: 'archalley competition, architecture competition, christmas in future, design competition 2025, architectural design',
  openGraph: {
    title: 'Archalley Competition 2025 | Christmas in Future',
    url: 'https://www.archalley.com/events/archalley-competition-2025',
    siteName: 'Archalley',
    images: [
      {
        url: 'https://www.archalley.com/archalley-pro-pic.png',
        width: 801,
        height: 801,
        alt: 'Archalley Competition 2025 - Christmas in Future',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Archalley Competition 2025 | Christmas in Future',
    images: ['https://www.archalley.com/archalley-pro-pic.png'],
  },
}

export default function ArchalleyCompetition2025Page() {
  return <CompetitionPageClient />
}

