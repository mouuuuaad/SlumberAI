import type { Metadata } from 'next';
import './globals.css'; // Root global styles
import { Geist } from 'next/font/google'; // Import Geist font

// Initialize Geist Sans font
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SlumberAI', // Generic title, can be overridden by locale-specific layouts
  description: 'Your personal sleep companion, available in multiple languages.',
  manifest: '/manifest.json',
  // themeColor can be set here if static, or in [locale]/layout.tsx via viewport export
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
        className={`${geistSans.variable} font-sans antialiased`} 
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
