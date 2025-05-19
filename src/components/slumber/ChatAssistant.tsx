'use client';

import { useState, useRef, useEffect } from 'react';
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
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
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
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full h-[600px] flex flex-col bg-card/80"> {/* Adjusted background opacity */}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <MessageSquare className="h-6 w-6 text-primary" />
          AI Sleep Assistant
        </CardTitle>
        <CardDescription>
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
                  'flex items-start gap-3 p-3 rounded-lg max-w-[85%] shadow-sm', // Added shadow-sm
                  message.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground' // User message uses primary, assistant uses muted
                )}
              >
                {message.role === 'assistant' && <Bot className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />} {/* Assistant icon with accent color */}
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                {message.role === 'user' && <User className="h-6 w-6 text-primary-foreground flex-shrink-0 mt-0.5" />}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted max-w-[85%]">
                <Bot className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-sm animate-pulse text-muted-foreground">Thinking...</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="p-4 border-t border-border/50 bg-background/70"> {/* Input area slightly different bg */}
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Ask about sleep..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className="flex-grow bg-input text-foreground placeholder:text-muted-foreground"
            />
            <Button type="submit" disabled={isLoading || !inputValue.trim()} size="icon">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
