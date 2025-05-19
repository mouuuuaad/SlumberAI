import type { Metadata } from 'next';
import './globals.css'; // Root global styles

export const metadata: Metadata = {
  title: 'SlumberAI', // Generic title, can be overridden by locale-specific layouts
  description: 'Your personal sleep companion, available in multiple languages.',
  manifest: '/manifest.json', // Manifest link can stay here or be in locale layout
  // themeColor property is better handled in specific locale layouts if it needs to change,
  // or if it's static, can be here. For now, we'll let the [locale]/layout.tsx handle it via its own metadata.
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This root layout no longer sets the lang attribute or specific classes on html/body.
  // This will be handled by the [locale]/layout.tsx.
  // Adding suppressHydrationWarning here helps if client-side JS (like ThemeProvider)
  // modifies html/body classes/attributes in a way that differs from SSR.
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
