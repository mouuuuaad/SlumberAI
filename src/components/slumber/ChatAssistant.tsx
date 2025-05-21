
'use client';

import { useState, useRef, useEffect, type FormEvent, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Settings2, Sparkles, Loader2 } from 'lucide-react';
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

// Helper function to render Markdown-like text to HTML
const renderMarkdownMessage = (text: string) => {
  const blocks = text.split(/\\n\\s*\\n/); // Split by one or more blank lines
  const elements: JSX.Element[] = [];
  let currentListItems: string[] = [];

  const flushList = () => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-2 pl-2">
          {currentListItems.map((item, idx) => (
            <li key={`li-${idx}`} className="text-sm">
              {item.split(/(\\*\\*.*?\\*\\*)/g).map((part, i) => 
                part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>
              )}
            </li>
          ))}
        </ul>
      );
      currentListItems = [];
    }
  };

  blocks.forEach((block, index) => {
    const lines = block.split('\\n');
    lines.forEach((line) => {
      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={`h2-${index}-${elements.length}`} className="text-lg font-semibold mt-3 mb-1.5 text-foreground">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith('* ')) {
        currentListItems.push(line.substring(2));
      } else {
        flushList();
        if (line.trim()) { 
          elements.push(
            <p key={`p-${index}-${elements.length}`} className="text-sm my-1 whitespace-pre-wrap break-words">
               {line.split(/(\\*\\*.*?\\*\\*)/g).map((part, i) => 
                part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>
              )}
            </p>
          );
        }
      }
    });
  });

  flushList();
  return <>{elements}</>;
};

const LOCAL_STORAGE_CHAT_KEY = 'slumberAiCurrentChat';

export default function ChatAssistant() {
  const t = useTranslations('AiSleepCoach');
  
  const initialGreetingMessage: Message = {
    id: 'greeting-0',
    role: 'assistant',
    content: t('initialBotGreeting'),
    isGreeting: true,
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  // User Profile State
  const [age, setAge] = useState<string>('');
  const [lifestyle, setLifestyle] = useState<string>('');
  const [stressLevel, setStressLevel] = useState<string>('');

  useEffect(() => {
    setIsClient(true);
    // Load messages from localStorage on initial client mount
    const storedMessages = localStorage.getItem(LOCAL_STORAGE_CHAT_KEY);
    if (storedMessages) {
      try {
        const parsedMessages = JSON.parse(storedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
            setMessages(parsedMessages);
        } else {
            setMessages([initialGreetingMessage]);
        }
      } catch (error) {
        console.error("Error parsing stored chat messages:", error);
        setMessages([initialGreetingMessage]);
      }
    } else {
      setMessages([initialGreetingMessage]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (isClient && messages.length > 0) {
      // Don't save if it's just the initial greeting and no interaction yet
      if (messages.length === 1 && messages[0].isGreeting) {
        // If user clears local storage and reloads, we don't want to save the greeting alone
        // unless they explicitly start a new chat after that.
      } else {
        localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify(messages));
      }
    }
  }, [messages, isClient]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        requestAnimationFrame(() => {
          scrollViewport.scrollTop = scrollViewport.scrollHeight;
        });
      } else {
         requestAnimationFrame(() => {
          scrollAreaRef.current!.scrollTop = scrollAreaRef.current!.scrollHeight;
        });
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]); // Trigger scroll on new messages and loading state change

  const handleFollowUpClick = (question: string) => {
    setInputValue(question);
    // Consider triggering submit or just populating input
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
    };
    
    setMessages((prev) => {
      const updatedMessages = prev.length === 1 && prev[0].isGreeting 
                             ? [userMessage] 
                             : [...prev, userMessage];
      return updatedMessages;
    });

    const currentQuery = inputValue.trim();
    setInputValue('');
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
    <div className="w-full h-full flex flex-col bg-transparent"> {/* Removed fixed height */}
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

      <ScrollArea className="flex-grow min-h-0 pr-2" ref={scrollAreaRef}> {/* Added min-h-0 */}
        <div className="space-y-6 pb-4"> {/* Increased space-y and added pb for input field */}
          {messages.map((message) => (
            <div key={message.id} className={cn("flex flex-col", message.role === 'user' ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'flex items-start gap-2.5 p-3 rounded-lg max-w-[85%] shadow-md break-words', // Added break-words
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none' // User bubble
                    : 'bg-card/90 text-card-foreground border border-border/50 rounded-bl-none' // Assistant bubble
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
      <form onSubmit={handleSubmit} className="p-3 border-t border-border/50 bg-background">
        <div className="flex items-center gap-2.5 bg-input/50 rounded-xl p-1.5 border border-border/40 focus-within:ring-1 focus-within:ring-primary">
          <Input
            type="text"
            placeholder={t('inputPlaceholder')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="flex-grow bg-transparent border-none focus:ring-0 h-10 text-sm placeholder:text-muted-foreground/80"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
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
