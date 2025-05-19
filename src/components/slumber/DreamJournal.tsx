
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Feather, Loader2, Sparkles, Download } from 'lucide-react'; // Added Download icon
import { analyzeDreamSentiment, type AnalyzeDreamSentimentInput, type AnalyzeDreamSentimentOutput } from '@/ai/flows/analyze-dream-sentiment-flow';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DreamEntry {
  id: string;
  date: string; // ISO string
  text: string;
  sentiment?: AnalyzeDreamSentimentOutput['primarySentiment'];
  analysis?: AnalyzeDreamSentimentOutput['briefAnalysis'];
  sentimentColor?: string; // e.g., 'text-green-400', 'text-red-400'
  isAnalyzing?: boolean;
}

const getSentimentColor = (sentiment?: string): string => {
  if (!sentiment) return 'text-muted-foreground';
  const s = sentiment.toLowerCase();
  if (s.includes('positive') || s.includes('joyful') || s.includes('peaceful') || s.includes('exciting')) return 'text-green-400';
  if (s.includes('negative') || s.includes('fearful') || s.includes('anxious') || s.includes('sad')) return 'text-red-400';
  if (s.includes('confusing') || s.includes('bizarre') || s.includes('surreal')) return 'text-purple-400';
  if (s.includes('neutral') || s.includes('mundane') || s.includes('calm')) return 'text-blue-400';
  return 'text-foreground/80';
};


export default function DreamJournal() {
  const [dreamInput, setDreamInput] = useState('');
  const [loggedDreams, setLoggedDreams] = useState<DreamEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const storedDreams = localStorage.getItem('slumberAiDreams');
      if (storedDreams) {
        setLoggedDreams(JSON.parse(storedDreams));
      }
    }
  }, []);

  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      localStorage.setItem('slumberAiDreams', JSON.stringify(loggedDreams));
    }
  }, [loggedDreams, isClient]);

  const handleSubmitDream = async (e: FormEvent) => {
    e.preventDefault();
    if (!dreamInput.trim()) return;

    setIsLoading(true);
    const newDreamId = Date.now().toString();
    const newDreamEntry: DreamEntry = {
      id: newDreamId,
      date: new Date().toISOString(),
      text: dreamInput.trim(),
      isAnalyzing: true,
    };

    setLoggedDreams((prevDreams) => [newDreamEntry, ...prevDreams]);
    setDreamInput('');

    try {
      const sentimentResult = await analyzeDreamSentiment({ dreamText: newDreamEntry.text });
      setLoggedDreams((prevDreams) =>
        prevDreams.map((dream) =>
          dream.id === newDreamId
            ? {
                ...dream,
                sentiment: sentimentResult.primarySentiment,
                analysis: sentimentResult.briefAnalysis,
                sentimentColor: getSentimentColor(sentimentResult.primarySentiment),
                isAnalyzing: false,
              }
            : dream
        )
      );
    } catch (error) {
      console.error('Error analyzing dream sentiment:', error);
      setLoggedDreams((prevDreams) =>
        prevDreams.map((dream) =>
          dream.id === newDreamId
            ? { ...dream, sentiment: 'Error analyzing', analysis: 'Could not analyze sentiment.', sentimentColor: 'text-red-500', isAnalyzing: false }
            : dream
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToJson = () => {
    if (loggedDreams.length === 0) {
      // Optionally, show a toast or alert if there are no dreams to export
      console.log("No dreams to export.");
      return;
    }
    // Prepare data for export (remove transient state like isAnalyzing if needed, though current structure is fine)
    const dreamsToExport = loggedDreams.map(({ isAnalyzing, sentimentColor, ...dream }) => dream);

    const jsonString = JSON.stringify(dreamsToExport, null, 2); // null, 2 for pretty printing
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    link.download = `slumberai_dreams_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full h-auto md:h-[700px] flex flex-col bg-transparent border-0 shadow-none">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-foreground">
                    <BookOpen className="h-6 w-6 text-primary" />
                    Dream Journal
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                    Log your dreams and get AI-powered sentiment analysis.
                </CardDescription>
            </div>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportToJson} 
                disabled={loggedDreams.length === 0 || !isClient}
                className="mt-2 sm:mt-0 bg-card/70 hover:bg-card/90 border-border/50 text-foreground"
            >
                <Download className="mr-2 h-4 w-4" />
                Export to JSON
            </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-0 overflow-hidden">
        <form onSubmit={handleSubmitDream} className="p-4 md:px-6 md:pt-2 md:pb-4 border-b border-border/30">
          <div className="space-y-2 mb-4">
            <Label htmlFor="dreamText" className="text-foreground/90">What did you dream about?</Label>
            <Textarea
              id="dreamText"
              placeholder="Describe your dream here..."
              value={dreamInput}
              onChange={(e) => setDreamInput(e.target.value)}
              rows={4}
              className="bg-input/70 text-foreground placeholder:text-muted-foreground/70 focus:ring-primary min-h-[100px]"
              disabled={isLoading}
            />
          </div>
          <Button type="submit" disabled={isLoading || !dreamInput.trim()} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Feather className="mr-2 h-4 w-4" /> Log Dream & Analyze
              </>
            )}
          </Button>
        </form>

        <ScrollArea className="flex-grow p-4 md:p-6">
          <div className="space-y-6">
            {loggedDreams.length === 0 && !isLoading && (
              <div className="text-center py-10 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Your logged dreams will appear here.</p>
                <p className="text-xs">Start by writing down your first dream above!</p>
              </div>
            )}
            {loggedDreams.map((dream) => (
              <Card key={dream.id} className="bg-card/80 border-border/50 shadow-sm">
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-sm font-medium text-primary flex justify-between items-center">
                    <span>Dream from: {format(new Date(dream.date), 'MMM d, yyyy - hh:mm a')}</span>
                    {dream.isAnalyzing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{dream.text}</p>
                  {dream.sentiment && (
                    <div className="pt-2 border-t border-border/30">
                      <p className={cn("text-xs font-medium flex items-center gap-1.5", dream.sentimentColor)}>
                        <Sparkles className="h-3.5 w-3.5" />
                        AI Sentiment: <span className="font-semibold">{dream.sentiment}</span>
                      </p>
                      {dream.analysis && <p className="text-xs text-muted-foreground mt-1 italic">"{dream.analysis}"</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
