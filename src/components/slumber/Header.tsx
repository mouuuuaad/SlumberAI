'use client';

import { Moon, Sun, BedDouble } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode based on image

  useEffect(() => {
    setMounted(true);
    const userPreference = localStorage.getItem('theme');
    if (userPreference === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (userPreference === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      // Default to dark if no preference and system is not light
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      } else {
        // Check if we should default to dark anyway if the theme is more aligned with it
        // For this request, we'll let system light override if no explicit dark preference
        setIsDarkMode(false); 
        document.documentElement.classList.remove('dark');
      }
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

  // Placeholder for SSR to avoid flash of unstyled content or incorrect theme icon
  const renderIcon = () => {
    if (!mounted) {
      // Render a generic or no icon, or a sun if light is the ultimate fallback
      return  <Sun className="h-5 w-5 transition-all" />;
    }
    return isDarkMode ? (
      <Sun className="h-5 w-5 transition-all" />
    ) : (
      <Moon className="h-5 w-5 transition-all" />
    );
  };


  return (
    <header className="py-4 sm:py-6 px-4 md:px-8 border-b border-border/30 shadow-sm bg-background">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 sm:gap-3">
          <BedDouble className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">SlumberAI</h1>
        </div>
        <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="border-border/70">
          {renderIcon()}
        </Button>
      </div>
    </header>
  );
}
