
'use client';

import { useState, useEffect } from 'react'; // Removed useRef as AnimatedSection handles its own ref
import NextLink from 'next/link';
import Header from '@/components/slumber/Header';
import SleepCalculationResults from '@/components/slumber/SleepCalculationResults';
import NapCalculator from '@/components/slumber/NapCalculator';
import ChatAssistant from '@/components/slumber/ChatAssistant';
import SleepCalculatorForm from '@/components/slumber/SleepCalculatorForm';
import DreamJournal from '@/components/slumber/DreamJournal';
import AnimatedSection from '@/components/slumber/AnimatedSection'; // Import the new component
import { Calculator, Coffee, MessageSquare, Brain, BookOpen, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
// Removed cn as AnimatedSection handles its own classes

export type { CalculationResult } from '@/components/slumber/SleepCalculatorForm';

// AnimatedSection component is now in src/components/slumber/AnimatedSection.tsx

export default function HomePage() {
  const t = useTranslations('HomePage');
  const [sleepResults, setSleepResults] = useState<CalculationResult | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSleepCalculation = (results: CalculationResult) => {
    setSleepResults(results);
    const resultsElement = document.getElementById('sleep-results-display');
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
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

        <AnimatedSection 
          id="sleep-cycle-calculator" 
          delay="100ms"
          className="w-full max-w-2xl lg:max-w-3xl glassmorphic rounded-xl shadow-2xl p-6 md:p-8"
        >
          <div className="flex items-center mb-6">
            <Calculator className="h-7 w-7 text-primary mr-3" />
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">{t('sleepCycleCalculatorTitle')}</h2>
          </div>
          <SleepCalculatorForm onCalculate={handleSleepCalculation} />
        </AnimatedSection>
        
        {sleepResults && (
          // This div doesn't need to be an AnimatedSection itself, as its content is conditional
          // and its appearance is tied to the form submission.
          <div id="sleep-results-display" className="w-full max-w-2xl lg:max-w-3xl">
             <SleepCalculationResults results={sleepResults} />
          </div>
        )}

        <AnimatedSection 
          id="nap-optimizer" 
          delay="200ms"
          className="w-full max-w-2xl lg:max-w-3xl glassmorphic rounded-xl shadow-2xl p-6 md:p-8"
        >
          <div className="flex items-center mb-6">
            <Coffee className="h-7 w-7 text-primary mr-3" />
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">{t('napOptimizerTitle')}</h2>
          </div>
          <NapCalculator />
        </AnimatedSection>

        <AnimatedSection 
          id="ai-coach" 
          delay="300ms"
          className="w-full max-w-2xl lg:max-w-3xl glassmorphic rounded-xl shadow-2xl p-6 md:p-8"
        >
          <div className="flex items-center mb-6">
            <MessageSquare className="h-7 w-7 text-primary mr-3" />
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">{t('aiCoachTitle')}</h2>
          </div>
         <ChatAssistant />
        </AnimatedSection>

        <AnimatedSection 
          id="dream-journal" 
          delay="400ms"
          className="w-full max-w-2xl lg:max-w-3xl glassmorphic rounded-xl shadow-2xl p-6 md:p-8"
        >
          <div className="flex items-center mb-6">
            <BookOpen className="h-7 w-7 text-primary mr-3" />
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">{t('dreamJournalTitle')}</h2>
          </div>
         <DreamJournal />
        </AnimatedSection>
        
        <AnimatedSection 
            id="sleep-science-explorer" 
            delay="500ms" 
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
