
'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bot, User, Send, MessageSquare } from 'lucide-react';
import { chatWithSleepAssistant, type ChatWithSleepAssistantInput, type ChatWithSleepAssistantOutput } from '@/ai/flows/chat-based-sleep-assistant';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      // Radix ScrollArea viewport is the direct child div
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      } else {
        // Fallback for simple div structure if Radix structure isn't found (should not happen with ShadCN)
         scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const input: ChatWithSleepAssistantInput = { query: userMessage.content };
      const result: ChatWithSleepAssistantOutput = await chatWithSleepAssistant(input);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(), 
        role: 'assistant',
        content: result.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling AI assistant:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I had trouble connecting. Please try again in a moment.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full h-[600px] flex flex-col bg-transparent border-0 shadow-none"> 
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-foreground">
          <MessageSquare className="h-6 w-6 text-primary" />
          AI Sleep Assistant
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Ask me anything about sleep! I can offer advice and recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-grow p-4 md:p-6" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
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
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted max-w-[85%] shadow-sm">
                <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-sm animate-pulse text-muted-foreground">SlumberAI is thinking...</p>
              </div>
            )}
             {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center text-center py-10 h-full">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="p-4 border-t border-border/50 bg-background/70">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="E.g., How can I improve my sleep quality?"
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
