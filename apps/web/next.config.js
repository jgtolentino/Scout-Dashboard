/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  
  // Security headers (also set in middleware)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  },
  
  // Rewrites for API versioning
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // Sentry configuration
  sentry: {
    hideSourceMaps: true,
    widenClientFileUpload: true,
  },
  
  // Image optimization configuration
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      // Add allowed external image domains here
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Font optimization
  optimizeFonts: true,
  
  // Webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Add Sentry plugin
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Image optimization
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            images: {
              name: 'images',
              test: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
              chunks: 'all',
              enforce: true,
            },
            fonts: {
              name: 'fonts',
              test: /\.(woff|woff2|eot|ttf|otf)$/i,
              chunks: 'all',
              enforce: true,
            },
            // Scout v7 specific bundles
            scoutWidgets: {
              name: 'scout-widgets',
              test: /[\\/]components[\\/]widgets[\\/]/,
              chunks: 'all',
              priority: 30,
              enforce: true,
            },
            scoutCharts: {
              name: 'scout-charts',
              test: /[\\/]components[\\/]charts[\\/]/,
              chunks: 'all',
              priority: 25,
              enforce: true,
            },
            scoutCore: {
              name: 'scout-core',
              test: /[\\/](hooks|lib|types)[\\/].*scout.*\.(ts|tsx|js|jsx)$/,
              chunks: 'all',
              priority: 20,
              enforce: true,
            },
          },
        },
      };
    }
    
    return config;
  },
};

// Sentry configuration wrapper
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  hideSourceMaps: true,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring/tunnel",
  disableLogger: true,
};

// Export with Sentry if configured, otherwise export plain config
module.exports = process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;