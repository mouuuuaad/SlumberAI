
import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

// Define the locales you want to support
export const locales = ['en', 'ar', 'fr'];
export const defaultLocale = 'en';

export default getRequestConfig(async ({locale}) => {
  // Validate that the incoming `locale` parameter is a valid locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
    locale: locale, // Ensure the locale is returned
  };
});
