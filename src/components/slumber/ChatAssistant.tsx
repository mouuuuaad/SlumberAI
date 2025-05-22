
'use client';

import { useEffect, useRef, useState, FormEvent, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card'; // Main card removed, but individual message cards remain
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, SendHorizonal, Copy, Brain, Sparkles } from 'lucide-react'; // Added Brain, Sparkles
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
}

interface ChatAssistantProps {
  startFresh: boolean;
  onUserFirstInteractionInNewChat: () => void;
}

// Helper to render markdown-like content
const renderMarkdownMessage = (text: string) => {
  if (!text) return null;

  // Split by newlines, then process each block
  const blocks = text.split(/\\n\\n|\n\n/); // Handles both escaped and literal double newlines for paragraphs

  return blocks.map((block, blockIndex) => {
    // Handle Headings: ## Emoji **Bold Text**
    if (block.startsWith('## ')) {
      const headingText = block.substring(3).trim(); // Remove '## '
      const emojiMatch = headingText.match(/^(\p{Emoji_Presentation}|\p{Emoji})\s*/u);
      let emoji = '';
      let titleText = headingText;

      if (emojiMatch) {
        emoji = emojiMatch[0];
        titleText = titleText.substring(emoji.length).trim();
      }
      
      // Bold handling within the title
      titleText = titleText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      return (
        <h2 key={blockIndex} className="text-xl font-semibold mt-4 mb-2 text-foreground flex items-center">
          <span role="img" aria-label="heading-emoji" className="mr-2">{emoji.trim()}</span>
          <span dangerouslySetInnerHTML={{ __html: titleText }} />
        </h2>
      );
    }

    // Handle Bullet Points: * Item
    // Allow multi-line bullet points if subsequent lines are part of the same item
    if (block.startsWith('* ')) {
      const listItems = block.split(/\n\*\s|\r\n\*\s/).map(item => item.replace(/^\*\s?/, '').trim());
      return (
        <ul key={blockIndex} className="list-disc list-inside space-y-1 my-2 pl-4 text-foreground/90">
          {listItems.map((item, itemIndex) => {
            // Bold handling within list items
            const formattedItem = item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            return <li key={itemIndex} dangerouslySetInnerHTML={{ __html: formattedItem }} />;
          })}
        </ul>
      );
    }
    
    // Handle Paragraphs (and bold text within them)
    // Default to paragraph if not a heading or list
    const formattedBlock = block.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return (
      <p key={blockIndex} className="my-1 text-foreground/90 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: formattedBlock }} />
    );
  });
};


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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startFresh, t]); // Added t to dependency array


  useEffect(() => {
    if (messages.length > 0) {
      if (startFresh && messages.length === 1 && messages[0].isGreeting) {
        // Don't save to localStorage if it's a fresh start with only the greeting
        return;
      }
      localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify(messages));
    } else if (!startFresh) { // Only remove if not a fresh start and messages are empty
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


  // Typewriter Effect
  useEffect(() => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    const messageToType = messages.find(msg => msg.id === currentlyTypingMessageId && msg.isTyping);

    if (messageToType && messageToType.fullText) {
      let currentTextIndex = messageToType.content?.length || 0;
      typingIntervalRef.current = setInterval(() => {
        if (currentTextIndex < (messageToType.fullText?.length || 0) ) {
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === currentlyTypingMessageId
                ? { ...msg, content: (msg.fullText || "").substring(0, currentTextIndex + 1) }
                : msg
            )
          );
          currentTextIndex++;
        } else {
          if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === currentlyTypingMessageId ? { ...msg, isTyping: false } : msg
            )
          );
          setCurrentlyTypingMessageId(null);
        }
      }, 30); // Adjust typing speed here
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
    };

    setMessages((prev) => [...prev, newUserMessage]);
    if (!suggestedQuery) {
      setInputValue('');
    }
    setIsLoading(true);

    const coachInput: AiSleepCoachInput = {
      currentQuery: query,
      userProfile: {
        age: userProfile.age ? parseInt(userProfile.age, 10) : undefined,
        stressLevel: userProfile.stressLevel || undefined,
        lifestyle: userProfile.lifestyle || undefined,
      },
    };

    try {
      const aiResponse = await aiSleepCoach(coachInput);
      const newAssistantMessage: Message = {
        id: Date.now().toString() + '-assistant',
        role: 'assistant',
        content: '', // Start empty for typewriter
        fullText: aiResponse.advice,
        isTyping: true,
        followUpQuestions: aiResponse.followUpQuestions,
      };
      setMessages((prev) => [...prev, newAssistantMessage]);
      setCurrentlyTypingMessageId(newAssistantMessage.id);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorResponseMessage: Message = {
        id: Date.now().toString() + '-error',
        role: 'assistant',
        content: t('errorResponse'),
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
    // Simulate submitting the follow-up question
    // Need a dummy event or refactor handleSubmit
    const dummyEvent = { preventDefault: () => {} } as FormEvent;
    handleSubmit(dummyEvent, question);
  };


  return (
    <div className="flex flex-col h-full w-full bg-transparent text-foreground"> {/* Removed overflow-hidden */}
      <Accordion type="single" collapsible className="px-3 py-2 border-b border-border/30">
        <AccordionItem value="personalize" className="border-b-0">
          <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline py-2.5">
            <div className='flex items-center'>
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              {t('personalizeAdviceLabel')}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-3 pb-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="age" className="text-xs text-muted-foreground">{t('ageLabel')}</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder={t('agePlaceholder')}
                  value={userProfile.age}
                  onChange={(e) => handleProfileChange('age', e.target.value)}
                  className="mt-1 h-9 text-sm bg-input/70 placeholder:text-muted-foreground/60"
                />
              </div>
              <div>
                <Label htmlFor="stressLevel" className="text-xs text-muted-foreground">{t('stressLevelLabel')}</Label>
                <Select
                  value={userProfile.stressLevel}
                  onValueChange={(value) => handleProfileChange('stressLevel', value)}
                >
                  <SelectTrigger id="stressLevel" className="mt-1 h-9 text-sm bg-input/70 text-muted-foreground data-[placeholder]:text-muted-foreground/60">
                    <SelectValue placeholder={t('stressLevelPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('stressLevels.low')}</SelectItem>
                    <SelectItem value="medium">{t('stressLevels.medium')}</SelectItem>
                    <SelectItem value="high">{t('stressLevels.high')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lifestyle" className="text-xs text-muted-foreground">{t('lifestyleLabel')}</Label>
                <Input
                  id="lifestyle"
                  placeholder={t('lifestylePlaceholder')}
                  value={userProfile.lifestyle}
                  onChange={(e) => handleProfileChange('lifestyle', e.target.value)}
                  className="mt-1 h-9 text-sm bg-input/70 placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <ScrollArea className="flex-grow p-3 sm:p-4 space-y-4 min-h-0"> {/* Ensure min-h-0 for flex scroll */}
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className={cn(
              'flex items-end gap-2.5 w-full',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.role === 'assistant' && (
              <Avatar className="h-7 w-7 self-start shrink-0">
                <AvatarImage src="/bot-avatar.png" alt="SlumberAI" data-ai-hint="robot happy" />
                <AvatarFallback><Brain className="h-4 w-4 text-primary"/></AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                'p-3 rounded-lg max-w-[85%] shadow-md group relative', // Added group for copy button positioning
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-card text-card-foreground border border-border/50 rounded-bl-none'
              )}
            >
              <div className="flex-1 min-w-0"> {/* Ensure text container takes up space */}
                {renderMarkdownMessage(msg.content)}
                {msg.isTyping && <span className="animate-blink">▌</span>}
              </div>

              {msg.role === 'assistant' && !msg.isTyping && !msg.isGreeting && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopyMessage(msg.fullText || msg.content)}
                  className="absolute -top-2 -right-2 h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-card hover:bg-accent rounded-full p-1"
                  aria-label={t('copyMessageAriaLabel')}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              )}
            
              {msg.role === 'assistant' && msg.followUpQuestions && msg.followUpQuestions.length > 0 && !msg.isTyping && (
                <div className="mt-2.5 pt-2.5 border-t border-border/50 space-y-1.5">
                  {msg.followUpQuestions.map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-1 px-2.5 border-primary/30 text-primary/80 hover:bg-primary/10 hover:text-primary"
                      onClick={() => handleFollowUpClick(q)}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              )}
            </div>

             {msg.role === 'user' && (
                <Avatar className="h-7 w-7 self-start shrink-0">
                    <AvatarImage src="/user-avatar.png" alt="User" data-ai-hint="person generic" />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 p-3 border-t border-border/30 bg-background"
      >
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t('inputPlaceholder')}
          className="flex-grow h-11 rounded-xl bg-input/80 focus:ring-primary focus-visible:ring-primary placeholder:text-muted-foreground/70"
          disabled={isLoading || !!currentlyTypingMessageId}
        />
        <Button 
            type="submit" 
            size="icon" 
            className="h-11 w-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            disabled={isLoading || !inputValue.trim() || !!currentlyTypingMessageId}
            aria-label={t('sendMessageAriaLabel')}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <SendHorizonal className="h-5 w-5" />
          )}
        </Button>
      </form>
    </div>
  );
}

    

    