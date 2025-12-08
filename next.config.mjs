/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://www.youtube.com https://s.ytimg.com https://www.googletagmanager.com https://vercel.live https://www.payhere.lk https://sandbox.payhere.lk",
              "script-src-elem 'self' 'unsafe-inline' https://connect.facebook.net https://www.youtube.com https://s.ytimg.com https://www.googletagmanager.com https://vercel.live https://www.payhere.lk https://sandbox.payhere.lk",
              "style-src 'self' 'unsafe-inline' https://cdn.lineicons.com",
              "img-src 'self' data: https: https://sandbox.payhere.lk",
              "font-src 'self' data: https://cdn.lineicons.com",
              "frame-src 'self' https://www.youtube.com https://youtube.com https://www.facebook.com https://facebook.com https://web.facebook.com https://connect.facebook.net https://www.payhere.lk https://sandbox.payhere.lk",
              "child-src 'self' https://www.youtube.com https://youtube.com https://www.facebook.com https://facebook.com",
              "connect-src 'self' https://connect.facebook.net https://www.facebook.com",
              "media-src 'self' https://www.youtube.com https://youtube.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
  
  // Image optimization
  images: {
    domains: ['wp.archalley.com', 'archalley.com'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'archalley.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'wp.archalley.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      // Removed Supabase hostname - migrated to Azure PostgreSQL
      // {
      //   protocol: 'https',
      //   hostname: 'vnvpjdgzlsratzhmyiry.supabase.co',
      //   port: '',
      //   pathname: '/**',
      // },
      {
        protocol: 'https',
        hostname: '**.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'okxp5q9cgyoio1vt.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'vdatlalr25kbvq64.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'archalley.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'archalley.blob.core.windows.net',
        port: '',
        pathname: '/**',
      }
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 300, // 5 minutes cache for better performance
    dangerouslyAllowSVG: false,
    unoptimized: false,
  },
  
  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    optimizeServerReact: true,
    serverMinification: true,
    serverSourceMaps: false,
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false,
  },
  
  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Security: Disable eval in production
    if (!dev) {
      config.optimization.minimize = true
    }
    
    return config
  },
}

export default nextConfig