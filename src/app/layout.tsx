
import type { Metadata } from 'next';
import './globals.css'; // Root global styles
// Removed Geist_Sans import
import { Tajawal } from 'next/font/google';
import { Montserrat, Roboto } from 'next/font/google';

// Initialize Tajawal font for Arabic
const tajawal = Tajawal({
  variable: '--font-tajawal',
  subsets: ['arabic'],
  weight: ['400', '700'],
});

// Initialize Roboto font for English/French body
const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

// Initialize Montserrat font for English/French headings
const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SlumberAI - Optimize Your Sleep',
  description: 'Calculate optimal sleep times, get nap advice, and chat with an AI sleep assistant.',
  manifest: '/manifest.json',
  themeColor: 'hsl(var(--primary))',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${tajawal.variable} ${roboto.variable} ${montserrat.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
