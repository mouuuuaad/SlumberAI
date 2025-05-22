
import type { Metadata, Viewport } from 'next';
import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import ThemeProvider from '@/components/ThemeProvider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';

export async function generateMetadata(
  props: { params: { locale: string } }
): Promise<Metadata> {
  // const locale = props.params.locale; // locale can be used if needed for metadata

  return {
    title: 'SlumberAI - Optimize Your Sleep', // This can be translated if needed using getMessages here
    description: 'Calculate optimal sleep times, get nap advice, and chat with an AI sleep assistant.',
    manifest: '/manifest.json',
  };
}

export const viewport: Viewport = {
  themeColor: '#D0B4DE', // Static light theme primary color (Soft Lavender), consistent with root layout
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  const resolvedLocale = params.locale; 

  return (
    <NextIntlClientProvider locale={resolvedLocale} messages={messages}>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
