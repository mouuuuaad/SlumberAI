
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

const LOCAL_STORAGE_CHAT_KEY = 'slumberAiCurrentChat';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  fullText?: string; // For AI messages, stores the complete response
  isTyping?: boolean; // True if this AI message is currently being typed out
  followUpQuestions?: string[];
  isGreeting?: boolean;
  timestamp?: number;
}

interface ChatAssistantProps {
  startFresh: boolean;
  onUserFirstInteractionInNewChat: () => void;
}

const isGreetingMessage = (message: string): boolean => {
  const greetingPatterns = [
    /^(hi|hello|hey|sup|yo|greetings?)!*$/i,
    /^(good\s+(morning|afternoon|evening|day|night))!*$/i,
    /^(howdy|hiya|what'?s up)!*$/i,
    /^(مرحبا|أهلا|السلام عليكم|صباح الخير|مساء الخير)!*$/i
  ];
  const trimmed = message.trim();
  return greetingPatterns.some(pattern => pattern.test(trimmed));
};

// Enhanced markdown renderer with animations
const renderMarkdownMessage = (text: string | undefined) => {
  if (!text) return null;

  // Normalize newlines before splitting: handles \n\n and \\n\\n
  const normalizedText = text.replace(/\\n\\n/g, '\n\n');
  const blocks = normalizedText.split(/\n\n+/); // Split by one or more sequences of double newlines

  return blocks.map((block, blockIndex) => {
    if (!block.trim()) return null; // Skip empty blocks that might result from multiple newlines

    const animationDelay = `${blockIndex * 150}ms`; // Slightly increased delay

    // Handle Headings with enhanced styling
    if (block.startsWith('## ')) {
      let headingText = block.substring(3).trim();
      const emojiMatch = headingText.match(/^(\p{Emoji_Presentation}|\p{Emoji})\s*/u);
      let emoji = '';
      let titleText = headingText;

      if (emojiMatch) {
        emoji = emojiMatch[0];
        titleText = titleText.substring(emoji.length).trim();
      }
      
      // AI should provide bolding like: ## 🧠 **Brain Function**
      // Renderer will respect the strong tags if AI uses them
      titleText = titleText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
      
      return (
        <div
          key={blockIndex}
          className="animate-in slide-in-from-bottom-3 fade-in duration-700"
          style={{ animationDelay }}
        >
          <h2 className="text-xl font-semibold mt-5 mb-3 text-foreground flex items-center gap-2.5 group">
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

    // Enhanced bullet points with staggered animation
    // AI should provide list items like: * **Item 1**: Description
    if (block.match(/^(\s*)\*\s+/m)) { // Check if the block contains list items
      const listItems = block.split(/\n(?=\s*\*\s)/).map(item => item.replace(/^\s*\*\s?/, '').trim());
      return (
        <ul key={blockIndex} className="space-y-1.5 my-3 pl-2">
          {listItems.map((item, itemIndex) => {
            if (!item.trim()) return null;
            // Bolding within list items: * **Bold Part**: Rest of item.
            const formattedItem = item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');
            const itemDelay = `${(blockIndex * 150) + (itemIndex * 75)}ms`; // Stagger list items
            
            return (
              <li 
                key={itemIndex}
                className={cn(
                  "flex items-start gap-2.5 p-1.5 rounded-md hover:bg-accent/20 transition-colors duration-200",
                  "animate-in slide-in-from-left-3 fade-in duration-500"
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
    
    // Enhanced paragraphs
    const formattedBlock = block.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');
    return (
      <div
        key={blockIndex}
        className="animate-in slide-in-from-bottom-2 fade-in duration-600"
        style={{ animationDelay }}
      >
        <p 
          className="my-2.5 text-foreground/90 leading-relaxed whitespace-pre-line" 
          dangerouslySetInnerHTML={{ __html: formattedBlock }} 
        />
      </div>
    );
  });
};

const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 py-2">
    <div className="flex gap-1.5">
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
    <span className="text-sm text-muted-foreground ml-1.5 animate-pulse">SlumberAI is thinking...</span>
  </div>
);


export default function ChatAssistant({ startFresh, onUserFirstInteractionInNewChat }: ChatAssistantProps) {
  const t = useTranslations('AiSleepCoach');
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false); // True when waiting for AI response, before typing starts
  const { toast } = useToast();

  const [userProfile, setUserProfile] = useState<{ age?: string; stressLevel?: string; lifestyle?: string }>({
    age: '',
    stressLevel: '',
    lifestyle: '',
  });

  const [currentlyTypingMessageId, setCurrentlyTypingMessageId] = useState<string | null>(null);
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const getInitialMessage = useCallback((): Message => ({
    id: 'initial-greeting-' + Date.now(), // Ensure unique ID for greetings
    role: 'assistant',
    content: t('initialBotGreeting'),
    fullText: t('initialBotGreeting'),
    isGreeting: true,
    timestamp: Date.now(),
  }), [t]);

  useEffect(() => {
    if (startFresh) {
      setMessages([getInitialMessage()]);
    } else {
      try {
        const storedMessagesRaw = localStorage.getItem(LOCAL_STORAGE_CHAT_KEY);
        if (storedMessagesRaw) {
          const storedMessagesParsed = JSON.parse(storedMessagesRaw);
          if (Array.isArray(storedMessagesParsed) && storedMessagesParsed.length > 0) {
            setMessages(storedMessagesParsed.map(m => ({...m, isTyping: false}))); // Ensure no old typing state persists
          } else {
            setMessages([getInitialMessage()]);
          }
        } else {
          setMessages([getInitialMessage()]);
        }
      } catch (error) {
        console.error("Error loading messages from localStorage:", error);
        setMessages([getInitialMessage()]);
      }
    }
  }, [startFresh, t, getInitialMessage]);

  useEffect(() => {
    if (messages.length === 0 && !startFresh) { // Cleared conversation
       localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY);
    } else if (startFresh && messages.length === 1 && messages[0].isGreeting) {
      // Do not save if it's a fresh start and only the greeting is present
      return;
    } else if (messages.length > 0) {
       localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify(messages));
    }
  }, [messages, startFresh]);


  const handleProfileChange = (field: keyof typeof userProfile, value: string) => {
    setUserProfile((prev) => ({ ...prev, [field]: value }));
  };

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      requestAnimationFrame(() => { // Ensures scroll happens after DOM update
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom, currentlyTypingMessageId]); // Scroll also when typing starts/stops

  // Typewriter effect logic
  useEffect(() => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
    }

    const messageToType = messages.find(msg => msg.id === currentlyTypingMessageId && msg.isTyping && msg.role === 'assistant');

    if (messageToType && messageToType.fullText) {
      const currentContentLength = messageToType.content?.length || 0;
      
      if (currentContentLength < messageToType.fullText.length) {
        const nextChar = messageToType.fullText.charAt(currentContentLength);
        let delay = 30; // Standard delay
        if (['.', '!', '?'].includes(nextChar)) delay = 350;
        else if ([',', ';'].includes(nextChar)) delay = 150;
        else if (nextChar === ' ') delay = 40;

        typewriterTimeoutRef.current = setTimeout(() => {
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === currentlyTypingMessageId
                ? { ...msg, content: (msg.fullText || "").substring(0, currentContentLength + 1) }
                : msg
            )
          );
          // The effect will re-run due to `messages` dependency change, continuing the typing.
        }, delay);

      } else { // Typing finished
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
  }, [messages, currentlyTypingMessageId]); // Rerun when messages array changes or typing target changes


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

    if (startFresh) {
      onUserFirstInteractionInNewChat();
    }

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
    setIsLoading(true); // Start "thinking" indicator

    try {
      const coachInput: AiSleepCoachInput = {
        currentQuery: query,
        isGreeting: isGreetingMessage(query), // Pass if it's a greeting
        userProfile: {
          age: userProfile.age ? parseInt(userProfile.age, 10) : undefined,
          stressLevel: userProfile.stressLevel || undefined,
          lifestyle: userProfile.lifestyle || undefined,
        },
      };
      const aiResponse = await aiSleepCoach(coachInput);

      setIsLoading(false); // Stop "thinking" indicator

      const newAssistantMessageId = Date.now().toString() + '-assistant';
      const newAssistantMessage: Message = {
        id: newAssistantMessageId,
        role: 'assistant',
        content: '', // Start with empty content for typewriter
        fullText: aiResponse.advice,
        isTyping: true, // Mark for typewriter effect
        followUpQuestions: aiResponse.followUpQuestions,
        timestamp: Date.now(),
      };
      
      setMessages((prev) => [...prev, newAssistantMessage]);
      setCurrentlyTypingMessageId(newAssistantMessageId); // Trigger typewriter for this message

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
    <div className="flex flex-col h-full w-full bg-transparent text-foreground">
      <Accordion type="single" collapsible className="px-4 py-3 border-b border-border/20 bg-gradient-to-r from-background to-accent/5">
        <AccordionItem value="personalize" className="border-b-0">
          <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline py-3 hover:text-foreground transition-colors duration-200">
            <div className='flex items-center gap-2'>
              <div className="relative">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <div className="absolute inset-0 h-4 w-4 text-primary/30 animate-ping" />
              </div>
              <span className="font-medium">{t('personalizeAdviceLabel')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('ageLabel')}
                </Label>
                <Input
                  id="age"
                  type="number"
                  placeholder={t('agePlaceholder')}
                  value={userProfile.age}
                  onChange={(e) => handleProfileChange('age', e.target.value)}
                  className="h-10 bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stressLevel" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('stressLevelLabel')}
                </Label>
                <Select
                  value={userProfile.stressLevel}
                  onValueChange={(value) => handleProfileChange('stressLevel', value)}
                >
                  <SelectTrigger id="stressLevel" className="h-10 bg-background/50 border-border/50 focus:border-primary/50">
                    <SelectValue placeholder={t('stressLevelPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('stressLevels.low')}</SelectItem>
                    <SelectItem value="medium">{t('stressLevels.medium')}</SelectItem>
                    <SelectItem value="high">{t('stressLevels.high')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lifestyle" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('lifestyleLabel')}
                </Label>
                <Input
                  id="lifestyle"
                  placeholder={t('lifestylePlaceholder')}
                  value={userProfile.lifestyle}
                  onChange={(e) => handleProfileChange('lifestyle', e.target.value)}
                  className="h-10 bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-200"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <ScrollArea className="flex-grow p-4 space-y-6 min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex items-end gap-3 w-full', // Base animation applied by renderMarkdownMessage for assistant
              msg.role === 'user' ? 'justify-end animate-in slide-in-from-right-4 fade-in duration-300' : 'justify-start'
            )}
          >
            {msg.role === 'assistant' && (
              <Avatar className={cn(
                "h-8 w-8 self-end shrink-0 ring-2 ring-primary/20 transition-all duration-200 hover:ring-primary/40",
                (isLoading && currentlyTypingMessageId !== msg.id) && "animate-pulse" // Pulse if loading new, but not this one
              )}>
                <AvatarImage src="/bot-avatar.png" alt="SlumberAI" data-ai-hint="robot face" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
            
            <div
              className={cn(
                'relative p-3.5 rounded-2xl max-w-[85%] shadow-md group transition-all duration-300 hover:shadow-lg',
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-lg transform hover:scale-[1.01]'
                  : 'bg-gradient-to-br from-card to-card/80 text-card-foreground border border-border/30 rounded-bl-lg backdrop-blur-sm'
              )}
            >
              <div className="flex-1 min-w-0">
                {msg.role === 'assistant' ? (
                  <>
                    {renderMarkdownMessage(msg.content)}
                    {msg.isTyping && <span className="animate-blink">▌</span>}
                  </>
                ) : (
                  <p className="whitespace-pre-line leading-relaxed">{msg.content}</p> // User messages
                )}
              </div>

              {msg.role === 'assistant' && !msg.isTyping && !msg.isGreeting && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopyMessage(msg.fullText)}
                  className="absolute -top-2 -right-2 h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 bg-background hover:bg-accent rounded-full shadow-sm hover:shadow-md transform hover:scale-110"
                  aria-label={t('copyMessageAriaLabel')}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              )}

              {msg.role === 'assistant' && msg.followUpQuestions && msg.followUpQuestions.length > 0 && !msg.isTyping && (
                <div className="mt-3.5 pt-3.5 border-t border-border/30 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium mb-1.5">Suggested questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.followUpQuestions.map((q, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "text-xs h-auto py-1.5 px-3 rounded-full border-primary/30 text-primary/90",
                          "hover:bg-primary/10 hover:text-primary hover:border-primary/50",
                          "transition-all duration-200 transform hover:scale-105 hover:shadow-sm",
                          "animate-in slide-in-from-bottom-2 fade-in"
                        )}
                        style={{ animationDelay: `${i * 100 + (msg.content?.length || 0) * 5}ms` }} // Delay based on typing
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
              <Avatar className="h-8 w-8 self-end shrink-0 ring-2 ring-accent/20 transition-all duration-200 hover:ring-accent/40">
                <AvatarImage src="/user-avatar.png" alt="User" data-ai-hint="person silhouette" />
                <AvatarFallback className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground">
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
        className="flex items-center gap-3 p-4 border-t border-border/20 bg-gradient-to-r from-background to-accent/5"
      >
        <div className="relative flex-grow">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('inputPlaceholder')}
            className="h-12 pl-4 pr-12 rounded-xl bg-background/80 border-border/30 focus:border-primary/50 focus:bg-background transition-all duration-200 text-base shadow-sm focus:shadow-md"
            disabled={isLoading || !!currentlyTypingMessageId}
          />
           {/* Loader removed from here as TypingIndicator serves this purpose globally */}
        </div>
        
        <Button 
          type="submit" 
          size="icon" 
          className={cn(
            "h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80",
            "text-primary-foreground hover:from-primary/90 hover:to-primary/95",
            "transition-all duration-200 transform hover:scale-105 hover:shadow-lg",
            "disabled:opacity-60 disabled:transform-none disabled:shadow-none disabled:hover:from-primary disabled:hover:to-primary/80"
          )}
          disabled={isLoading || !inputValue.trim() || !!currentlyTypingMessageId}
          aria-label={t('sendMessageAriaLabel')}
        >
          <SendHorizonal className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
