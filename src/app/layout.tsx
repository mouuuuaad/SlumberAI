import type { Metadata } from 'next';
import './globals.css'; // Root global styles
import { Tajawal } from 'next/font/google';

// Initialize Tajawal font for all text
const tajawal = Tajawal({
  variable: '--font-tajawal',
  subsets: ['arabic', 'latin'], // Include both Arabic and Latin subsets
  weight: ['400', '500', '700'], // Regular, Medium, and Bold
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SlumberAI - Optimize Your Sleep',
  description: 'Calculate optimal sleep times, get nap advice, and chat with an AI sleep assistant.',
  manifest: '/manifest.json',
  themeColor: '#D0B4DE', // Static light theme primary color (Soft Lavender)
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${tajawal.variable} font-tajawal antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}