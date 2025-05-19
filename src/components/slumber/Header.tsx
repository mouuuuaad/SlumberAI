
'use client';

import { Moon, Sun, BedDouble, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next-intl/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Header() {
  const t = useTranslations('Header');
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    setIsDark(newIsDark);
  };

  const handleLocaleChange = (newLocale: string) => {
    router.push(pathname, { locale: newLocale });
  };

  const ThemeIcon = isDark ? Sun : Moon;

  return (
    <header className="py-4 sm:py-6 px-4 md:px-8 border-b border-border/30 shadow-sm bg-background">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 sm:gap-3">
          <BedDouble className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">{t('title')}</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {mounted ? (
            <Select value={currentLocale} onValueChange={handleLocaleChange}>
              <SelectTrigger 
                className="w-auto sm:w-[130px] h-9 text-xs sm:text-sm border-border/70 bg-background hover:bg-accent/50 focus:ring-ring"
                aria-label={t('languageSelectorLabel')}
              >
                <div className="flex items-center gap-1.5">
                  <Languages className="h-4 w-4 sm:hidden" />
                  <div className="hidden sm:block">
                    <SelectValue placeholder={t('languageSelectorLabel')} />
                  </div>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="w-auto sm:w-[130px] h-9 bg-muted rounded-md animate-pulse" /> // Placeholder
          )}

          {mounted ? (
            <Button variant="outline" size="icon" onClick={toggleTheme} aria-label={t('toggleTheme')} className="border-border/70 bg-background hover:bg-accent/50">
              <ThemeIcon className="h-5 w-5 transition-all" />
            </Button>
          ) : (
            <Button variant="outline" size="icon" aria-label={t('toggleTheme')} className="border-border/70" disabled>
              <Sun className="h-5 w-5 transition-all" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
