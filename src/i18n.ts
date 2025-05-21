import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'ar', 'fr'];
export const defaultLocale = 'en';

export default getRequestConfig(async (context) => {
  const locale = context.locale;

  // Validate the incoming locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
    locale: locale,
  };
});
