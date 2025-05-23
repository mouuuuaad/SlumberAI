
'use client';

import { useEffect, useRef, useState, FormEvent, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, SendHorizonal, Copy, Bot, Sparkles } from 'lucide-react';
import { AiSleepCoachInput, AiSleepCoachOutput, aiSleepCoach } from '@/ai/flows/ai-sleep-coach';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const LOCAL_STORAGE_CHAT_KEY = 'slumberAiChatSession'; // Single key for the ongoing chat

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  fullText?: string;
  isTyping?: boolean;
  followUpQuestions?: string[];
  isGreeting?: boolean; // For the system's initial greeting
  timestamp?: number;
}

// Enhanced markdown renderer with animations
const renderMarkdownMessage = (text: string | undefined) => {
  if (!text) return null;

  const normalizedText = text.replace(/\\n\\n/g, '\n\n').replace(/\\n/g, '\n');
  const blocks = normalizedText.split(/\n\n+/); 

  return blocks.map((block, blockIndex) => {
    if (!block.trim()) return null; 

    const animationDelay = `${blockIndex * 100}ms`; 

    if (block.startsWith('## ')) {
      let headingText = block.substring(3).trim();
      const emojiMatch = headingText.match(/^(\p{Emoji_Presentation}|\p{Emoji})\s*/u);
      let emoji = '';
      let titleText = headingText;

      if (emojiMatch) {
        emoji = emojiMatch[0];
        titleText = titleText.substring(emoji.length).trim();
      }
      
      titleText = titleText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
      
      return (
        <div
          key={blockIndex}
          className="animate-in slide-in-from-bottom-3 fade-in duration-500" // Faster animation
          style={{ animationDelay }}
        >
          <h2 className="text-xl font-semibold mt-4 mb-2.5 text-foreground flex items-center gap-2 group">
            <span 
              role="img" 
              aria-label="heading-emoji" 
              className="text-2xl group-hover:scale-110 transition-transform duration-200"
            >
              {emoji.trim()}
            </span>
            <span 
              dangerouslySetInnerHTML={{ __html: titleText }}
              className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text" 
            />
          </h2>
        </div>
      );
    }

    if (block.match(/^(\s*)\*\s+/m)) { 
      const listItems = block.split(/\n(?=\s*\*\s)/).map(item => item.replace(/^\s*\*\s?/, '').trim());
      return (
        <ul key={blockIndex} className="space-y-1 my-2.5 pl-1.5">
          {listItems.map((item, itemIndex) => {
            if (!item.trim()) return null;
            const formattedItem = item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');
            const itemDelay = `${(blockIndex * 100) + (itemIndex * 50)}ms`; 
            
            return (
              <li 
                key={itemIndex}
                className={cn(
                  "flex items-start gap-2 p-1 rounded-md hover:bg-accent/10 transition-colors duration-150",
                  "animate-in slide-in-from-left-2 fade-in duration-300" // Faster animation
                )}
                style={{ animationDelay: itemDelay }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-[7px] flex-shrink-0 animate-pulse" />
                <span 
                  dangerouslySetInnerHTML={{ __html: formattedItem }}
                  className="text-foreground/90 leading-relaxed"
                />
              </li>
            );
          })}
        </ul>
      );
    }
    
    const formattedBlock = block.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');
    return (
      <div
        key={blockIndex}
        className="animate-in slide-in-from-bottom-1.5 fade-in duration-400" // Faster animation
        style={{ animationDelay }}
      >
        <p 
          className="my-2 text-foreground/90 leading-relaxed whitespace-pre-line" 
          dangerouslySetInnerHTML={{ __html: formattedBlock }} 
        />
      </div>
    );
  });
};

const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 py-2">
    <Avatar className="h-7 w-7 self-end shrink-0 ring-1 ring-primary/20 animate-pulse">
        <AvatarImage src="/bot-avatar.png" alt="SlumberAI" data-ai-hint="robot face" />
        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <Bot className="h-3.5 w-3.5" />
        </AvatarFallback>
    </Avatar>
    <div className="flex gap-1.5">
      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
    </div>
  </div>
);

