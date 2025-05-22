'use client';

import { useEffect, useRef, useState, FormEvent, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, SendHorizonal, Copy, Brain, Sparkles, Bot } from 'lucide-react';
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
  fullText?: string;
  isTyping?: boolean;
  followUpQuestions?: string[];
  isGreeting?: boolean;
  timestamp?: number;
}

interface ChatAssistantProps {
  startFresh: boolean;
  onUserFirstInteractionInNewChat: () => void;
}

// Improved greeting detection
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
const renderMarkdownMessage = (text: string, isTyping: boolean = false) => {
  if (!text) return null;

  const blocks = text.split(/\\n\\n|\n\n/);

  return blocks.map((block, blockIndex) => {
    const animationDelay = `${blockIndex * 100}ms`;
    
    // Handle Headings with enhanced styling
    if (block.startsWith('## ')) {
      const headingText = block.substring(3).trim();
      const emojiMatch = headingText.match(/^(\p{Emoji_Presentation}|\p{Emoji})\s*/u);
      let emoji = '';
      let titleText = headingText;

      if (emojiMatch) {
        emoji = emojiMatch[0];
        titleText = titleText.substring(emoji.length).trim();
      }
      
      titleText = titleText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      return (
        <div
          key={blockIndex}
          className={cn(
            "animate-in slide-in-from-left-4 fade-in duration-500",
            !isTyping && "opacity-100"
          )}
          style={{ animationDelay }}
        >
          <h2 className="text-xl font-bold mt-6 mb-3 text-foreground flex items-center gap-2 group">
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
    if (block.startsWith('* ')) {
      const listItems = block.split(/\n\*\s|\r\n\*\s/).map(item => item.replace(/^\*\s?/, '').trim());
      return (
        <ul key={blockIndex} className="space-y-2 my-4 pl-2">
          {listItems.map((item, itemIndex) => {
            const formattedItem = item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');
            const itemDelay = `${(blockIndex * 100) + (itemIndex * 50)}ms`;
            
            return (
              <li 
                key={itemIndex}
                className={cn(
                  "flex items-start gap-3 p-2 rounded-lg hover:bg-accent/30 transition-colors duration-200",
                  "animate-in slide-in-from-left-2 fade-in duration-400"
                )}
                style={{ animationDelay: itemDelay }}
              >
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0 animate-pulse" />
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
        className={cn(
          "animate-in slide-in-from-bottom-2 fade-in duration-400",
          !isTyping && "opacity-100"
        )}
        style={{ animationDelay }}
      >
        <p 
          className="my-3 text-foreground/90 leading-relaxed whitespace-pre-line" 
          dangerouslySetInnerHTML={{ __html: formattedBlock }} 
        />
      </div>
    );
  });
};

// Enhanced typing indicator
const TypingIndicator = () => (
  <div className="flex items-center gap-1 py-2">
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
    <span className="text-sm text-muted-foreground ml-2 animate-pulse">SlumberAI is thinking...</span>
  </div>
);

export default function ChatAssistant({ startFresh, onUserFirstInteractionInNewChat }: ChatAssistantProps) {
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
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const getInitialMessage = useCallback((): Message => ({
    id: 'initial-greeting',
    role: 'assistant',
    content: t('initialBotGreeting'),
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
          const storedMessages = JSON.parse(storedMessagesRaw);
          if (Array.isArray(storedMessages) && storedMessages.length > 0) {
            setMessages(storedMessages);
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
    if (messages.length > 0) {
      if (startFresh && messages.length === 1 && messages[0].isGreeting) {
        return;
      }
      localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify(messages));
    } else if (!startFresh) {
      localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY);
    }
  }, [messages, startFresh]);

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
  }, [messages, scrollToBottom]);

  // Enhanced typewriter effect with variable speed
  useEffect(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    const messageToType = messages.find(msg => msg.id === currentlyTypingMessageId && msg.isTyping);

    if (messageToType && messageToType.fullText) {
      let currentTextIndex = messageToType.content?.length || 0;
      
      typingIntervalRef.current = setInterval(() => {
        if (currentTextIndex < (messageToType.fullText?.length || 0)) {
          const nextChar = messageToType.fullText?.charAt(currentTextIndex);
          // Variable typing speed based on character
          const delay = nextChar === '.' || nextChar === '!' || nextChar === '?' ? 200 : 
                       nextChar === ',' || nextChar === ';' ? 100 : 
                       nextChar === ' ' ? 50 : 30;
          
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === currentlyTypingMessageId
                ? { ...msg, content: (msg.fullText || "").substring(0, currentTextIndex + 1) }
                : msg
            )
          );
          currentTextIndex++;
          
          // Adjust next interval timing
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            setTimeout(() => {
              if (currentTextIndex < (messageToType.fullText?.length || 0)) {
                // Continue typing
              }
            }, delay);
          }
        } else {
          if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === currentlyTypingMessageId ? { ...msg, isTyping: false } : msg
            )
          );
          setCurrentlyTypingMessageId(null);
        }
      }, 30);
    }

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [messages, currentlyTypingMessageId]);

  const handleCopyMessage = async (textToCopy: string) => {
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
    setIsLoading(true);

    // Check if it's a simple greeting
    const isSimpleGreeting = isGreetingMessage(query);

    try {
      let aiResponse: AiSleepCoachOutput;
      
      if (isSimpleGreeting) {
        // Provide a simple, friendly response for greetings
        aiResponse = {
          advice: "Hello! I'm SlumberAI, your personal sleep coach. How can I help you sleep better tonight? 😴",
          followUpQuestions: [
            "I'm having trouble falling asleep",
            "I wake up feeling tired",
            "Tell me about good sleep habits"
          ]
        };
      } else {
        const coachInput: AiSleepCoachInput = {
          currentQuery: query,
          userProfile: {
            age: userProfile.age ? parseInt(userProfile.age, 10) : undefined,
            stressLevel: userProfile.stressLevel || undefined,
            lifestyle: userProfile.lifestyle || undefined,
          },
        };
        aiResponse = await aiSleepCoach(coachInput);
      }

      const newAssistantMessage: Message = {
        id: Date.now().toString() + '-assistant',
        role: 'assistant',
        content: '',
        fullText: aiResponse.advice,
        isTyping: true,
        followUpQuestions: aiResponse.followUpQuestions,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, newAssistantMessage]);
      setCurrentlyTypingMessageId(newAssistantMessage.id);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorResponseMessage: Message = {
        id: Date.now().toString() + '-error',
        role: 'assistant',
        content: t('errorResponse'),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorResponseMessage]);
      toast({
        title: t('errorToastTitle'),
        description: t('errorResponse'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpClick = (question: string) => {
    const dummyEvent = { preventDefault: () => {} } as FormEvent;
    handleSubmit(dummyEvent, question);
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent text-foreground">
      {/* Enhanced Personalization Panel */}
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

      {/* Enhanced Chat Area */}
      <ScrollArea className="flex-grow p-4 space-y-6 min-h-0">
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className={cn(
              'flex items-end gap-3 w-full animate-in slide-in-from-bottom-4 fade-in duration-500',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {msg.role === 'assistant' && (
              <Avatar className="h-8 w-8 self-end shrink-0 ring-2 ring-primary/20 transition-all duration-200 hover:ring-primary/40">
                <AvatarImage src="/bot-avatar.png" alt="SlumberAI" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
            
            <div
              className={cn(
                'relative p-4 rounded-2xl max-w-[85%] shadow-lg group transition-all duration-300 hover:shadow-xl',
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md transform hover:scale-[1.02]'
                  : 'bg-gradient-to-br from-card to-card/80 text-card-foreground border border-border/30 rounded-bl-md backdrop-blur-sm'
              )}
            >
              <div className="flex-1 min-w-0">
                {msg.isTyping ? (
                  <div>
                    {renderMarkdownMessage(msg.content, true)}
                    <TypingIndicator />
                  </div>
                ) : (
                  renderMarkdownMessage(msg.content)
                )}
              </div>

              {/* Enhanced Copy Button */}
              {msg.role === 'assistant' && !msg.isTyping && !msg.isGreeting && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopyMessage(msg.fullText || msg.content)}
                  className="absolute -top-2 -right-2 h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 bg-background hover:bg-accent rounded-full shadow-md hover:shadow-lg transform hover:scale-110"
                  aria-label={t('copyMessageAriaLabel')}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              )}

              {/* Enhanced Follow-up Questions */}
              {msg.role === 'assistant' && msg.followUpQuestions && msg.followUpQuestions.length > 0 && !msg.isTyping && (
                <div className="mt-4 pt-4 border-t border-border/30 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium mb-2">Suggested questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.followUpQuestions.map((q, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "text-xs h-auto py-2 px-3 rounded-full border-primary/30 text-primary/90",
                          "hover:bg-primary/10 hover:text-primary hover:border-primary/50",
                          "transition-all duration-200 transform hover:scale-105 hover:shadow-md",
                          "animate-in slide-in-from-bottom-2 fade-in"
                        )}
                        style={{ animationDelay: `${i * 100}ms` }}
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
                <AvatarImage src="/user-avatar.png" alt="User" />
                <AvatarFallback className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground">
                  U
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Enhanced Input Area */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 p-4 border-t border-border/20 bg-gradient-to-r from-background to-accent/5"
      >
        <div className="relative flex-grow">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('inputPlaceholder')}
            className="h-12 pl-4 pr-12 rounded-2xl bg-background/80 border-border/30 focus:border-primary/50 focus:bg-background transition-all duration-200 text-base"
            disabled={isLoading || !!currentlyTypingMessageId}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>
        
        <Button 
          type="submit" 
          size="icon" 
          className={cn(
            "h-12 w-12 rounded-2xl bg-gradient-to-r from-primary to-primary/90",
            "text-primary-foreground hover:from-primary/90 hover:to-primary",
            "transition-all duration-200 transform hover:scale-105 hover:shadow-lg",
            "disabled:opacity-50 disabled:transform-none disabled:shadow-none"
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