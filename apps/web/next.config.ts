import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typedRoutes: true,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore – nodeMiddleware is supported at runtime but missing from types in 15.5.x
  experimental: { nodeMiddleware: true },
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
