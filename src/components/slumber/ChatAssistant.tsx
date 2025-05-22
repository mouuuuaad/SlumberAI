
'use client';

import { useState, useRef, useEffect, type FormEvent, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Settings2, Loader2 } from 'lucide-react';
import { aiSleepCoach, type AiSleepCoachInput, type AiSleepCoachOutput } from '@/ai/flows/ai-sleep-coach';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useTranslations } from 'next-intl';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  followUpQuestions?: string[];
  isGreeting?: boolean;
}

const renderMarkdownMessage = (text: string) => {
  const blocks = text.split(/\\n\\n|\\n(?! )/); 
  const elements: JSX.Element[] = [];
  let currentListItems: string[] = [];

  const flushList = () => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}-${Math.random()}`} className="list-disc list-inside space-y-1 my-2 pl-4">
          {currentListItems.map((item, idx) => (
            <li key={`li-${idx}-${Math.random()}`} className="text-sm">
              {item.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>
              )}
            </li>
          ))}
        </ul>
      );
      currentListItems = [];
    }
  };

  blocks.forEach((block, blockIndex) => {
    let trimmedBlock = block.trim();
    
    const listBlockMatch = trimmedBlock.match(/^(\* .*(\n\* .*)?)/s);
    if (listBlockMatch && listBlockMatch[0].startsWith('* ')) {
        flushList(); 
        const items = listBlockMatch[0].split('\n').map(item => item.trim().substring(2)).filter(Boolean);
        items.forEach(item => currentListItems.push(item));
        flushList(); 
        return; 
    }


    if (!trimmedBlock) return;

    if (trimmedBlock.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${blockIndex}-${elements.length}-${Math.random()}`} className="text-lg font-semibold mt-4 mb-2 text-foreground flex items-center">
          {trimmedBlock.substring(3).split(/(\*\*.*?\*\*)/g).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="ml-1">{part.slice(2, -2)}</strong>;
            }
            const emojiMatch = part.match(/^(\S\s)/);
            if (emojiMatch && part.length > 2) { 
                return <Fragment key={i}><span className="mr-1.5">{emojiMatch[1].trim()}</span>{part.substring(emojiMatch[1].length)}</Fragment>;
            } else if (emojiMatch && part.length <=2 ) { 
                 return <span key={i} className="mr-1.5">{part.trim()}</span>
            }
            return <span key={i}>{part}</span>;
          })}
        </h2>
      );
    } else if (trimmedBlock.startsWith('* ')) { // Should be caught by listBlockMatch if formatted correctly by AI
      currentListItems.push(trimmedBlock.substring(2));
    } else {
      flushList();
      elements.push(
        <p key={`p-${blockIndex}-${elements.length}-${Math.random()}`} className="text-sm my-1.5 whitespace-pre-wrap break-words">
          {trimmedBlock.split(/(\*\*.*?\*\*)/g).map((part, i) =>
            part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>
          )}
        </p>
      );
    }
  });

  flushList();
  return <>{elements}</>;
};


const LOCAL_STORAGE_CHAT_KEY = 'slumberAiCurrentChat';

interface ChatAssistantProps {
  startFresh: boolean;
  onUserFirstInteractionInNewChat: () => void;
}

