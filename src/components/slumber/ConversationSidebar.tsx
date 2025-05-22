
'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MessageSquarePlus, PanelLeftClose, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import type { Message } from './ChatAssistant';

const LOCAL_STORAGE_CHAT_KEY = 'slumberAiCurrentChat';

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
  chatSessionKey: number; // To react to chat resets
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
    const storedMessagesRaw = localStorage.getItem(LOCAL_STORAGE_CHAT_KEY);
    if (storedMessagesRaw) {
      try {
        const storedMessages: Message[] = JSON.parse(storedMessagesRaw);
        if (storedMessages.length > 0 && !(storedMessages.length === 1 && storedMessages[0].isGreeting)) {
          setConversations([
            {
              id: 'current_session',
              title: storedMessages[0]?.content.substring(0, 30) + (storedMessages[0]?.content.length > 30 ? '...' : '') || t('currentSessionTitle'),
              timestamp: Date.now(),
              messageCount: storedMessages.length,
            },
          ]);
        } else {
          setConversations([]);
        }
      } catch (error) {
        console.error("Error loading conversation for sidebar:", error);
        setConversations([]);
      }
    } else {
      setConversations([]);
    }
  };

  useEffect(() => {
    setIsClient(true);
    loadCurrentConversationTitle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatSessionKey]);

  const handleNewChatClick = () => {
    onNewChat();
    setConversations([]); // Immediately clear the sidebar display
  };

  const handleClearHistoryClick = () => {
    if (confirm(t('confirmClearHistory'))) {
      onClearConversation();
      setConversations([]); // Immediately clear the sidebar display
    }
  };

  if (!isClient) {
    return (
      <aside className={cn(
        "bg-sidebar-background text-sidebar-foreground flex flex-col transition-all duration-300 ease-in-out",
        isOpen ? "w-64 md:w-72 p-4" : "w-0 p-0"
      )} />
    );
  }

  return (
    <aside className={cn(
      "bg-sidebar-background text-sidebar-foreground flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out border-r border-sidebar-border",
      "h-full",
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
