
'use client';

import Header from '@/components/slumber/Header';
import StarCatcherGame from '@/components/slumber/StarCatcherGame';
import AnimatedSection from '@/components/slumber/AnimatedSection';
import { useTranslations } from 'next-intl';
import { Gamepad2 } from 'lucide-react';
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
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 text-primary-foreground">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-10 md:py-16 flex flex-col items-center">
          {/* Placeholder for loading state if needed */}
        </main>
        <footer className="py-8 text-center text-xs sm:text-sm text-slate-400 border-t border-slate-700/50">
          <p>{t('footerCopyright', { year: new Date().getFullYear() })}</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 text-primary-foreground font-sans">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-10 md:py-12 flex flex-col items-center">
        <AnimatedSection 
          delay="100ms"
          className="w-full max-w-2xl lg:max-w-3xl text-center mb-8"
        >
          <div className="flex items-center justify-center mb-3">
            <Gamepad2 className="h-8 w-8 text-cyan-400 mr-3" />
            <h1 className="text-3xl md:text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
              {gameT('title')}
            </h1>
          </div>
          <p className="text-slate-300 text-sm md:text-base">{gameT('description')}</p>
        </AnimatedSection>

        <AnimatedSection delay="200ms" className="w-full max-w-3xl h-[450px] md:h-[550px] rounded-xl overflow-hidden shadow-2xl border border-slate-700/50">
          <StarCatcherGame />
        </AnimatedSection>
      </main>
      <footer className="py-8 text-center text-xs sm:text-sm text-slate-400 border-t border-slate-700/50">
        <p>{t('footerCopyright', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}
