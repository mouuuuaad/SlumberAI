
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/slumber/Header';
import SleepCalculatorForm, { type CalculationResult } from '@/components/slumber/SleepCalculatorForm';
import SleepCalculationResults from '@/components/slumber/SleepCalculationResults';
import AnimatedSection from '@/components/slumber/AnimatedSection';
import { useTranslations } from 'next-intl';
import { Calculator } from 'lucide-react';

export default function CalculatorPage() {
  const t = useTranslations('HomePage'); // For footer structure
  const calcPageT = useTranslations('SleepCalculatorForm'); // For page title
  const [sleepResults, setSleepResults] = useState<CalculationResult | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSleepCalculation = (results: CalculationResult) => {
    setSleepResults(results);
    const resultsElement = document.getElementById('sleep-results-display-calculator');
    if (resultsElement) {
      setTimeout(() => {
         resultsElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

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
      <main className="flex-grow container mx-auto px-4 py-10 md:py-16 flex flex-col items-center space-y-12 md:space-y-16">
        <AnimatedSection 
          delay="100ms"
          className="w-full max-w-2xl lg:max-w-3xl glassmorphic rounded-xl shadow-2xl p-6 md:p-8"
        >
          <div className="flex items-center mb-6">
            <Calculator className="h-7 w-7 text-primary mr-3" />
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">{calcPageT('title')}</h2>
          </div>
          <SleepCalculatorForm onCalculate={handleSleepCalculation} />
        </AnimatedSection>
        
        {sleepResults && (
          <div id="sleep-results-display-calculator" className="w-full max-w-2xl lg:max-w-3xl">
             <SleepCalculationResults results={sleepResults} />
          </div>
        )}
      </main>
      <footer className="py-8 text-center text-xs sm:text-sm text-muted-foreground border-t border-border/30">
        <p>{t('footerCopyright', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}
