
'use client';

import { useState, useEffect } from 'react';
import NextLink from 'next/link';
import Header from '@/components/slumber/Header';
import AnimatedSection from '@/components/slumber/AnimatedSection';
// Removed Brain icon as the section is being removed
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('HomePage');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-10 md:py-16 flex flex-col items-center space-y-12 md:space-y-16">
          {/* Placeholder for loading state if needed */}
        </main>
        <footer className="py-8 text-center text-xs sm:text-sm text-muted-foreground border-t border-border/30">
          <p>{t('footerCopyright', { year: new Date().getFullYear() })}</p>
        </footer>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-10 md:py-16 flex flex-col items-center space-y-12 md:space-y-16">
        
        <section className="text-center w-full max-w-3xl animate-hero-glow">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-4 md:mb-6 leading-tight">
            {t('heroTitle')}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>
        </section>

        {/* Sleep Cycle Calculator, Nap Optimizer, AI Coach, Dream Journal sections are removed from direct display here */}
        {/* They are accessible via header navigation to their dedicated pages */}
        
        {/* Sleep Science Explorer section removed */}

      </main>
      <footer className="py-8 text-center text-xs sm:text-sm text-muted-foreground border-t border-border/30">
        <p>{t('footerCopyright', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}
