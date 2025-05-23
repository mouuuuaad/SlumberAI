'use client';

import { Moon, Sun, BedDouble, Languages, Calculator, Coffee, MessageSquare, BookOpen, Gamepad2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import NextLink from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  id?: string;
  isPageLink?: boolean;
}

const languageMap = {
  en: 'English',
  ar: 'العربية',
  fr: 'Français'
};

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
    if (basePath === "") basePath = "/";

    router.push(`/${newLocale}${basePath}`);
  };

  const ThemeIcon = isDark ? Sun : Moon;

  const navItems: NavItem[] = [
    { href: '/calculator', labelKey: 'navCalculator', icon: Calculator, isPageLink: true },
    { href: '/nap-optimizer', labelKey: 'navNapOptimizer', icon: Coffee, isPageLink: true },
    { href: '/ai-coach', labelKey: 'navAiCoach', icon: MessageSquare, isPageLink: true },
    { href: '/dream-journal', labelKey: 'navDreamJournal', icon: BookOpen, isPageLink: true },
    { href: '/sleep-game', labelKey: 'navSleepGame', icon: Gamepad2, isPageLink: true },
  ];

  // Check if current page matches nav item
  const isActiveNavItem = (href: string) => {
    const cleanPath = currentPathname.replace(`/${currentLocale}`, '') || '/';
    return cleanPath === href || (href !== '/' && cleanPath.startsWith(href));
  };

  return (
    <header className="sticky top-0 z-50 py-2 sm:py-4 px-4 md:px-8 border-b border-border/30 shadow-sm bg-background/95 backdrop-blur-md">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <NextLink href="/" passHref legacyBehavior>
            <a className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
              <BedDouble className="h-7 w-7 sm:h-8 sm:w-8 text-primary group-hover:scale-110 transition-transform duration-200" />
              <h1 className="text-2xl sm:text-3xl font-bold text-primary whitespace-nowrap group-hover:text-primary/80 transition-colors">
                {t('title')}
              </h1>
            </a>
          </NextLink>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {mounted ? (
              <Select value={currentLocale} onValueChange={handleLocaleChange}>
                <SelectTrigger
                  className={cn(
                    "w-auto h-10 text-xs sm:text-sm border-2 transition-all duration-200",
                    "bg-background/50 hover:bg-accent/70 focus:ring-2 focus:ring-primary/20",
                    "border-primary/30 hover:border-primary/50 focus:border-primary",
                    "shadow-sm hover:shadow-md"
                  )}
                  aria-label={t('languageSelectorLabel')}
                >
                  <div className="flex items-center gap-2">
                    <Languages className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">
                      {languageMap[currentLocale as keyof typeof languageMap]}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="min-w-[120px] border-2 border-primary/20 shadow-lg">
                  {Object.entries(languageMap).map(([locale, label]) => (
                    <SelectItem 
                      key={locale} 
                      value={locale}
                      className={cn(
                        "cursor-pointer transition-colors duration-150",
                        "hover:bg-primary/10 focus:bg-primary/10",
                        currentLocale === locale && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={cn(
                          "font-medium",
                          currentLocale === locale ? "text-primary" : "text-foreground"
                        )}>
                          {label}
                        </span>
                        {currentLocale === locale && (
                          <Check className="h-4 w-4 text-primary ml-2" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="w-[120px] h-10 bg-muted rounded-md animate-pulse" />
            )}

            {mounted ? (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleTheme} 
                aria-label={t('toggleThemeAriaLabel')} 
                className={cn(
                  "h-10 w-10 border-2 transition-all duration-200",
                  "bg-background/50 hover:bg-accent/70",
                  "border-primary/30 hover:border-primary/50",
                  "shadow-sm hover:shadow-md hover:scale-105"
                )}
              >
                <ThemeIcon className="h-5 w-5 text-primary transition-all duration-200" />
              </Button>
            ) : (
              <div className="h-10 w-10 bg-muted rounded-md animate-pulse" />
            )}
          </div>
        </div>
        
        <nav className="mt-4 overflow-x-auto custom-scrollbar-thin pb-2">
          <ul className="flex items-center justify-start sm:justify-center gap-x-2 sm:gap-x-4 text-sm">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = isActiveNavItem(item.href);
              
              return (
                <li key={item.labelKey} className="whitespace-nowrap">
                  <NextLink href={item.href} passHref legacyBehavior>
                    <a className={cn(
                      "flex items-center gap-2 py-2 px-3 rounded-lg transition-all duration-200",
                      "font-medium border border-transparent",
                      isActive 
                        ? "bg-primary/10 text-primary border-primary/20 shadow-sm" 
                        : "text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/10",
                      "hover:scale-105 hover:shadow-sm"
                    )}>
                      <IconComponent className={cn(
                        "h-4 w-4 transition-colors duration-200",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                      )} />
                      <span>{t(item.labelKey)}</span>
                      {isActive && (
                        <div className="w-1 h-1 bg-primary rounded-full ml-1" />
                      )}
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