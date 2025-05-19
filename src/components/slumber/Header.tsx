'use client';

import { Moon, Sun, BedDouble } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function Header() {
  const t = useTranslations('Header');
  const [mounted, setMounted] = useState(false);
  // This state is for the icon. It will be synced with the actual theme.
  const [isDark, setIsDark] = useState(false); // Initial value, will be updated in useEffect.

  useEffect(() => {
    setMounted(true);
    // Sync with the actual theme class on the <html> element,
    // which ThemeProvider.tsx is responsible for setting on initial load.
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const newIsDark = !document.documentElement.classList.contains('dark');
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    setIsDark(newIsDark); // Update icon state
  };

  // Icon logic: Show Sun icon if current theme is Dark (to switch to Light)
  // Show Moon icon if current theme is Light (to switch to Dark)
  const ThemeIcon = isDark ? Sun : Moon;

  return (
    <header className="py-4 sm:py-6 px-4 md:px-8 border-b border-border/30 shadow-sm bg-background">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 sm:gap-3">
          <BedDouble className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">{t('title')}</h1>
        </div>
        {mounted ? (
          <Button variant="outline" size="icon" onClick={toggleTheme} aria-label={t('toggleTheme')} className="border-border/70">
            <ThemeIcon className="h-5 w-5 transition-all" />
          </Button>
        ) : (
          // Render a placeholder or a button with a default icon to avoid layout shift
          // and hydration mismatch for the button itself.
          <Button variant="outline" size="icon" aria-label={t('toggleTheme')} className="border-border/70" disabled>
            <Sun className="h-5 w-5 transition-all" /> {/* Default icon for SSR/pre-mount */}
          </Button>
        )}
      </div>
    </header>
  );
}
