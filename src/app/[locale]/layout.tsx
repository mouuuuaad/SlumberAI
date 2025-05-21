import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import ThemeProvider from '@/components/ThemeProvider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';

// ✅ Fix: Avoid destructuring params directly
export async function generateMetadata(
  props: { params: { locale: string } }
): Promise<Metadata> {
  const locale = props.params.locale;

  return {
    title: 'SlumberAI - Optimize Your Sleep',
    description: 'Calculate optimal sleep times, get nap advice, and chat with an AI sleep assistant.',
    manifest: '/manifest.json',
  };
}

// ✅ Move themeColor to `viewport` (this is fine as-is)
export const viewport: Viewport = {
  themeColor: '#0A0C1E',
};

// ✅ Fix: Don't destructure locale directly from params
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  const resolvedLocale = await getLocale();

  return (
    <NextIntlClientProvider locale={resolvedLocale} messages={messages}>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
