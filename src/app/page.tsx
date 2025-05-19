'use client';

import { useState } from 'react';
import Header from '@/components/slumber/Header';
import SleepCalculatorForm, { type CalculationResult } from '@/components/slumber/SleepCalculatorForm';
import SleepCalculationResults from '@/components/slumber/SleepCalculationResults';
import NapCalculator from '@/components/slumber/NapCalculator';
import ChatAssistant from '@/components/slumber/ChatAssistant';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Coffee, MessageSquare } from 'lucide-react';

export default function HomePage() {
  const [sleepResults, setSleepResults] = useState<CalculationResult | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Tabs defaultValue="calculator" className="w-full max-w-3xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="calculator" className="text-xs sm:text-sm">
              <Calculator className="h-4 w-4 mr-1 sm:mr-2" /> Sleep Calculator
            </TabsTrigger>
            <TabsTrigger value="nap" className="text-xs sm:text-sm">
              <Coffee className="h-4 w-4 mr-1 sm:mr-2" /> Nap Optimizer
            </TabsTrigger>
            <TabsTrigger value="assistant" className="text-xs sm:text-sm">
              <MessageSquare className="h-4 w-4 mr-1 sm:mr-2" /> AI Assistant
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator">
            <div className="space-y-6">
              <SleepCalculatorForm onCalculate={setSleepResults} />
              {sleepResults && <SleepCalculationResults results={sleepResults} />}
            </div>
          </TabsContent>

          <TabsContent value="nap">
            <NapCalculator />
          </TabsContent>

          <TabsContent value="assistant">
            <ChatAssistant />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border/50">
        <p>&copy; {new Date().getFullYear()} SlumberAI. Optimize your Zzz's.</p>
      </footer>
    </div>
  );
}
