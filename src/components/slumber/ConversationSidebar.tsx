
'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MessageSquarePlus, PanelLeftClose, PanelLeftOpen, Trash2, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import type { Message } from './ChatAssistant'; // Assuming Message type is exported

const LOCAL_STORAGE_CHAT_KEY = 'slumberAiCurrentChat'; // Consistent key

interface ConversationItem {
  id: string;
  title: string;
  timestamp: number;
  messageCount: number;
}

interface ConversationSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  // onSelectConversation: (messages: Message[]) => void; // For loading a specific conversation
  // onNewConversation: () => void;
}

export default function ConversationSidebar({ isOpen, toggleSidebar }: ConversationSidebarProps) {
  const t = useTranslations('AiSleepCoachSidebar');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // For now, we'll just load the *current* chat as one "session"
    // A more advanced history would load an array of distinct conversations
    const storedMessagesRaw = localStorage.getItem(LOCAL_STORAGE_CHAT_KEY);
    if (storedMessagesRaw) {
      try {
        const storedMessages: Message[] = JSON.parse(storedMessagesRaw);
        if (storedMessages.length > 0 && !(storedMessages.length === 1 && storedMessages[0].isGreeting)) {
          setConversations([
            {
              id: 'current_session',
              title: storedMessages[0]?.content.substring(0, 30) + (storedMessages[0]?.content.length > 30 ? '...' : '') || t('currentSessionTitle'),
              timestamp: Date.now(), // Or a stored timestamp if available
              messageCount: storedMessages.length,
            },
          ]);
        }
      } catch (error) {
        console.error("Error loading conversation for sidebar:", error);
      }
    }
  }, []);

  // Placeholder for future:
  // const handleNewChat = () => {
  //   onNewConversation();
  //   // Potentially clear current chat and start fresh
  // };

  // const handleSelectChat = (id: string) => {
  //  // Load messages for this chat id and call onSelectConversation
  // };
  
  const handleClearHistory = () => {
    if (confirm(t('confirmClearHistory'))) {
      localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY);
      setConversations([]);
      // Potentially trigger a new chat state in the parent
      window.location.reload(); // Simple way to reset chat for now
    }
  };


  if (!isClient) {
    return (
      <aside className={cn(
        "bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 ease-in-out",
        isOpen ? "w-64 md:w-72 p-4" : "w-0 p-0"
      )} />
    );
  }

  return (
    <aside className={cn(
      "bg-sidebar text-sidebar-foreground flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out border-r border-border/20",
      "h-full", // Ensure sidebar takes full height of its flex container
      isOpen ? "w-60 md:w-72 p-3" : "w-0 p-0 overflow-hidden"
    )}>
      {isOpen && (
        <>
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { /* onNewConversation() */ alert(t('newChatFeaturePlaceholder')); }}
              className="w-full justify-start text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              {t('newChat')}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ml-2 hidden md:inline-flex"
              aria-label={t('sidebarCollapse')}
            >
              <PanelLeftClose className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-grow overflow-y-auto space-y-1 pr-1 custom-scrollbar-thin">
            {/* Placeholder for conversation list rendering logic */}
            {/* For now, showing the concept based on the 'current' chat */}
            {conversations.length > 0 ? (
              conversations.map(convo => (
                <Button
                  key={convo.id}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-2 px-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground truncate"
                  // onClick={() => handleSelectChat(convo.id)}
                >
                  <span className="truncate">{convo.title}</span>
                </Button>
              ))
            ) : (
              <p className="text-xs text-sidebar-foreground/60 px-2.5 py-2">{t('noHistory')}</p>
            )}
            
            {/* Example static grouping - replace with dynamic rendering */}
            <div className="mt-3">
              <h3 className="text-xs font-semibold text-sidebar-foreground/50 px-2.5 mb-1.5">{t('today')}</h3>
              {/* Map actual 'today' conversations here */}
            </div>
             <div className="mt-3">
              <h3 className="text-xs font-semibold text-sidebar-foreground/50 px-2.5 mb-1.5">{t('previous7Days')}</h3>
               {/* Map actual 'previous 7 days' conversations here */}
            </div>
          </div>
          
          <div className="pt-3 border-t border-border/20 mt-auto space-y-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              className="w-full justify-start text-sm text-sidebar-foreground/80 hover:bg-destructive/20 hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('clearHistory')}
            </Button>
            {/* <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Settings className="mr-2 h-4 w-4" />
              {t('settings')}
            </Button> */}
          </div>
        </>
      )}
    </aside>
  );
}
