
'use client';

import { useState, useRef, useEffect, type FormEvent, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Settings2 } from 'lucide-react';
import { aiSleepCoach, type AiSleepCoachInput, type AiSleepCoachOutput } from '@/ai/flows/ai-sleep-coach';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useTranslations } from 'next-intl';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  followUpQuestions?: string[];
  isGreeting?: boolean; // To identify the initial greeting
}

// Helper function to render Markdown-like text to HTML
const renderMarkdownMessage = (text: string) => {
  const blocks = text.split(/\n\s*\n/); // Split by one or more blank lines
  const elements: JSX.Element[] = [];
  let currentListItems: string[] = [];

  const flushList = () => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-2 pl-2">
          {currentListItems.map((item, idx) => (
            <li key={`li-${idx}`} className="text-sm">
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

  blocks.forEach((block, index) => {
    const lines = block.split('\n');
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
        if (line.trim()) { // Avoid empty paragraphs
          elements.push(
            <p key={`p-${index}-${elements.length}`} className="text-sm my-1 whitespace-pre-wrap break-words">
               {line.split(/(\*\*.*?\*\*)/g).map((part, i) => 
                part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>
              )}
            </p>
          );
        }
      }
    });
  });

  flushList(); // Ensure any trailing list is rendered
  return <>{elements}</>;
};


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

  // User Profile State
  const [age, setAge] = useState<string>('');
  const [lifestyle, setLifestyle] = useState<string>('');
  const [stressLevel, setStressLevel] = useState<string>(''); // e.g., 'low', 'medium', 'high'

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
  }, [messages]);

  const handleFollowUpClick = (question: string) => {
    setInputValue(question);
    // handleSubmit will be triggered by user sending
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
    };
    setMessages((prev) => prev.length === 1 && prev[0].isGreeting ? [userMessage] : [...prev, userMessage]);
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
  
  useEffect(() => {
    if (messages.length === 0 && !isLoading) {
      setMessages([initialGreetingMessage]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  return (
    <div className="w-full h-[600px] md:h-[600px] flex flex-col">
      <div className="flex-grow flex flex-col bg-card/80 border border-border/30 rounded-lg shadow-inner">
        <Accordion type="single" collapsible className="px-4 md:px-6 pt-2 pb-1 border-b border-border/30">
          <AccordionItem value="profile" className="border-b-0">
            <AccordionTrigger className="text-sm hover:no-underline text-foreground/90 py-2">
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

        <ScrollArea className="flex-grow min-h-0 p-4 md:p-6" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col">
                <div
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg max-w-[85%] shadow-md', 
                    message.role === 'user'
                      ? 'ml-auto bg-primary text-primary-foreground'
                      : 'bg-card text-card-foreground border'
                  )}
                >
                  {message.role === 'assistant' && <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-accent flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 text-sm"> {/* Removed whitespace-pre-wrap and break-words, handled by Markdown renderer */}
                    {message.role === 'user' ? message.content : renderMarkdownMessage(message.content)}
                  </div>
                  {message.role === 'user' && <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground flex-shrink-0 mt-0.5" />}
                </div>
                {message.role === 'assistant' && message.followUpQuestions && message.followUpQuestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 max-w-[85%]">
                    {message.followUpQuestions.map((q, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleFollowUpClick(q)}
                        className="text-xs bg-card/50 hover:bg-card/80 border-border/50 text-foreground"
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages.length > 0 && !(messages.length === 1 && messages[0].isGreeting) && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/70 max-w-[85%] shadow-sm">
                <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-sm animate-pulse text-muted-foreground">{t('loadingResponse')}</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="p-4 border-t border-border/50 bg-card/70">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder={t('inputPlaceholder')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className="flex-grow bg-input text-foreground placeholder:text-muted-foreground focus:ring-primary"
            />
            <Button type="submit" disabled={isLoading || !inputValue.trim()} size="icon" className="bg-primary hover:bg-primary/90">
              <Send className="h-5 w-5 text-primary-foreground" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

