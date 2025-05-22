
'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MessageSquarePlus, PanelLeftClose, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import type { Message } from './ChatAssistant'; // Assuming Message type is exported or defined here

const LOCAL_STORAGE_CHAT_KEY = 'slumberAiCurrentChat';
const SESSION_STORAGE_PENDING_NEW_CHAT_KEY = 'slumberAiPendingNewChat';


interface ConversationItem {
  id: string;
  title: string;
  timestamp: number;
  messageCount: number;
}

interface ConversationSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  onNewChat: () => void;
  onClearConversation: () => void;
  chatSessionKey: number; // To react to chat resets from parent
}

export default function ConversationSidebar({
  isOpen,
  toggleSidebar,
  onNewChat,
  onClearConversation,
  chatSessionKey
}: ConversationSidebarProps) {
  const t = useTranslations('AiSleepCoachSidebar');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  const loadCurrentConversationTitle = () => {
    if (typeof window === 'undefined') return;

    // If a new chat is pending, sidebar should be empty
    if (sessionStorage.getItem(SESSION_STORAGE_PENDING_NEW_CHAT_KEY) === 'true') {
      setConversations([]);
      return;
    }

    const storedMessagesRaw = localStorage.getItem(LOCAL_STORAGE_CHAT_KEY);
    if (storedMessagesRaw) {
      try {
        const storedMessages: Message[] = JSON.parse(storedMessagesRaw);
        // Ensure messages exist and it's not just the initial greeting
        if (storedMessages.length > 0 && !(storedMessages.length === 1 && storedMessages[0].isGreeting)) {
          // Use the first user message or first assistant message (if no user message yet but not greeting) as title
          const firstMeaningfulMessage = storedMessages.find(msg => !msg.isGreeting);
          const titleText = firstMeaningfulMessage?.content.substring(0, 35) + (firstMeaningfulMessage?.content.length > 35 ? '...' : '') || t('currentSessionTitle');
          
          setConversations([
            {
              id: 'current_session', // This ID is fine as we only show one "current" session
              title: titleText,
              timestamp: Date.now(), // Could be derived from last message if available
              messageCount: storedMessages.length,
            },
          ]);
        } else {
          setConversations([]); // No meaningful messages or only greeting
        }
      } catch (error) {
        console.error("Error loading conversation for sidebar:", error);
        setConversations([]);
      }
    } else {
      setConversations([]); // No chat in localStorage
    }
  };

  useEffect(() => {
    setIsClient(true);
    loadCurrentConversationTitle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatSessionKey, t]); // Re-load if chatSessionKey (from parent) changes or translations load

  const handleNewChatClick = () => {
    onNewChat(); // This will trigger parent to set sessionStorage flag and update chatKey
    // The useEffect reacting to chatSessionKey will then call loadCurrentConversationTitle,
    // which will see the sessionStorage flag and clear conversations display.
    // No need for setConversations([]) here as the effect will handle it.
  };

  const handleClearHistoryClick = () => {
    if (confirm(t('confirmClearHistory'))) {
      onClearConversation(); // Parent handles localStorage clear and chatKey update
      // Similar to new chat, the useEffect will update the display.
    }
  };

  if (!isClient) {
    return (
      <aside className={cn(
        "bg-sidebar-background text-sidebar-foreground flex flex-col transition-all duration-300 ease-in-out",
        isOpen ? "w-60 md:w-72 p-3" : "w-0 p-0" // Adjusted width slightly
      )} />
    );
  }

  return (
    <aside className={cn(
      "bg-sidebar-background text-sidebar-foreground flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out border-r border-sidebar-border",
      "h-full", // Ensure sidebar takes full height of its flex container
      isOpen ? "w-60 md:w-72 p-3" : "w-0 p-0 overflow-hidden"
    )}>
      {isOpen && (
        <>
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewChatClick}
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

          <div className="flex-grow overflow-y-auto space-y-1 pr-1 custom-scrollbar-thin sidebar-scrollbar">
            {conversations.length > 0 ? (
              conversations.map(convo => (
                <Button
                  key={convo.id}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto py-2 px-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground truncate"
                >
                  <span className="truncate">{convo.title}</span>
                </Button>
              ))
            ) : (
              <p className="text-xs text-sidebar-foreground/60 px-2.5 py-2">{t('noHistory')}</p>
            )}
          </div>

          <div className="pt-3 border-t border-sidebar-border mt-auto space-y-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistoryClick}
              className="w-full justify-start text-sm text-sidebar-foreground/80 hover:bg-destructive/20 hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('clearHistory')}
            </Button>
          </div>
        </>
      )}
    </aside>
  );
}
