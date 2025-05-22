
'use client';

import Header from '@/components/slumber/Header';
import ChatAssistant from '@/components/slumber/ChatAssistant';
import ConversationSidebar from '@/components/slumber/ConversationSidebar';
import AnimatedSection from '@/components/slumber/AnimatedSection';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const LOCAL_STORAGE_CHAT_KEY = 'slumberAiCurrentChat';

export default function AiCoachPage() {
  const t = useTranslations('HomePage'); // For footer, though footer is removed on this page
  const coachT = useTranslations('AiSleepCoach');
  const [isClient, setIsClient] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Initialize to false
  const [chatSessionKey, setChatSessionKey] = useState(Date.now());

  useEffect(() => {
    setIsClient(true);
    // Adjust sidebar based on screen width only after client is confirmed
    if (window.innerWidth >= 768) { // md breakpoint
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }
  }, []); // Runs once on mount

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNewChatSession = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY);
    }
    setChatSessionKey(Date.now()); 
  };

  const handleClearChatSession = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY);
    }
    setChatSessionKey(Date.now()); 
  };


  if (!isClient) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          {/* Minimal placeholder for SSR/pre-hydration */}
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
          chatSessionKey={chatSessionKey}
        />
        {/* The AnimatedSection wrapper was here previously, 
            but for a full-page chat app, the main content is the chat assistant itself.
            Animations can be applied internally if needed.
        */}
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
          <div className="flex-grow p-0 md:p-0 overflow-y-auto min-h-0 bg-background"> {/* Removed padding for edge-to-edge chat */}
            <ChatAssistant key={chatSessionKey} />
          </div>
        </main>
      </div>
    </div>
  );
}
