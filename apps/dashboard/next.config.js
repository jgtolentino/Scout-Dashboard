/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@tbwa/ui', '@tbwa/lib'],
  images: {
    domains: ['localhost', 'supabase.co'],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig