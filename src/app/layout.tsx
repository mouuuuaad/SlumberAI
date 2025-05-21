import type { Metadata } from 'next';
import './globals.css'; // Root global styles
import { Geist } from 'next/font/google'; // Import Geist font
import { Tajawal } from 'next/font/google'; // Import Tajawal font

// Initialize Geist Sans font
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

// Initialize Tajawal font for Arabic
const tajawal = Tajawal({
  variable: '--font-tajawal',
  subsets: ['arabic'],
  weight: ['400', '700'], // Specify weights you intend to use
});

export const metadata: Metadata = {
  title: 'SlumberAI - Optimize Your Sleep',
  description: 'Calculate optimal sleep times, get nap advice, and chat with an AI sleep assistant.',
  manifest: '/manifest.json',
  themeColor: 'hsl(var(--primary))', // Updated to use HSL variable
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Next.js with next-intl will handle the `lang` and `dir` attributes on <html>
  // based on the active locale.
  return (
    <html suppressHydrationWarning>
      <body 
        className={`${geistSans.variable} ${tajawal.variable} font-sans antialiased`} 
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
