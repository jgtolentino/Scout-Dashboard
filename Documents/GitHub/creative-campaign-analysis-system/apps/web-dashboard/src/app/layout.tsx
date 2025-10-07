import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'TBWA Creative Campaign Analysis',
    template: '%s | TBWA CES',
  },
  description: 'Advanced semantic indexing and analysis system for creative campaigns',
  keywords: ['TBWA', 'creative', 'campaign', 'analysis', 'AI', 'semantic', 'search'],
  authors: [{ name: 'TBWA Philippines' }],
  creator: 'TBWA Philippines',
  publisher: 'TBWA Philippines',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    title: 'TBWA Creative Campaign Analysis',
    description: 'Advanced semantic indexing and analysis system for creative campaigns',
    siteName: 'TBWA CES',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TBWA Creative Campaign Analysis',
    description: 'Advanced semantic indexing and analysis system for creative campaigns',
    creator: '@tbwa',
  },
  robots: {
    index: process.env.NODE_ENV === 'production',
    follow: process.env.NODE_ENV === 'production',
    googleBot: {
      index: process.env.NODE_ENV === 'production',
      follow: process.env.NODE_ENV === 'production',
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div id="root" className="min-h-screen bg-background font-sans antialiased">
          {children}
        </div>
      </body>
    </html>
  );
}