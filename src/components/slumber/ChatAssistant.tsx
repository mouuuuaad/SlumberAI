'use client';

import { useEffect, useRef, useState, FormEvent, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, SendHorizontal, Copy, Bot, Sparkles, Check } from 'lucide-react';
import { AiSleepCoachInput, AiSleepCoachOutput, aiSleepCoach } from '@/ai/flows/ai-sleep-coach';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CHAT_STORAGE_KEY = 'slumberAiChatSession';
const WORD_ANIMATION_DELAY = 200; // 0.5s per word

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  fullText?: string;
  isTyping?: boolean;
  followUpQuestions?: string[];
  isGreeting?: boolean;
  timestamp: number;
}

interface UserProfile {
  age?: string;
  stressLevel?: string;
  lifestyle?: string;
}

// Enhanced markdown renderer with proper text formatting
const MarkdownRenderer = ({ text, isTyping }: { text: string; isTyping?: boolean }) => {
  if (!text) return null;

  // Process markdown-style formatting
  const processText = (inputText: string) => {
    return inputText
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  };

  const normalizedText = text.replace(/\\n\\n/g, '\n\n').replace(/\\n/g, '\n');
  const blocks = normalizedText.split(/\n\n+/).filter(block => block.trim());

  return (
    <div className="space-y-4">
      {blocks.map((block, blockIndex) => {
        const animationDelay = blockIndex * 150;

        // Heading detection
        if (block.startsWith('## ')) {
          const headingContent = block.substring(3).trim();
          const emojiMatch = headingContent.match(/^(\p{Emoji_Presentation}|\p{Emoji})\s*/u);
          const emoji = emojiMatch?.[0] || '';
          const titleText = headingContent.substring(emoji.length).trim();
          
          return (
            <div
              key={blockIndex}
              className="animate-in slide-in-from-bottom-4 fade-in duration-700"
              style={{ animationDelay: `${animationDelay}ms` }}
            >
              <h2 className="flex items-center gap-3 text-xl font-bold text-foreground mt-6 mb-4 group">
                {emoji && (
                  <span 
                    className="text-2xl transition-transform duration-300 group-hover:scale-110"
                    role="img" 
                    aria-label="heading-emoji"
                  >
                    {emoji.trim()}
                  </span>
                )}
                <span dangerouslySetInnerHTML={{ __html: processText(titleText) }} />
              </h2>
            </div>
          );
        }

        // List items detection
        if (block.match(/^(\s*)[•*-]\s+/m)) {
          const listItems = block
            .split(/\n(?=\s*[•*-]\s)/)
            .map(item => item.replace(/^\s*[•*-]\s?/, '').trim())
            .filter(Boolean);

          return (
            <div
              key={blockIndex}
              className="animate-in slide-in-from-left-4 fade-in duration-600"
              style={{ animationDelay: `${animationDelay}ms` }}
            >
              <ul className="space-y-3 my-4">
                {listItems.map((item, itemIndex) => {
                  const itemDelay = animationDelay + (itemIndex * 100);
                  
                  return (
                    <li 
                      key={itemIndex}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/10 transition-all duration-300 group"
                      style={{ 
                        animationDelay: `${itemDelay}ms`,
                        animation: 'fadeInUp 0.6s ease-out forwards'
                      }}
                    >
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0 group-hover:animate-pulse" />
                      <div 
                        className="text-foreground/90 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: processText(item) }}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        }

        // Regular paragraph
        return (
          <div
            key={blockIndex}
            className="animate-in slide-in-from-bottom-2 fade-in duration-600"
            style={{ animationDelay: `${animationDelay}ms` }}
          >
            <p 
              className="my-3 text-foreground/90 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: processText(block) }}
            />
          </div>
        );
      })}
    </div>
  );
};

// Modern copy button component
const CopyButton = ({ text, onCopy }: { text?: string; onCopy: (text: string) => void }) => {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    if (!text) return;
    
    await onCopy(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn(
        "absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-lg backdrop-blur-sm",
        "opacity-0 group-hover:opacity-100 transition-all duration-300",
        "hover:scale-110 transform bg-background/80 hover:bg-background",
        "border border-border/20 hover:border-border/40",
        copied ? "bg-green-500/10 border-green-500/20" : ""
      )}
      aria-label="Copy message"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600 animate-in zoom-in duration-200" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
};

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex items-end gap-3 animate-in slide-in-from-left-4 fade-in duration-400">
    <Avatar className="h-8 w-8 ring-2 ring-primary/20 animate-pulse">
      <AvatarImage src="/bot-avatar.png" alt="SlumberAI" />
      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <Bot className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
    <div className="flex items-center gap-1 bg-card p-3 rounded-xl rounded-bl-md border border-border/20">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  </div>
);

export default function ChatAssistant() {
  const t = useTranslations('AiSleepCoach');
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [currentlyTypingMessageId, setCurrentlyTypingMessageId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Get initial greeting message
  const getInitialGreetingMessage = useCallback((): Message => ({
    id: `greeting-${Date.now()}`,
    role: 'assistant',
    content: t('initialBotGreeting'),
    fullText: t('initialBotGreeting'),
    isGreeting: true,
    timestamp: Date.now(),
  }), [t]);

  // Initialize messages from storage
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages) as Message[];
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages.map(msg => ({ ...msg, isTyping: false })));
        } else {
          setMessages([getInitialGreetingMessage()]);
        }
      } else {
        setMessages([getInitialGreetingMessage()]);
      }
    } catch (error) {
      console.error('Error loading messages from localStorage:', error);
      setMessages([getInitialGreetingMessage()]);
    }
  }, [getInitialGreetingMessage]);

  // Save messages to storage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } else {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    }
  }, [messages]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom, currentlyTypingMessageId]);

  // Typewriter effect
  useEffect(() => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
    }

    const messageToType = messages.find(
      msg => msg.id === currentlyTypingMessageId && msg.isTyping && msg.role === 'assistant'
    );

    if (messageToType?.fullText) {
      const currentLength = messageToType.content?.length || 0;
      
      if (currentLength < messageToType.fullText.length) {
        const nextChar = messageToType.fullText.charAt(currentLength);
        const delay = ['.', '!', '?'].includes(nextChar) ? 300 
                    : [',', ';'].includes(nextChar) ? 100
                    : nextChar === ' ' ? 30 
                    : 20;

        typewriterTimeoutRef.current = setTimeout(() => {
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === currentlyTypingMessageId
                ? { ...msg, content: (msg.fullText || '').substring(0, currentLength + 1) }
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

  // Handle profile changes
  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setUserProfile(prev => ({ ...prev, [field]: value }));
  };

  // Handle copy message
  const handleCopyMessage = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: t('copySuccessTitle'),
        description: t('copySuccessDescription'),
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: t('copyErrorTitle'),
        description: t('copyErrorDescription'),
        variant: 'destructive',
        duration: 2000,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent, suggestedQuery?: string) => {
    e.preventDefault();
    const query = suggestedQuery || inputValue.trim();
    if (!query) return;

    const newUserMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    if (!suggestedQuery) setInputValue('');
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

      const newAssistantMessageId = `${Date.now()}-assistant`;
      const newAssistantMessage: Message = {
        id: newAssistantMessageId,
        role: 'assistant',
        content: '',
        fullText: aiResponse.advice,
        isTyping: true,
        followUpQuestions: aiResponse.followUpQuestions,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, newAssistantMessage]);
      setCurrentlyTypingMessageId(newAssistantMessageId);

    } catch (error) {
      console.error('Error fetching AI response:', error);
      setIsLoading(false);
      
      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: t('errorResponse'),
        fullText: t('errorResponse'),
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: t('errorToastTitle'),
        description: t('errorResponse'),
        variant: 'destructive',
      });
    }
  };

  const handleFollowUpClick = (question: string) => {
    handleSubmit({ preventDefault: () => {} } as FormEvent, question);
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent min-h-0">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {/* Profile Configuration */}
      <Accordion type="single" collapsible className="flex-shrink-0 px-4 py-3 border-b border-border/10 bg-gradient-to-r from-background to-accent/5">
        <AccordionItem value="personalize" className="border-0">
          <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground hover:no-underline py-3 transition-colors duration-200">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <div className="absolute inset-0 h-4 w-4 text-primary/20 animate-ping" />
              </div>
              <span className="font-medium">{t('personalizeAdviceLabel')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('ageLabel')}
                </Label>
                <Input
                  id="age"
                  type="number"
                  placeholder={t('agePlaceholder')}
                  value={userProfile.age || ''}
                  onChange={(e) => handleProfileChange('age', e.target.value)}
                  className="h-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stressLevel" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('stressLevelLabel')}
                </Label>
                <Select
                  value={userProfile.stressLevel || ''}
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
                <Label htmlFor="lifestyle" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('lifestyleLabel')}
                </Label>
                <Input
                  id="lifestyle"
                  placeholder={t('lifestylePlaceholder')}
                  value={userProfile.lifestyle || ''}
                  onChange={(e) => handleProfileChange('lifestyle', e.target.value)}
                  className="h-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Messages Area */}
      <ScrollArea className="flex-grow p-4 min-h-0">
        <div className="space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex items-end gap-3 w-full',
                msg.role === 'user' 
                  ? 'justify-end animate-in slide-in-from-right-4 fade-in duration-300' 
                  : 'justify-start'
              )}
            >
              {msg.role === 'assistant' && (
                <Avatar className="h-8 w-8 ring-2 ring-primary/20 transition-all duration-200 hover:ring-primary/30">
                  <AvatarImage src="/bot-avatar.png" alt="SlumberAI" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={cn(
                  'relative group max-w-[85%] transition-all duration-200',
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-4 rounded-2xl rounded-br-md shadow-lg hover:shadow-xl transform hover:scale-[1.01]'
                    : 'bg-gradient-to-br from-card/90 to-card text-card-foreground p-4 rounded-2xl rounded-bl-md border border-border/30 shadow-md hover:shadow-lg backdrop-blur-md'
                )}
              >
                <div className="min-w-0">
                  {msg.role === 'assistant' ? (
                    <>
                      <MarkdownRenderer text={msg.content || ''} isTyping={msg.isTyping} />
                      {msg.isTyping && (
                        <span className="inline-block w-3 h-3 bg-current animate-pulse ml-1 align-bottom">|</span>
                      )}
                    </>
                  ) : (
                    <p className="whitespace-pre-line leading-relaxed text-current">{msg.content}</p>
                  )}
                </div>

                {msg.role === 'assistant' && !msg.isTyping && !msg.isGreeting && (
                  <CopyButton text={msg.fullText} onCopy={handleCopyMessage} />
                )}

                {msg.role === 'assistant' && msg.followUpQuestions && msg.followUpQuestions.length > 0 && !msg.isTyping && (
                  <div className="mt-4 pt-4 border-t border-border/10">
                    <p className="text-xs text-muted-foreground font-medium mb-3">Suggested questions:</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.followUpQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "text-xs h-auto py-2 px-3 rounded-full border-primary/30 text-primary/80",
                            "hover:bg-primary/10 hover:text-primary hover:border-primary/50",
                            "transition-all duration-200 transform hover:scale-105",
                            "animate-in slide-in-from-bottom-2 fade-in"
                          )}
                          style={{ animationDelay: `${index * 100}ms` }}
                          onClick={() => handleFollowUpClick(question)}
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <Avatar className="h-8 w-8 ring-2 ring-accent/20 transition-all duration-200 hover:ring-accent/30">
                  <AvatarImage src="/user-avatar.png" alt="User" />
                  <AvatarFallback className="bg-gradient-to-br from-accent to-accent/70 text-accent-foreground">
                    U
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 p-4 border-t border-border/20 bg-background/80 backdrop-blur-md flex-shrink-0"
      >
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t('inputPlaceholder')}
          className="flex-grow h-12 px-4 rounded-xl bg-background/80 border border-border/50 focus:border-primary/60 focus:bg-background transition-all duration-200 shadow-sm focus:shadow-md placeholder:text-muted-foreground/60"
          disabled={isLoading || !!currentlyTypingMessageId}
        />
        
        <Button 
          type="submit" 
          size="icon" 
          className={cn(
            "h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 shrink-0",
            "hover:from-primary/90 hover:to-primary/95 transition-all duration-200",
            "transform hover:scale-105 hover:shadow-lg shadow-md",
            "disabled:opacity-50 disabled:transform-none disabled:shadow-sm"
          )}
          disabled={isLoading || !inputValue.trim() || !!currentlyTypingMessageId}
          aria-label={t('sendMessageAriaLabel')}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <SendHorizontal className="h-5 w-5" />
          )}
        </Button>
      </form>
    </div>
  );
}