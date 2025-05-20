
'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bot, User, Send, Sparkles, Settings2 } from 'lucide-react';
import { aiSleepCoach, type AiSleepCoachInput, type AiSleepCoachOutput } from '@/ai/flows/ai-sleep-coach';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useTranslations } from 'next-intl';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  followUpQuestions?: string[];
}

export default function ChatAssistant() {
  const t = useTranslations('AiSleepCoach');
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
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      } else {
         scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
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
    setMessages((prev) => [...prev, userMessage]);
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
    <Card className="w-full h-[700px] md:h-[650px] flex flex-col bg-transparent border-0 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-foreground">
          <Sparkles className="h-6 w-6 text-primary" />
          {t('title')}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-0 overflow-hidden">

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

        <ScrollArea className="flex-grow p-4 md:p-6" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col">
                <div
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg max-w-[85%] shadow-sm',
                    message.role === 'user'
                      ? 'ml-auto bg-primary text-primary-foreground'
                      : 'bg-card text-card-foreground border'
                  )}
                >
                  {message.role === 'assistant' && <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-accent flex-shrink-0 mt-0.5" />}
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
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
            {isLoading && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted max-w-[85%] shadow-sm">
                <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-sm animate-pulse text-muted-foreground">{t('loadingResponse')}</p>
              </div>
            )}
             {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center text-center py-10 h-full">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">{t('initialPromptQuestion')}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">{t('initialPromptExample')}</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="p-4 border-t border-border/50 bg-background/70">
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
      </CardContent>
    </Card>
  );
}
