
'use client';

import { useState, useEffect } from 'react';
import NextLink from 'next/link';
import Header from '@/components/slumber/Header';
// Feature components are now on their own pages
import AnimatedSection from '@/components/slumber/AnimatedSection';
import { Brain, Zap } from 'lucide-react'; // Only icons for Sleep Science link remain
import { useTranslations } from 'next-intl';

// CalculationResult and related state are moved to /calculator/page.tsx

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

        {/* Sleep Cycle Calculator, Nap Optimizer, AI Coach, Dream Journal sections are removed */}
        {/* They are now separate pages accessible via header navigation */}
        
        <AnimatedSection 
            id="sleep-science-explorer" // ID can be kept for potential direct linking
            delay="100ms" // Adjusted delay as it's one of the few sections now
            className="w-full max-w-2xl lg:max-w-3xl glassmorphic rounded-xl shadow-2xl p-6 md:p-8 text-center"
        >
            <div className="flex items-center justify-center mb-6">
                <Brain className="h-7 w-7 text-primary mr-3" />
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground">{t('sleepScienceTitle')}</h2>
            </div>
            <p className="mb-6 text-muted-foreground">{t('sleepScienceSubtitle')}</p>
            <NextLink href="/sleep-science" passHref legacyBehavior>
              <a className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
                <Zap className="h-5 w-5 mr-2" />
                {t('sleepScienceLinkText')}
              </a>
            </NextLink>
        </AnimatedSection>

      </main>
      <footer className="py-8 text-center text-xs sm:text-sm text-muted-foreground border-t border-border/30">
        <p>{t('footerCopyright', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}
