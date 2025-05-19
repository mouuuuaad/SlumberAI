// This file was previously src/app/page.tsx and has been moved and updated for i18n
'use client';

import { useState, useEffect } from 'react';
// import Link from 'next/link'; // Using next-intl's Link
import { Link as IntlLink } from 'next-intl';
import Header from '@/components/slumber/Header';
import SleepCalculationResults from '@/components/slumber/SleepCalculationResults';
import NapCalculator from '@/components/slumber/NapCalculator';
import ChatAssistant from '@/components/slumber/ChatAssistant';
import SleepCalculatorForm from '@/components/slumber/SleepCalculatorForm';
import DreamJournal from '@/components/slumber/DreamJournal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Coffee, MessageSquare, Brain, BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type { CalculationResult } from '@/components/slumber/SleepCalculatorForm';

export default function HomePage() {
  const t = useTranslations('HomePage');
  const [sleepResults, setSleepResults] = useState<CalculationResult | null>(null);
  const [activeTab, setActiveTab] = useState('calculator');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSleepCalculation = (results: CalculationResult) => {
    setSleepResults(results);
  };
  
  if (!isClient) {
    return null; 
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-10 md:py-16 flex flex-col items-center space-y-10 md:space-y-12">
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-xl md:max-w-2xl">
          <TabsList className="grid w-full grid-cols-5 mb-8 bg-card/70 p-1.5 rounded-lg">
            <TabsTrigger value="calculator" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
              <Calculator className="h-4 w-4 mr-1.5 sm:mr-2" /> {t('sleepCyclesTab')}
            </TabsTrigger>
            <TabsTrigger value="nap" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
              <Coffee className="h-4 w-4 mr-1.5 sm:mr-2" /> {t('napOptimizerTab')}
            </TabsTrigger>
            <TabsTrigger value="assistant" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
              <MessageSquare className="h-4 w-4 mr-1.5 sm:mr-2" /> {t('aiCoachTab')}
            </TabsTrigger>
            <TabsTrigger value="dreamJournal" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
              <BookOpen className="h-4 w-4 mr-1.5 sm:mr-2" /> {t('dreamJournalTab')}
            </TabsTrigger>
            <IntlLink href="/sleep-science" passHref>
              <TabsTrigger 
                value="science" // This value won't make the tab active due to navigation
                className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                // onClick logic can be removed if Link handles navigation directly
                // For TabsTrigger to behave like a link, direct rendering of <a> or custom handling is needed.
                // For now, IntlLink wrapping TabsTrigger should work for navigation.
              >
                <Brain className="h-4 w-4 mr-1.5 sm:mr-2" /> {t('sleepScienceTab')}
              </TabsTrigger>
            </IntlLink>
          </TabsList>

          <TabsContent value="calculator">
            <section className="w-full glassmorphic rounded-xl shadow-lg p-6 md:p-8">
              <SleepCalculatorForm onCalculate={handleSleepCalculation} />
              {sleepResults && <SleepCalculationResults results={sleepResults} />}
            </section>
          </TabsContent>

          <TabsContent value="nap">
            <section className="w-full glassmorphic rounded-xl shadow-lg p-6 md:p-8">
              <NapCalculator />
            </section>
          </TabsContent>

          <TabsContent value="assistant">
            <section className="w-full glassmorphic rounded-xl shadow-lg p-6 md:p-8">
             <ChatAssistant />
            </section>
          </TabsContent>

          <TabsContent value="dreamJournal">
            <section className="w-full glassmorphic rounded-xl shadow-lg p-6 md:p-8">
             <DreamJournal />
            </section>
          </TabsContent>
          
           <TabsContent value="science">
             {/* This content area might not be shown as navigation happens. */}
           </TabsContent>

        </Tabs>

      </main>
      <footer className="py-8 text-center text-xs sm:text-sm text-muted-foreground border-t border-border/30">
        <p>{t('footerCopyright', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}
