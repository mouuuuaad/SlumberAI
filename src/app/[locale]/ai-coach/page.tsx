
'use client';

import Header from '@/components/slumber/Header';
import ChatAssistant from '@/components/slumber/ChatAssistant';
import AnimatedSection from '@/components/slumber/AnimatedSection';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AiCoachPage() {
  const coachT = useTranslations('AiSleepCoach');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        <Header />
        <main className="flex-grow flex flex-col relative">
          {/* Skeleton Loader for Chat Area */}
          <div className="flex-grow p-0 md:p-0 overflow-y-auto min-h-0 bg-background">
            <div className="p-3 space-y-4 h-full flex flex-col">
              <Skeleton className="h-16 w-full" /> {/* Accordion skeleton */}
              <div className="flex-grow space-y-6 pb-4">
                <div className="flex items-start gap-2.5 p-3 rounded-lg max-w-[85%] self-start">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-12 w-48 rounded-md" />
                </div>
                <div className="flex items-end gap-2.5 p-3 rounded-lg max-w-[85%] self-end flex-row-reverse">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-10 w-40 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-12 w-full rounded-xl" /> {/* Input area skeleton */}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <Header />
      <main className="flex-grow flex flex-col relative">
        {/* 
          The AnimatedSection can be kept if you want the entire chat interface to animate in on load.
          If not, ChatAssistant can be rendered directly.
        */}
        <AnimatedSection delay="100ms" className="flex-grow flex flex-col min-h-0">
          <ChatAssistant />
        </AnimatedSection>
      </main>
    </div>
  );
}
