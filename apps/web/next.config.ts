import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    nodeMiddleware: true,
  },
  images: {
    remotePatterns: [
      {
        // Supabase Storage CDN — allow all project subdomain patterns
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
