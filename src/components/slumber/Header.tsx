'use client';

import { Moon, Sun, BedDouble } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userPreference = localStorage.getItem('theme');
    if (userPreference === 'dark') {
      setIsDarkMode(true);
    } else if (userPreference === 'light') {
      setIsDarkMode(false);
    } else {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);
  
  useEffect(() => {
    if (mounted) {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }, [isDarkMode, mounted]);


  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  if (!mounted) {
    return ( // Render a placeholder or null during SSR/hydration mismatch phase
      <header className="py-6 px-4 md:px-8 border-b border-border/50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BedDouble className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">SlumberAI</h1>
          </div>
          <Button variant="ghost" size="icon" disabled>
             <Sun className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          </Button>
        </div>
      </header>
    );
  }

  return (
    <header className="py-6 px-4 md:px-8 border-b border-border/50 shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <BedDouble className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">SlumberAI</h1>
        </div>
        <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {isDarkMode ? (
            <Sun className="h-5 w-5 transition-all" />
          ) : (
            <Moon className="h-5 w-5 transition-all" />
          )}
        </Button>
      </div>
    </header>
  );
}
