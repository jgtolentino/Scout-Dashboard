import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TBWA Analytics Dashboard',
  description: 'Enterprise analytics for HRIS, Expense Management, and Ticketing',
  keywords: ['analytics', 'dashboard', 'HRIS', 'expense', 'ticketing'],
  authors: [{ name: 'TBWA Digital' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFD700' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#000',
                color: '#fff',
                borderRadius: '8px',
                border: '1px solid #FFD700',
              },
              success: {
                iconTheme: {
                  primary: '#FFD700',
                  secondary: '#000',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}