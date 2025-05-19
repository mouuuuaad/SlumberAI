import type { Metadata } from 'next';
import { Geist } from 'next/font/google'; // Using Geist Sans as primary
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import ThemeProvider from '@/components/ThemeProvider'; // Renamed for clarity and to house the logic

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SlumberAI - Optimize Your Sleep',
  description: 'Calculate optimal sleep times, get nap advice, and chat with an AI sleep assistant.',
  manifest: '/manifest.json', // Added manifest link to metadata
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#D0B4DE" /> {/* Corresponds to primary color */}
        {/* The manifest link is now handled by Next.js metadata object above */}
      </head>
      <body className={`${geistSans.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
