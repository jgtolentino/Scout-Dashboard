import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AnalyticsProvider } from '@/lib/monitoring/vercel-analytics';
import { Providers } from './providers';
import { headers } from 'next/headers';
import { ErrorBoundary } from '@/components/error-boundaries/ErrorBoundary';
import { SentryErrorBoundary } from '@/components/monitoring/SentryErrorBoundary';
import { FontLoadingStrategy, FONT_CONFIGS } from '@/lib/utils/font-optimization';

// Optimized font loading with performance enhancements
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  preload: true,
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'system-ui',
    'sans-serif'
  ],
  adjustFontFallback: true,
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Scout Dashboard v5.0',
  description: 'Enterprise Data Platform with Medallion Architecture',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Scout Dashboard v5.0',
    description: 'Enterprise Data Platform with Medallion Architecture',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  // Font optimization metadata
  other: {
    'font-display': 'swap',
  },
};

// Generate CSP nonce for each request
async function generateNonce() {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  return nonce;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = await generateNonce();
  const headersList = headers();
  
  // Security headers (also set in middleware for edge runtime)
  const securityHeaders = {
    'Content-Security-Policy': `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' https://vercel.live https://*.vercel-scripts.com https://fonts.googleapis.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https: blob:;
      font-src 'self' data: https://fonts.gstatic.com;
      connect-src 'self' https://*.supabase.co https://*.sentry.io https://vercel.live wss://ws-us3.pusher.com;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s+/g, ' ').trim(),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  };

  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <head>
        {/* Inject CSP nonce */}
        <meta property="csp-nonce" content={nonce} />
        
        {/* Font optimization: Preconnect to critical domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          as="style"
          onLoad="this.onload=null;this.rel='stylesheet'"
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          />
        </noscript>
        
        {/* Supabase preconnect if configured */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        )}
        
        {/* Sentry preconnect if configured */}
        {process.env.NEXT_PUBLIC_SENTRY_DSN && (
          <link rel="preconnect" href="https://sentry.io" />
        )}
        
        {/* Resource hints for performance */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        
        {/* Font loading optimization script */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              // Font loading performance optimization
              (function() {
                if ('fonts' in document && 'loading' in HTMLLinkElement.prototype) {
                  // Browser supports font loading API
                  var fontTimer = setTimeout(function() {
                    document.documentElement.classList.add('fonts-timeout');
                  }, 3000);
                  
                  document.fonts.ready.then(function() {
                    clearTimeout(fontTimer);
                    document.documentElement.classList.add('fonts-loaded');
                  });
                } else {
                  // Fallback for older browsers
                  document.documentElement.classList.add('fonts-loaded');
                }
                
                // Font display fallback
                if (!('fontDisplay' in document.createElement('style').style)) {
                  document.documentElement.classList.add('no-font-display');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <SentryErrorBoundary
          level="error"
          showDialog={process.env.NODE_ENV === 'production'}
          beforeCapture={(error, errorInfo) => {
            console.error('React Error Boundary (Sentry):', error, errorInfo);
          }}
        >
          <ErrorBoundary>
            <AnalyticsProvider>
              <Providers>
                {children}
              </Providers>
            </AnalyticsProvider>
          </ErrorBoundary>
        </SentryErrorBoundary>
        
        {/* Vercel Analytics Script with optimized loading */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              window.va = window.va || function () { 
                (window.vaq = window.vaq || []).push(arguments); 
              };
              
              // Load analytics after fonts are ready
              if ('fonts' in document) {
                document.fonts.ready.then(function() {
                  // Analytics initialization
                  if (typeof window !== 'undefined' && window.va) {
                    window.va('pageview');
                  }
                });
              }
            `,
          }}
        />
        
        {/* Font loading strategy initialization */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              // Initialize font loading strategy
              (function() {
                if (typeof window !== 'undefined') {
                  window.__fontLoadingStrategy = {
                    loaded: [],
                    failed: [],
                    startTime: Date.now()
                  };
                  
                  // Monitor font loading performance
                  if ('PerformanceObserver' in window) {
                    try {
                      var observer = new PerformanceObserver(function(list) {
                        list.getEntries().forEach(function(entry) {
                          if (entry.entryType === 'resource' && entry.name.includes('fonts.googleapis.com')) {
                            window.__fontLoadingStrategy.loaded.push({
                              name: entry.name,
                              duration: entry.duration,
                              transferSize: entry.transferSize
                            });
                          }
                        });
                      });
                      observer.observe({entryTypes: ['resource']});
                    } catch (e) {
                      // PerformanceObserver not supported
                    }
                  }
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}