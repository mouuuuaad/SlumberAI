
'use client';

import Header from '@/components/slumber/Header';
import StarCatcherGame from '@/components/slumber/StarCatcherGame';
import AnimatedSection from '@/components/slumber/AnimatedSection';
import { useTranslations } from 'next-intl';
import { Gamepad2 } from 'lucide-react'; // Or Sparkles, MoonStar
import { useEffect, useState } from 'react';

export default function SleepGamePage() {
  const t = useTranslations('HomePage'); // For footer
  const gameT = useTranslations('SleepGamePage');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-10 md:py-16 flex flex-col items-center">
          {/* Placeholder for loading state if needed */}
        </main>
        <footer className="py-8 text-center text-xs sm:text-sm text-muted-foreground border-t border-border/30">
          <p>{t('footerCopyright', { year: new Date().getFullYear() })}</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-10 md:py-16 flex flex-col items-center">
        <AnimatedSection 
          delay="100ms"
          className="w-full max-w-2xl lg:max-w-3xl text-center"
        >
          <div className="flex items-center justify-center mb-4">
            <Gamepad2 className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground">{gameT('title')}</h1>
          </div>
          <p className="text-muted-foreground mb-8">{gameT('description')}</p>
        </AnimatedSection>

        <AnimatedSection delay="200ms" className="w-full max-w-3xl h-[400px] md:h-[500px]">
          <StarCatcherGame />
        </AnimatedSection>
      </main>
      <footer className="py-8 text-center text-xs sm:text-sm text-muted-foreground border-t border-border/30">
        <p>{t('footerCopyright', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}
