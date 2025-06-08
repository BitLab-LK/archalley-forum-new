/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config ...
  
  // Ensure UTF-8 encoding
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/html; charset=utf-8',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig 