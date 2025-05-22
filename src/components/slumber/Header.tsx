
'use client';

import { Moon, Sun, BedDouble, Languages, Calculator, Coffee, MessageSquare, BookOpen, Gamepad2 } from 'lucide-react'; // Removed BrainIcon
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation'; // Standard Next.js navigation
import NextLink from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  id?: string; // For anchor links on the homepage
  isPageLink?: boolean; // To differentiate between anchor and page links
}

export default function Header() {
  const t = useTranslations('Header');
  const currentLocale = useLocale();
  const router = useRouter();
  const currentPathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(systemPrefersDark);
      if (systemPrefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
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
    let basePath = currentPathname;
    // Remove current locale prefix if it exists
    if (basePath.startsWith(`/${currentLocale}`)) {
      basePath = basePath.substring(`/${currentLocale}`.length) || '/';
    }
    if (basePath === "") basePath = "/"; // Ensure base path is at least "/"

    router.push(`/${newLocale}${basePath}`);
  };

  const ThemeIcon = isDark ? Sun : Moon;

  const navItems: NavItem[] = [
    { href: '/calculator', labelKey: 'navCalculator', icon: Calculator, isPageLink: true },
    { href: '/nap-optimizer', labelKey: 'navNapOptimizer', icon: Coffee, isPageLink: true },
    { href: '/ai-coach', labelKey: 'navAiCoach', icon: MessageSquare, isPageLink: true },
    { href: '/dream-journal', labelKey: 'navDreamJournal', icon: BookOpen, isPageLink: true },
    { href: '/sleep-game', labelKey: 'navSleepGame', icon: Gamepad2, isPageLink: true },
    // { href: '/sleep-science', labelKey: 'navSleepScience', icon: BrainIcon, isPageLink: true }, // Removed Sleep Science
  ];

  return (
    <header className="sticky top-0 z-50 py-3 sm:py-4 px-4 md:px-8 border-b border-border/30 shadow-sm bg-background/80 backdrop-blur-md">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <NextLink href="/" passHref legacyBehavior>
            <a className="flex items-center gap-2 sm:gap-3 cursor-pointer">
              <BedDouble className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold text-primary whitespace-nowrap">{t('title')}</h1>
            </a>
          </NextLink>
          <div className="flex items-center gap-2 sm:gap-3">
            {mounted ? (
              <Select value={currentLocale} onValueChange={handleLocaleChange}>
                <SelectTrigger
                  className="w-auto h-9 text-xs sm:text-sm border-border/70 bg-transparent hover:bg-accent/50 focus:ring-ring"
                  aria-label={t('languageSelectorLabel')}
                >
                  <div className="flex items-center gap-1.5">
                    <Languages className="h-4 w-4" />
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
              <div className="w-auto sm:w-[100px] h-9 bg-muted rounded-md animate-pulse" />
            )}

            {mounted ? (
              <Button variant="outline" size="icon" onClick={toggleTheme} aria-label={t('toggleThemeAriaLabel')} className="border-border/70 bg-transparent hover:bg-accent/50">
                <ThemeIcon className="h-5 w-5 transition-all" />
              </Button>
            ) : (
              <Button variant="outline" size="icon" aria-label={t('toggleThemeAriaLabel')} className="border-border/70 bg-transparent" disabled>
                <Sun className="h-5 w-5 transition-all" />
              </Button>
            )}
          </div>
        </div>
        <nav className="mt-3 overflow-x-auto custom-scrollbar-thin pb-1">
          <ul className="flex items-center justify-start sm:justify-center gap-x-3 sm:gap-x-5 text-sm">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              // All links are now page links
              const linkHref = item.href;
              return (
                <li key={item.labelKey} className="whitespace-nowrap">
                  <NextLink href={linkHref} passHref legacyBehavior>
                      <a className="flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground font-medium">
                        <IconComponent className="h-4 w-4" />
                        {t(item.labelKey)}
                      </a>
                  </NextLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
