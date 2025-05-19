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
  manifest: '/manifest.json',
  themeColor: '#D0B4DE', // Moved theme-color here
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Removed manual <head> block here. Next.js will generate it based on metadata. */}
      <body className={`${geistSans.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
