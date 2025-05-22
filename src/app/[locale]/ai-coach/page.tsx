
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
const SESSION_STORAGE_PENDING_NEW_CHAT_KEY = 'slumberAiPendingNewChat';

export default function AiCoachPage() {
  const t = useTranslations('HomePage'); // For footer, though footer is removed here.
  const coachT = useTranslations('AiSleepCoach');
  const [isClient, setIsClient] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatKey, setChatKey] = useState(Date.now());

  // Initialize startFreshChat based on sessionStorage flag
  const [startFreshChat, setStartFreshChat] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(SESSION_STORAGE_PENDING_NEW_CHAT_KEY) === 'true';
    }
    return false; // Default to false if window is not defined (SSR)
  });

  useEffect(() => {
    setIsClient(true);
    // Determine initial sidebar state based on screen width
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }

    // Clean up sessionStorage flag if it was used for initialization
    if (sessionStorage.getItem(SESSION_STORAGE_PENDING_NEW_CHAT_KEY) === 'true') {
      sessionStorage.removeItem(SESSION_STORAGE_PENDING_NEW_CHAT_KEY);
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNewChatSession = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_PENDING_NEW_CHAT_KEY, 'true');
    }
    setStartFreshChat(true);
    setChatKey(Date.now());
    // localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY); // No longer removing here
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
    setStartFreshChat(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_STORAGE_PENDING_NEW_CHAT_KEY);
    }
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
          chatSessionKey={chatKey}
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
              key={chatKey}
              startFresh={startFreshChat}
              onUserFirstInteractionInNewChat={handleUserFirstInteractionInNewChat}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