export default function ChatAssistant({ startFresh, onUserFirstInteractionInNewChat }: ChatAssistantProps) {
  const t = useTranslations('AiSleepCoach');

  const getInitialMessage = (): Message => ({
    id: 'greeting-0',
    role: 'assistant',
    content: t('initialBotGreeting'),
    isGreeting: true,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  const [age, setAge] = useState<string>('');
  const [lifestyle, setLifestyle] = useState<string>('');
  const [stressLevel, setStressLevel] = useState<string>('');

  useEffect(() => {
    setIsClient(true);
    // This effect runs when the component mounts OR when 'startFresh' prop changes
    // (because ChatAssistant is re-keyed by chatKey from parent, it re-mounts on new/clear chat)
    if (startFresh) {
      setMessages([getInitialMessage()]);
    } else {
      if (typeof window !== 'undefined') {
        const storedMessages = localStorage.getItem(LOCAL_STORAGE_CHAT_KEY);
        if (storedMessages) {
          try {
            const parsedMessages = JSON.parse(storedMessages);
            if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
              setMessages(parsedMessages);
            } else {
              setMessages([getInitialMessage()]); // Fallback if stored data is empty/invalid array
            }
          } catch (error) {
            console.error("Error parsing stored chat messages:", error);
            setMessages([getInitialMessage()]); // Fallback on parsing error
          }
        } else {
          setMessages([getInitialMessage()]); // Fallback if no stored messages
        }
      } else {
         setMessages([getInitialMessage()]); // Fallback for SSR or if window is not defined yet
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startFresh, t]); // Key prop from parent handles full re-mount logic for session reset.

  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      if (startFresh && messages.length === 1 && messages[0].isGreeting) {
        // Do not save to localStorage if it's a fresh start and only the greeting is present.
        // This preserves the old chat in localStorage until the user interacts.
      } else if (messages.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify(messages));
      } else if (messages.length === 0 && !startFresh) {
        // This might occur if a "Clear Conversation" happened, or if messages became empty
        // while not in a 'startFresh' state (e.g. if all messages were deleted by some other means)
        localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY);
      }
    }
  }, [messages, isClient, startFresh]);


  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      requestAnimationFrame(() => {
        if (scrollViewport) {
          scrollViewport.scrollTop = scrollViewport.scrollHeight;
        } else if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleFollowUpClick = (question: string) => {
    setInputValue(question);
    handleSubmit(undefined, question);
  };

  const handleSubmit = async (e?: FormEvent, followUpQuery?: string) => {
    if (e) e.preventDefault();
    const query = followUpQuery || inputValue;
    if (!query.trim() || isLoading) return;

    // If this is the first interaction in a "fresh" chat, notify parent.
    if (startFresh) {
      onUserFirstInteractionInNewChat();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query.trim(),
    };

    setMessages((prev) => {
      // If it's a fresh start (only greeting exists), replace greeting with user message
      if (prev.length === 1 && prev[0].isGreeting) {
        return [userMessage];
      }
      return [...prev, userMessage];
    });

    const currentQuery = query.trim();
    if (!followUpQuery) {
      setInputValue('');
    }
    setIsLoading(true);

    try {
      const userProfileInput: AiSleepCoachInput['userProfile'] = {};
      if (age) userProfileInput.age = parseInt(age, 10);
      if (lifestyle.trim()) userProfileInput.lifestyle = lifestyle.trim();
      if (stressLevel) userProfileInput.stressLevel = stressLevel;

      const input: AiSleepCoachInput = {
        currentQuery,
        userProfile: Object.keys(userProfileInput).length > 0 ? userProfileInput : undefined,
      };
      const result: AiSleepCoachOutput = await aiSleepCoach(input);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.advice,
        followUpQuestions: result.followUpQuestions,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling AI Sleep Coach:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('errorResponse'),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-transparent">
      <Accordion type="single" collapsible className="px-1 pt-0 pb-1 border-b border-border/30 mb-3">
        <AccordionItem value="profile" className="border-b-0">
          <AccordionTrigger className="text-sm hover:no-underline text-foreground/90 py-2.5">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              {t('personalizeAdviceLabel')}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-3 pb-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="age" className="text-xs">{t('ageLabel')}</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder={t('agePlaceholder')}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="bg-input/70 text-foreground placeholder:text-muted-foreground/70 h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stressLevel" className="text-xs">{t('stressLevelLabel')}</Label>
                <Select value={stressLevel} onValueChange={setStressLevel}>
                  <SelectTrigger id="stressLevel" className="bg-input/70 text-foreground placeholder:text-muted-foreground/70 h-9">
                    <SelectValue placeholder={t('stressLevelPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('stressLevels.low')}</SelectItem>
                    <SelectItem value="medium">{t('stressLevels.medium')}</SelectItem>
                    <SelectItem value="high">{t('stressLevels.high')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lifestyle" className="text-xs">{t('lifestyleLabel')}</Label>
              <Input
                id="lifestyle"
                placeholder={t('lifestylePlaceholder')}
                value={lifestyle}
                onChange={(e) => setLifestyle(e.target.value)}
                className="bg-input/70 text-foreground placeholder:text-muted-foreground/70 h-9"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <ScrollArea className="flex-grow min-h-0 pr-3" ref={scrollAreaRef}>
        <div className="space-y-6 pb-4">
          {messages.map((message) => (
            <div key={message.id} className={cn("flex flex-col", message.role === 'user' ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'flex items-start gap-2.5 p-3 rounded-lg max-w-[85%] shadow-md break-words',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-card/90 text-card-foreground border border-border/50 rounded-bl-none'
                )}
              >
                {message.role === 'assistant' && <Bot className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />}
                <div className="flex-1 text-sm">
                  {message.role === 'user' ? message.content : renderMarkdownMessage(message.content)}
                </div>
                {message.role === 'user' && <User className="h-5 w-5 text-primary-foreground flex-shrink-0 mt-0.5" />}
              </div>
              {message.role === 'assistant' && message.followUpQuestions && message.followUpQuestions.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2 max-w-[85%] self-start">
                  {message.followUpQuestions.map((q, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleFollowUpClick(q)}
                      className="text-xs bg-card/50 hover:bg-card/80 border-border/50 text-foreground rounded-full px-3 py-1"
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && messages.length > 0 && !(messages.length === 1 && messages[0].isGreeting) && (
             <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/70 max-w-[85%] shadow-sm self-start">
              <Bot className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex items-center space-x-1.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t('loadingResponse')}</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <form onSubmit={(e) => handleSubmit(e)} className="p-3 border-t border-border/50 bg-background">
        <div className="flex items-center gap-2.5 bg-input/50 rounded-xl p-1.5 border border-border/40 focus-within:ring-1 focus-within:ring-primary">
          <Input
            type="text"
            placeholder={t('inputPlaceholder')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="flex-grow bg-transparent border-none focus:ring-0 h-10 text-sm placeholder:text-muted-foreground/80"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isLoading && inputValue.trim()) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()} size="icon" className="bg-primary hover:bg-primary/90 rounded-lg w-9 h-9">
            <Send className="h-4 w-4 text-primary-foreground" />
          </Button>
        </div>
      </form>
    </div>
  );
}
