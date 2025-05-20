import type { Metadata, Viewport } from 'next';
// Removed Geist import, it will be in the root layout
import '../globals.css'; // Adjusted path for globals.css
import { Toaster } from '@/components/ui/toaster';
import ThemeProvider from '@/components/ThemeProvider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';

// Dynamic metadata based on locale can be generated here
export async function generateMetadata({params: {locale}}: {params: {locale: string}}): Promise<Metadata> {
  // Optionally, load translated metadata
  // For now, static metadata:
  return {
    title: 'SlumberAI - Optimize Your Sleep',
    description: 'Calculate optimal sleep times, get nap advice, and chat with an AI sleep assistant.',
    manifest: '/manifest.json', // Manifest should be linked in root if static, or here if locale-specific
  };
}

export const viewport: Viewport = {
  themeColor: '#0A0C1E', // Example theme color, adjust as needed
};


export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  // getLocale from next-intl/server should provide the correct, validated locale
  const resolvedLocale = await getLocale();

  // The <html> and <body> tags are removed from here.
  // They are inherited from the root layout (src/app/layout.tsx).
  // The lang and dir attributes on the root <html> tag will be handled by Next.js/next-intl.
  // Font classes are now applied in the root layout.
  return (
    <NextIntlClientProvider locale={resolvedLocale} messages={messages}>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
