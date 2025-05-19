
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/slumber/Header';
import SleepCalculationResults from '@/components/slumber/SleepCalculationResults';
import NapCalculator from '@/components/slumber/NapCalculator';
import ChatAssistant from '@/components/slumber/ChatAssistant';
import SleepCalculatorForm from '@/components/slumber/SleepCalculatorForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Coffee, MessageSquare, Brain } from 'lucide-react';

export type { CalculationResult } from '@/components/slumber/SleepCalculatorForm';


export default function HomePage() {
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
    // Render nothing or a loading indicator on the server to avoid hydration mismatch for Tabs
    return null; 
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-10 md:py-16 flex flex-col items-center space-y-10 md:space-y-12">
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-xl md:max-w-2xl">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-card/70 p-1.5 rounded-lg">
            <TabsTrigger value="calculator" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
              <Calculator className="h-4 w-4 mr-1.5 sm:mr-2" /> Sleep Cycles
            </TabsTrigger>
            <TabsTrigger value="nap" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
              <Coffee className="h-4 w-4 mr-1.5 sm:mr-2" /> Nap Optimizer
            </TabsTrigger>
            <TabsTrigger value="assistant" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
              <MessageSquare className="h-4 w-4 mr-1.5 sm:mr-2" /> AI Assistant
            </TabsTrigger>
            <Link href="/sleep-science" legacyBehavior passHref>
              <TabsTrigger 
                value="science" 
                className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                onClick={(e) => {
                  // Prevent Tabs component from trying to manage state for this link
                  e.preventDefault(); 
                  window.location.href = '/sleep-science'; // Or use Next router if preferred for SPA transition
                }}
                asChild={false} // Ensure TabsTrigger renders its own button for styling
              >
                <Brain className="h-4 w-4 mr-1.5 sm:mr-2" /> Sleep Science
              </TabsTrigger>
            </Link>
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
          
          {/* Content for Sleep Science tab will be on a separate page */}
           <TabsContent value="science">
             {/* This content area will not be shown as we navigate away. 
                 Can be left empty or have a placeholder if needed before navigation. */}
           </TabsContent>

        </Tabs>

      </main>
      <footer className="py-8 text-center text-xs sm:text-sm text-muted-foreground border-t border-border/30">
        <p>&copy; {new Date().getFullYear()} SlumberAI. All rights reserved. Crafted with 💜</p>
      </footer>
    </div>
  );
}
