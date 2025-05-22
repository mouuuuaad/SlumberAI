
'use client';

import Header from '@/components/slumber/Header';
import ChatAssistant from '@/components/slumber/ChatAssistant';
import ConversationSidebar from '@/components/slumber/ConversationSidebar';
import AnimatedSection from '@/components/slumber/AnimatedSection'; // Used for Skeleton wrapper
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const LOCAL_STORAGE_CHAT_KEY = 'slumberAiCurrentChat';
const SESSION_STORAGE_PENDING_NEW_CHAT_KEY = 'slumberAiPendingNewChat';

export default function AiCoachPage() {
  const t = useTranslations('HomePage'); // For footer, though footer is removed here.
  const coachT = useTranslations('AiSleepCoach');
  const [isClient, setIsClient] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatKey, setChatKey] = useState(Date.now());

  const [startFreshChat, setStartFreshChat] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(SESSION_STORAGE_PENDING_NEW_CHAT_KEY) === 'true';
    }
    return false;
  });

  useEffect(() => {
    setIsClient(true);
    // Determine initial sidebar state based on screen width
    // This runs only on client, so window is defined
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }
    // DO NOT remove SESSION_STORAGE_PENDING_NEW_CHAT_KEY here.
    // It's removed on first interaction or explicit clear.
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNewChatSession = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_PENDING_NEW_CHAT_KEY, 'true');
    }
    setStartFreshChat(true); // Signal ChatAssistant to show greeting
    setChatKey(Date.now()); // Force ChatAssistant to re-mount & reset its internal state
    // The old chat in localStorage is preserved until the user actually types in the new chat.
  };

  const handleClearChatSession = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY);
      sessionStorage.removeItem(SESSION_STORAGE_PENDING_NEW_CHAT_KEY); // Clear pending flag too
    }
    setStartFreshChat(true);
    setChatKey(Date.now());
  };

  const handleUserFirstInteractionInNewChat = () => {
    setStartFreshChat(false); // Chat is no longer "fresh", subsequent loads will use localStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_STORAGE_PENDING_NEW_CHAT_KEY); // Clear the flag
    }
  };

  if (!isClient) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        <Header />
        <main className="flex flex-grow overflow-hidden">
          {/* Skeleton Loader */}
          <aside className="bg-sidebar-background text-sidebar-foreground flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out border-r border-sidebar-border h-full w-60 md:w-72 p-3">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-9 ml-2 hidden md:inline-flex" />
            </div>
            <div className="flex-grow overflow-y-auto space-y-2 pr-1">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-5/6" />
            </div>
            <div className="pt-3 border-t border-sidebar-border mt-auto space-y-1.5">
              <Skeleton className="h-9 w-full" />
            </div>
          </aside>
          <div className="flex-grow flex flex-col relative">
            <div className="flex-grow p-0 md:p-0 overflow-y-auto min-h-0 bg-background">
              {/* Chat Area Skeleton */}
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
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <Header />
      <div className="flex flex-grow overflow-hidden">
        <ConversationSidebar
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          onNewChat={handleNewChatSession}
          onClearConversation={handleClearChatSession}
          chatSessionKey={chatKey} // Used to trigger sidebar refresh
        />
        <main className="flex-grow flex flex-col relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="absolute top-2 left-2 z-20 md:hidden text-foreground hover:bg-accent/20"
            aria-label={isSidebarOpen ? coachT('sidebarCollapse') : coachT('sidebarExpand')}
          >
            {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </Button>
          <div className="flex-grow p-0 md:p-0 overflow-y-auto min-h-0 bg-background">
            <ChatAssistant
              key={chatKey} // This key forces ChatAssistant to re-mount and reset its state
              startFresh={startFreshChat}
              onUserFirstInteractionInNewChat={handleUserFirstInteractionInNewChat}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
