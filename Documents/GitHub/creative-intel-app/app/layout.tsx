import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Creative Intelligence App',
  description: 'AI-powered creative asset analysis and insights',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <div className="container mx-auto p-4">
          {children}
        </div>
      </body>
    </html>
  )
}