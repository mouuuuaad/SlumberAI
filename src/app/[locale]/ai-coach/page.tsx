
'use client';

import Header from '@/components/slumber/Header';
import ChatAssistant from '@/components/slumber/ChatAssistant';
import ConversationSidebar from '@/components/slumber/ConversationSidebar';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const LOCAL_STORAGE_CHAT_KEY = 'slumberAiCurrentChat'; // Ensure this key is consistent

export default function AiCoachPage() {
  const t = useTranslations('HomePage'); // For footer structure, though footer is removed on this page
  const coachT = useTranslations('AiSleepCoach');
  const [isClient, setIsClient] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatSessionKey, setChatSessionKey] = useState(Date.now()); // Key to reset ChatAssistant

  useEffect(() => {
    setIsClient(true);
    if (window.innerWidth < 768) { // md breakpoint
      setIsSidebarOpen(false);
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNewChatSession = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY);
    }
    setChatSessionKey(Date.now()); // Change key to force ChatAssistant re-mount
  };

  const handleClearChatSession = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY);
    }
    setChatSessionKey(Date.now()); // Change key to force ChatAssistant re-mount
  };


  if (!isClient) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          {/* Placeholder or loading spinner */}
        </main>
        {/* Footer is removed on this page for full chat app feel */}
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
          chatSessionKey={chatSessionKey} // Pass key to allow sidebar to react if needed
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
          <div className="flex-grow p-4 md:p-6 overflow-y-auto"> {/* Added padding here */}
            <ChatAssistant key={chatSessionKey} /> {/* Use key here */}
          </div>
        </main>
      </div>
    </div>
  );
}
