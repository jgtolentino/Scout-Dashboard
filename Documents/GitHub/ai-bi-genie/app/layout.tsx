import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-ces' })

export const metadata: Metadata = {
  title: 'Ask CES - Centralized Enterprise System',
  description: 'Central Intelligence for Enterprise Success - AI-powered business insights through natural language',
  keywords: 'ask ces, centralized enterprise system, business intelligence, ai insights, natural language queries',
  authors: [{ name: 'TBWA', url: 'https://tbwa.com' }],
  openGraph: {
    title: 'Ask CES - Centralized Enterprise System',
    description: 'Central Intelligence for Enterprise Success',
    type: 'website',
    locale: 'en_US',
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎯</text></svg>" />
        <meta name="theme-color" content="#0052cc" />
      </head>
      <body className="font-ces antialiased bg-gray-50 text-gray-900">
        <div id="ces-root" className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}