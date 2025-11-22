import { NextResponse } from 'next/server'

/**
 * API endpoint to fetch the latest video from YouTube channel
 * Uses YouTube RSS feed to get the latest video without requiring API keys
 */
export async function GET() {
  try {
    // YouTube channel ID: UCfN-mp1PZ63YQ5BB11RJ-eg
    // Channel URL: https://www.youtube.com/channel/UCfN-mp1PZ63YQ5BB11RJ-eg
    const channelId = 'UCfN-mp1PZ63YQ5BB11RJ-eg'
    const channelUrl = 'https://www.youtube.com/channel/UCfN-mp1PZ63YQ5BB11RJ-eg'
    
    // YouTube RSS feed URL format: https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    
    const response = await fetch(rssUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`)
    }
    
    const rssText = await response.text()
    
    if (!rssText || !rssText.includes('<entry>')) {
      throw new Error('RSS feed does not contain video entries')
    }

    // Parse XML to get all entries
    // YouTube RSS feed structure: <entry> contains <yt:videoId>, <title>, and <link>
    // We need to filter out Shorts (which have /shorts/ in the link) and get the latest regular video
    const entryMatches = rssText.matchAll(/<entry>([\s\S]*?)<\/entry>/g)
    
    let latestVideo: { videoId: string; title: string; videoUrl: string } | null = null
    
    // Iterate through all entries to find the first regular video (not a Short)
    for (const entryMatch of entryMatches) {
      const entry = entryMatch[1]
      
      // Extract link to check if it's a Short
      // Match any link tag with href attribute (more flexible)
      const linkMatch = entry.match(/<link[^>]*href="([^"]+)"[^>]*>/)
      const linkUrl = linkMatch?.[1] || ''
      
      // Skip Shorts - they have /shorts/ in the URL
      if (linkUrl.includes('/shorts/')) {
        continue
      }
      
      // This is a regular video, extract its details
      const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)
      const titleMatch = entry.match(/<title>([^<]+)<\/title>/)
      
      const videoId = videoIdMatch?.[1]
      const title = titleMatch?.[1] || 'Latest Video from ArchAlley'
      
      if (videoId) {
        latestVideo = {
          videoId,
          title,
          videoUrl: linkUrl || `https://www.youtube.com/watch?v=${videoId}`,
        }
        break // Found the latest regular video, stop searching
      }
    }
    
    if (!latestVideo) {
      throw new Error('No regular video found in RSS feed (only Shorts available)')
    }
    
    const { videoId, title, videoUrl } = latestVideo

    return NextResponse.json({
      videoId,
      title,
      channelUrl,
      videoUrl,
    })
  } catch (error) {
    console.error('Error fetching latest YouTube video:', error)
    
    // Return a fallback video ID if RSS fails
    // This ensures the sidebar always shows something
    return NextResponse.json({
      videoId: 'D0A-MIeq9gw', // Fallback to a known video
      title: 'Latest Video from ArchAlley',
      channelUrl: 'https://www.youtube.com/channel/UCfN-mp1PZ63YQ5BB11RJ-eg',
      error: error instanceof Error ? error.message : 'Failed to fetch latest video, showing fallback',
    }, { status: 200 }) // Return 200 so the frontend doesn't treat it as an error
  }
}

