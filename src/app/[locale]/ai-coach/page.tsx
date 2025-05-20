
'use client';

import Header from '@/components/slumber/Header';
import ChatAssistant from '@/components/slumber/ChatAssistant';
import AnimatedSection from '@/components/slumber/AnimatedSection';
import { useTranslations } from 'next-intl';
import { MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AiCoachPage() {
  const t = useTranslations('HomePage'); // For footer structure
  const coachT = useTranslations('AiSleepCoach');
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
          <p>{t('footerCopyright', { year: 2025 })}</p>
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
          <div className="flex items-center mb-2">
            <MessageSquare className="h-7 w-7 text-primary mr-3" />
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">{coachT('pageTitle')}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 text-center sm:text-left px-1">
            {coachT('description')}
          </p>
         <ChatAssistant />
        </AnimatedSection>
      </main>
      <footer className="py-8 text-center text-xs sm:text-sm text-muted-foreground border-t border-border/30">
        <p>{t('footerCopyright', { year: 2025 })}</p>
      </footer>
    </div>
  );
}
