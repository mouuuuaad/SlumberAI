import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always', // This will prefix the locale to all paths (e.g., /en/about)
});

export const config = {
  // Match only internationalized pathnames
  // Skip internal paths like /_next, /api, static files, etc.
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',
    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(ar|en|fr)/:path*',
    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    '/((?!_next|_vercel|.*\\..*).*)'
  ]
};
