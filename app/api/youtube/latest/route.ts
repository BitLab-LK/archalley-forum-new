import { NextResponse } from 'next/server'

/**
 * API endpoint to fetch the latest video from @archalleytube YouTube channel
 * Uses YouTube RSS feed to get the latest video without requiring API keys
 */
export async function GET() {
  try {
    // YouTube RSS feed URL for channel handle @archalleytube
    // Format: https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
    // First, try to get channel ID from the handle
    const channelHandle = '@archalleytube'
    
    // Try multiple RSS feed formats
    const rssUrls = [
      `https://www.youtube.com/feeds/videos.xml?channel_id=UC${channelHandle.replace('@', '')}`,
      `https://www.youtube.com/feeds/videos.xml?user=${channelHandle.replace('@', '')}`,
    ]
    
    let rssText = ''
    let lastError: Error | null = null
    
    for (const rssUrl of rssUrls) {
      try {
        const response = await fetch(rssUrl, {
          next: { revalidate: 3600 }, // Cache for 1 hour
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        })
        
        if (response.ok) {
          rssText = await response.text()
          if (rssText && rssText.includes('<entry>')) {
            break
          }
        }
      } catch (error) {
        lastError = error as Error
        continue
      }
    }
    
    if (!rssText || !rssText.includes('<entry>')) {
      throw lastError || new Error('Failed to fetch RSS feed')
    }

    // Parse XML using regex (simple approach for server-side)
    // Get the first entry (latest video)
    const entryMatch = rssText.match(/<entry>([\s\S]*?)<\/entry>/)
    if (!entryMatch) {
      throw new Error('No entry found in RSS feed')
    }
    
    const entry = entryMatch[1]
    const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)
    const titleMatch = entry.match(/<title>([^<]+)<\/title>/)

    const videoId = videoIdMatch?.[1] || 'D0A-MIeq9gw'
    const title = titleMatch?.[1] || 'Latest Video from ArchAlley'
    const channelUrl = 'https://www.youtube.com/@archalleytube'

    return NextResponse.json({
      videoId,
      title,
      channelUrl,
    })
  } catch (error) {
    console.error('Error fetching latest YouTube video:', error)
    
    // Return a fallback video ID if RSS fails
    // This ensures the sidebar always shows something
    return NextResponse.json({
      videoId: 'D0A-MIeq9gw', // Fallback to a known video
      title: 'Latest Video from ArchAlley',
      channelUrl: 'https://www.youtube.com/@archalleytube',
      error: 'Failed to fetch latest video, showing fallback',
    })
  }
}

