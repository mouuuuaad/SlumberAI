import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import '../globals.css'; // Adjusted path for globals.css
import { Toaster } from '@/components/ui/toaster';
import ThemeProvider from '@/components/ThemeProvider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server'; // Import getLocale

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

// Dynamic metadata based on locale can be generated here
export async function generateMetadata({params: {locale}}: {params: {locale: string}}): Promise<Metadata> {
  // Optionally, load translated metadata
  // For now, static metadata:
  return {
    title: 'SlumberAI - Optimize Your Sleep',
    description: 'Calculate optimal sleep times, get nap advice, and chat with an AI sleep assistant.',
    manifest: '/manifest.json',
  };
}

export const viewport: Viewport = {
  themeColor: '#0A0C1E', // Matching the dark theme background
};


export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  const resolvedLocale = await getLocale(); // Use getLocale to be safe

  return (
    <html lang={resolvedLocale} dir={resolvedLocale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body className={`${geistSans.variable} font-sans antialiased`} suppressHydrationWarning>
        <NextIntlClientProvider locale={resolvedLocale} messages={messages}>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