export default function ChatAssistant() {
  const t = useTranslations('AiSleepCoach');
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [userProfile, setUserProfile] = useState<{ age?: string; stressLevel?: string; lifestyle?: string }>({
    age: '',
    stressLevel: '',
    lifestyle: '',
  });

  const [currentlyTypingMessageId, setCurrentlyTypingMessageId] = useState<string | null>(null);
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const getInitialGreetingMessage = useCallback((): Message => ({
    id: 'initial-greeting-' + Date.now(),
    role: 'assistant',
    content: t('initialBotGreeting'), // The longer, detailed greeting
    fullText: t('initialBotGreeting'),
    isGreeting: true,
    timestamp: Date.now(),
  }), [t]);

  useEffect(() => {
    try {
      const storedMessagesRaw = localStorage.getItem(LOCAL_STORAGE_CHAT_KEY);
      if (storedMessagesRaw) {
        const storedMessagesParsed = JSON.parse(storedMessagesRaw);
        if (Array.isArray(storedMessagesParsed) && storedMessagesParsed.length > 0) {
          setMessages(storedMessagesParsed.map(m => ({...m, isTyping: false})));
        } else {
          setMessages([getInitialGreetingMessage()]);
        }
      } else {
        setMessages([getInitialGreetingMessage()]);
      }
    } catch (error) {
      console.error("Error loading messages from localStorage:", error);
      setMessages([getInitialGreetingMessage()]);
    }
  }, [getInitialGreetingMessage]);

  useEffect(() => {
    if (messages.length > 0) {
       localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify(messages));
    } else {
       localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY); // Clear if messages array becomes empty
    }
  }, [messages]);

  const handleProfileChange = (field: keyof typeof userProfile, value: string) => {
    setUserProfile((prev) => ({ ...prev, [field]: value }));
  };

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      requestAnimationFrame(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom, currentlyTypingMessageId]);

  useEffect(() => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
    }

    const messageToType = messages.find(msg => msg.id === currentlyTypingMessageId && msg.isTyping && msg.role === 'assistant');

    if (messageToType && messageToType.fullText) {
      const currentContentLength = messageToType.content?.length || 0;
      
      if (currentContentLength < messageToType.fullText.length) {
        const nextChar = messageToType.fullText.charAt(currentContentLength);
        let delay = 15; // Faster standard delay
        if (['.', '!', '?'].includes(nextChar)) delay = 200; // Reduced punctuation delay
        else if ([',', ';'].includes(nextChar)) delay = 80; // Reduced punctuation delay
        else if (nextChar === ' ') delay = 20; // Reduced space delay

        typewriterTimeoutRef.current = setTimeout(() => {
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === currentlyTypingMessageId
                ? { ...msg, content: (msg.fullText || "").substring(0, currentContentLength + 1) }
                : msg
            )
          );
        }, delay);

      } else {
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === currentlyTypingMessageId ? { ...msg, isTyping: false } : msg
          )
        );
        setCurrentlyTypingMessageId(null);
      }
    }
    return () => {
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current);
      }
    };
  }, [messages, currentlyTypingMessageId]);

  const handleCopyMessage = async (textToCopy: string | undefined) => {
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: t('copySuccessTitle'),
        description: t('copySuccessDescription'),
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: t('copyErrorTitle'),
        description: t('copyErrorDescription'),
        variant: 'destructive',
        duration: 2000,
      });
    }
  };

  const handleSubmit = async (e: FormEvent, suggestedQuery?: string) => {
    e.preventDefault();
    const query = suggestedQuery || inputValue.trim();
    if (!query) return;

    const newUserMessage: Message = {
      id: Date.now().toString() + '-user',
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    if (!suggestedQuery) {
      setInputValue('');
    }
    setIsLoading(true);

    try {
      const coachInput: AiSleepCoachInput = {
        currentQuery: query,
        userProfile: {
          age: userProfile.age ? parseInt(userProfile.age, 10) : undefined,
          stressLevel: userProfile.stressLevel || undefined,
          lifestyle: userProfile.lifestyle || undefined,
        },
      };
      const aiResponse = await aiSleepCoach(coachInput);

      setIsLoading(false); 

      const newAssistantMessageId = Date.now().toString() + '-assistant';
      const newAssistantMessage: Message = {
        id: newAssistantMessageId,
        role: 'assistant',
        content: '',
        fullText: aiResponse.advice,
        isTyping: true,
        followUpQuestions: aiResponse.followUpQuestions,
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, newAssistantMessage]);
      setCurrentlyTypingMessageId(newAssistantMessageId);

    } catch (error) {
      console.error('Error fetching AI response:', error);
      setIsLoading(false);
      const errorResponseMessage: Message = {
        id: Date.now().toString() + '-error',
        role: 'assistant',
        content: t('errorResponse'),
        fullText: t('errorResponse'),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorResponseMessage]);
      toast({
        title: t('errorToastTitle'),
        description: t('errorResponse'),
        variant: 'destructive',
      });
    }
  };

  const handleFollowUpClick = (question: string) => {
    const dummyEvent = { preventDefault: () => {} } as FormEvent;
    handleSubmit(dummyEvent, question);
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent text-foreground min-h-0">
      <Accordion type="single" collapsible className="px-4 py-2 border-b border-border/20 bg-gradient-to-r from-background to-accent/5 flex-shrink-0">
        <AccordionItem value="personalize" className="border-b-0">
          <AccordionTrigger className="text-xs sm:text-sm text-muted-foreground hover:no-underline py-2.5 hover:text-foreground transition-colors duration-200">
            <div className='flex items-center gap-2'>
              <div className="relative">
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                <div className="absolute inset-0 h-3.5 w-3.5 text-primary/30 animate-ping" />
              </div>
              <span className="font-medium text-xs">{t('personalizeAdviceLabel')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-3 pb-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="age" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('ageLabel')}
                </Label>
                <Input
                  id="age"
                  type="number"
                  placeholder={t('agePlaceholder')}
                  value={userProfile.age}
                  onChange={(e) => handleProfileChange('age', e.target.value)}
                  className="h-9 text-sm bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stressLevel" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('stressLevelLabel')}
                </Label>
                <Select
                  value={userProfile.stressLevel}
                  onValueChange={(value) => handleProfileChange('stressLevel', value)}
                >
                  <SelectTrigger id="stressLevel" className="h-9 text-sm bg-background/50 border-border/50 focus:border-primary/50">
                    <SelectValue placeholder={t('stressLevelPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('stressLevels.low')}</SelectItem>
                    <SelectItem value="medium">{t('stressLevels.medium')}</SelectItem>
                    <SelectItem value="high">{t('stressLevels.high')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lifestyle" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('lifestyleLabel')}
                </Label>
                <Input
                  id="lifestyle"
                  placeholder={t('lifestylePlaceholder')}
                  value={userProfile.lifestyle}
                  onChange={(e) => handleProfileChange('lifestyle', e.target.value)}
                  className="h-9 text-sm bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-200"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <ScrollArea className="flex-grow p-4 space-y-5 min-h-0"> {/* Added min-h-0 */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex items-end gap-2.5 w-full',
              msg.role === 'user' ? 'justify-end animate-in slide-in-from-right-3 fade-in duration-200' : 'justify-start'
            )}
          >
            {msg.role === 'assistant' && (
              <Avatar className={cn(
                "h-7 w-7 self-end shrink-0 ring-1 ring-primary/20 transition-all duration-150 hover:ring-primary/30",
                (isLoading && currentlyTypingMessageId !== msg.id) && "animate-pulse"
              )}>
                <AvatarImage src="/bot-avatar.png" alt="SlumberAI" data-ai-hint="robot face" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                  <Bot className="h-3.5 w-3.5" />
                </AvatarFallback>
              </Avatar>
            )}
            
            <div
              className={cn(
                'relative p-3 rounded-xl max-w-[85%] shadow-md group transition-all duration-200 hover:shadow-lg',
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-br-md transform hover:scale-[1.01]'
                  : 'bg-gradient-to-br from-card to-card/70 text-card-foreground border border-border/20 rounded-bl-md backdrop-blur-sm'
              )}
            >
              <div className="flex-1 min-w-0">
                {msg.role === 'assistant' ? (
                  <>
                    {renderMarkdownMessage(msg.content)}
                    {msg.isTyping && <span className="animate-blink">▌</span>}
                  </>
                ) : (
                  <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                )}
              </div>

              {msg.role === 'assistant' && !msg.isTyping && !msg.isGreeting && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopyMessage(msg.fullText)}
                  className="absolute -top-1.5 -right-1.5 h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-150 bg-background hover:bg-accent rounded-full shadow-sm hover:shadow-md transform hover:scale-105"
                  aria-label={t('copyMessageAriaLabel')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}

              {msg.role === 'assistant' && msg.followUpQuestions && msg.followUpQuestions.length > 0 && !msg.isTyping && (
                <div className="mt-3 pt-3 border-t border-border/20 space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Suggested:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.followUpQuestions.map((q, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "text-xs h-auto py-1 px-2.5 rounded-full border-primary/30 text-primary/80",
                          "hover:bg-primary/10 hover:text-primary hover:border-primary/40",
                          "transition-all duration-150 transform hover:scale-105 hover:shadow-xs",
                          "animate-in slide-in-from-bottom-1.5 fade-in"
                        )}
                        style={{ animationDelay: `${i * 70 + (msg.content?.length || 0) * 3}ms` }}
                        onClick={() => handleFollowUpClick(q)}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <Avatar className="h-7 w-7 self-end shrink-0 ring-1 ring-accent/20 transition-all duration-150 hover:ring-accent/30">
                <AvatarImage src="/user-avatar.png" alt="User" data-ai-hint="person silhouette" />
                <AvatarFallback className="bg-gradient-to-br from-accent to-accent/70 text-accent-foreground">
                  U
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </ScrollArea>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2.5 p-3 border-t border-border/20 bg-background flex-shrink-0"
      >
        <div className="relative flex-grow">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('inputPlaceholder')}
            className="h-11 pl-3.5 pr-10 rounded-lg bg-input/70 border-border/40 focus:border-primary/60 focus:bg-background transition-all duration-150 text-sm shadow-sm focus:shadow-md"
            disabled={isLoading || !!currentlyTypingMessageId}
          />
        </div>
        
        <Button 
          type="submit" 
          size="icon" 
          className={cn(
            "h-11 w-11 rounded-lg bg-gradient-to-br from-primary to-primary/80 shrink-0",
            "text-primary-foreground hover:from-primary/90 hover:to-primary/95",
            "transition-all duration-150 transform hover:scale-105 hover:shadow-lg",
            "disabled:opacity-50 disabled:transform-none disabled:shadow-none disabled:hover:from-primary disabled:hover:to-primary/80"
          )}
          disabled={isLoading || !inputValue.trim() || !!currentlyTypingMessageId}
          aria-label={t('sendMessageAriaLabel')}
        >
          <SendHorizonal className="h-4.5 w-4.5" />
        </Button>
      </form>
    </div>
  );
}
