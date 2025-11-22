// Social Media Configuration Constants
export const SOCIAL_MEDIA = {
  facebook: "https://www.facebook.com/archalley/",
  youtube: {
    channelUrl: "https://www.youtube.com/channel/UCfN-mp1PZ63YQ5BB11RJ-eg",
    latestVideoId: "D0A-MIeq9gw", // Specific video as per requirements
    embedUrl: "https://www.youtube.com/embed/D0A-MIeq9gw"
  },
  instagram: "https://www.instagram.com/archalley_insta/",
  twitter: "https://x.com/archalley",
  linkedin: "https://www.linkedin.com/company/archalleypage/",
  tiktok: "https://www.tiktok.com/@archalley.com",
  pinterest: "https://www.pinterest.com/archalleypins"
}

// Facebook App ID for SDK - Use environment variable if available
export const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "1075191320881967" // Default to Archalley Facebook App ID

// YouTube API Key (replace with actual API key if needed)
export const YOUTUBE_API_KEY = "your_youtube_api_key"