
'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Feather, Loader2, Sparkles, Download, Copy, Check } from 'lucide-react';
import { analyzeDreamSentiment, type AnalyzeDreamSentimentInput, type AnalyzeDreamSentimentOutput } from '@/ai/flows/analyze-dream-sentiment-flow';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface DreamEntry {
  id: string;
  date: string;
  text: string;
  sentiment?: AnalyzeDreamSentimentOutput['primarySentiment'];
  fullDetailedAnalysis?: string;
  displayedAnalysis?: string;
  sentimentColor?: string;
  isAnalyzing?: boolean;
  isTypingAnalysis?: boolean;
  copiedStates?: {
    text: boolean;
    analysis: boolean;
  };
}

const ANIMATION_CONFIG = {
  wordDelay: 500, // 0.5s between words as requested
  punctuationDelay: 800,
  spaceDelay: 100,
  defaultDelay: 50
};

const getSentimentColor = (sentiment?: string): string => {
  if (!sentiment) return 'text-muted-foreground';
  
  const s = sentiment.toLowerCase();
  if (s.includes('positive') || s.includes('joyful') || s.includes('peaceful') || s.includes('exciting')) 
    return 'text-emerald-500';
  if (s.includes('negative') || s.includes('fearful') || s.includes('anxious') || s.includes('sad')) 
    return 'text-rose-500';
  if (s.includes('confusing') || s.includes('bizarre') || s.includes('surreal')) 
    return 'text-violet-500';
  if (s.includes('neutral') || s.includes('mundane') || s.includes('calm')) 
    return 'text-sky-500';
  
  return 'text-foreground/80';
};

const CopyButton = ({ 
  text, 
  variant = 'outline', 
  size = 'sm' 
}: { 
  text: string; 
  variant?: 'outline' | 'ghost';
  size?: 'sm' | 'xs';
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(
        "transition-all duration-200 hover:scale-105",
        copied && "bg-emerald-50 border-emerald-200 text-emerald-700"
      )}
    >
      {copied ? (
        <button className='py-1 flex items-center px-2'>
          Copied
        </button>
      ) : (
         <button className='py-1 flex items-center px-3'>
          <Copy className="h-3 w-3 mr-1" />
          Copy
        </button>
      )}
    </Button>
  );
};



export default function DreamJournal() {
  const t = useTranslations('DreamJournal');
  const [dreamInput, setDreamInput] = useState('');
  const [loggedDreams, setLoggedDreams] = useState<DreamEntry[]>([]);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const storedDreams = localStorage.getItem('slumberAiDreams');
      if (storedDreams) {
        const parsedDreams = JSON.parse(storedDreams).map((d: DreamEntry) => ({
          ...d,
          isTypingAnalysis: false,
          isAnalyzing: false,
          copiedStates: { text: false, analysis: false }
        }));
        setLoggedDreams(parsedDreams);
      }
    }
  }, []);

  // Persist dreams to localStorage
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      localStorage.setItem('slumberAiDreams', JSON.stringify(loggedDreams));
    }
  }, [loggedDreams, isClient]);

  // Enhanced typewriter effect with word-by-word animation
  useEffect(() => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
    }

    const dreamToType = loggedDreams.find(
      d => d.isTypingAnalysis && 
           d.fullDetailedAnalysis && 
           d.displayedAnalysis !== d.fullDetailedAnalysis
    );

    if (!dreamToType?.fullDetailedAnalysis) return;

    const currentLength = dreamToType.displayedAnalysis?.length || 0;
    const fullText = dreamToType.fullDetailedAnalysis;
    
    if (currentLength < fullText.length) {
      // Find next word boundary or character
      const remainingText = fullText.substring(currentLength);
      const nextWordMatch = remainingText.match(/^(\S+)/);
      const nextChar = fullText.charAt(currentLength);
      
      let delay = ANIMATION_CONFIG.defaultDelay;
      let nextLength = currentLength + 1;

      // Word-by-word animation (0.5s as requested)
      if (nextWordMatch && (currentLength === 0 || fullText.charAt(currentLength - 1) === ' ')) {
        delay = ANIMATION_CONFIG.wordDelay;
        nextLength = currentLength + nextWordMatch[1].length;
      } else if (['.', '!', '?'].includes(nextChar)) {
        delay = ANIMATION_CONFIG.punctuationDelay;
      } else if ([',', ';', ':'].includes(nextChar)) {
        delay = ANIMATION_CONFIG.punctuationDelay / 2;
      } else if (nextChar === ' ') {
        delay = ANIMATION_CONFIG.spaceDelay;
      }

      typewriterTimeoutRef.current = setTimeout(() => {
        setLoggedDreams(prevDreams =>
          prevDreams.map(d =>
            d.id === dreamToType.id
              ? { ...d, displayedAnalysis: fullText.substring(0, nextLength) }
              : d
          )
        );
      }, delay);
    } else {
      // Animation complete - ensure full text is displayed and stop typing
      setLoggedDreams(prevDreams =>
        prevDreams.map(d =>
          d.id === dreamToType.id 
            ? { 
                ...d, 
                isTypingAnalysis: false,
                displayedAnalysis: d.fullDetailedAnalysis // Ensure complete text is shown
              } 
            : d
        )
      );
    }

    return () => {
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current);
      }
    };
  }, [loggedDreams]);

  const handleSubmitDream = async (e: FormEvent) => {
    e.preventDefault();
    if (!dreamInput.trim()) return;

    setIsLoadingAnalysis(true);
    const newDreamId = Date.now().toString();
    const newDreamEntry: DreamEntry = {
      id: newDreamId,
      date: new Date().toISOString(),
      text: dreamInput.trim(),
      isAnalyzing: true,
      isTypingAnalysis: false,
      displayedAnalysis: '',
      copiedStates: { text: false, analysis: false }
    };

    setLoggedDreams(prev => [newDreamEntry, ...prev]);
    setDreamInput('');

    try {
      const sentimentResult = await analyzeDreamSentiment({ 
        dreamText: newDreamEntry.text 
      });
      
      setLoggedDreams(prev =>
        prev.map(dream =>
          dream.id === newDreamId
            ? {
                ...dream,
                sentiment: sentimentResult.primarySentiment,
                fullDetailedAnalysis: sentimentResult.detailedAnalysis,
                sentimentColor: getSentimentColor(sentimentResult.primarySentiment),
                isAnalyzing: false,
                isTypingAnalysis: true,
                displayedAnalysis: ''
              }
            : dream
        )
      );
    } catch (error) {
      console.error('Error analyzing dream sentiment:', error);
      setLoggedDreams(prev =>
        prev.map(dream =>
          dream.id === newDreamId
            ? {
                ...dream,
                sentiment: t('analysisError'),
                fullDetailedAnalysis: t('analysisErrorDetails'),
                displayedAnalysis: t('analysisErrorDetails'),
                sentimentColor: 'text-red-500',
                isAnalyzing: false,
                isTypingAnalysis: false
              }
            : dream
        )
      );
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const handleExportToPdf = async () => {
    if (loggedDreams.length === 0 || !isClient) return;

    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;
      let yPos = margin;

      // Title
      doc.setFontSize(28);
      doc.setFont(undefined, 'bold');
      doc.text(t('pdfReportTitle'), pageWidth / 2, yPos + 20, { align: 'center' });
      yPos += 60;

      // Subtitle
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(
        t('pdfReportGenerated', { date: format(new Date(), 'MMMM d, yyyy HH:mm') }),
        pageWidth / 2,
        yPos,
        { align: 'center' }
      );
      yPos += 50;

      // Dream entries
      loggedDreams.slice().reverse().forEach((dream, index) => {
        const dreamTextHeight = doc.splitTextToSize(dream.text || t('pdfNoText'), contentWidth).length * 15;
        const analysisTextHeight = doc.splitTextToSize(dream.fullDetailedAnalysis || '', contentWidth).length * 12;
        const totalHeight = 100 + dreamTextHeight + analysisTextHeight;

        if (yPos + totalHeight > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }

        if (index > 0) {
          yPos += 20;
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 20;
        }

        // Dream header
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(
          t('pdfDreamFrom', { date: format(new Date(dream.date), 'MMMM d, yyyy - hh:mm a') }),
          margin,
          yPos
        );
        yPos += 25;

        // Dream text
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        const dreamLines = doc.splitTextToSize(dream.text || t('pdfNoText'), contentWidth);
        doc.text(dreamLines, margin, yPos);
        yPos += dreamLines.length * 15 + 10;

        // Sentiment
        if (dream.sentiment) {
          doc.setFontSize(10);
          doc.setFont(undefined, 'bold');
          doc.text(`${t('pdfAiSentimentLabel')} ${dream.sentiment}`, margin, yPos);
          yPos += 15;
        }

        // Analysis
        if (dream.fullDetailedAnalysis) {
          doc.setFont(undefined, 'italic');
          const analysisLines = doc.splitTextToSize(dream.fullDetailedAnalysis, contentWidth);
          doc.text(analysisLines, margin, yPos);
          yPos += analysisLines.length * 12 + 20;
        }
      });

      const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
      doc.save(`SlumberAI_Dream_Journal_${timestamp}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
    }
  };

  const isExportDisabled = loggedDreams.length === 0 || 
                          !isClient || 
                          loggedDreams.some(d => d.isAnalyzing || d.isTypingAnalysis);

  return (
    <div className="w-full h-auto md:h-[700px] flex flex-col overflow-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <p className="text-sm text-muted-foreground flex-grow">
          {t('description')}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportToPdf}
          disabled={isExportDisabled}
          className="bg-card/70 hover:bg-card/90 border-border/50 text-foreground w-full sm:w-auto transition-all duration-200 hover:scale-105"
        >
          <Download className="mr-2 h-4 w-4" />
          {t('exportToPdfButton')}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex flex-col bg-card/80 border border-border/30 rounded-lg shadow-inner">
        {/* Dream Input Form */}
        <form onSubmit={handleSubmitDream} className="p-6 border-b border-border/30">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dreamText" className="text-foreground/90">
                {t('dreamInputLabel')}
              </Label>
              <Textarea
                id="dreamText"
                placeholder={t('dreamInputPlaceholder')}
                value={dreamInput}
                onChange={(e) => setDreamInput(e.target.value)}
                rows={4}
                className="bg-input/70 text-foreground placeholder:text-muted-foreground/70 focus:ring-primary min-h-[100px] transition-all duration-200"
                disabled={isLoadingAnalysis}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoadingAnalysis || !dreamInput.trim()}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-105"
            >
              {isLoadingAnalysis ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('analyzingButton')}
                </>
              ) : (
                <>
                  <Feather className="mr-2 h-4 w-4" />
                  {t('logDreamButton')}
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Dreams List */}
        <ScrollArea className="flex-grow p-6">
          <div className="space-y-6">
            {loggedDreams.length === 0 && !isLoadingAnalysis && (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-40" />
                <h3 className="text-lg font-medium mb-2">{t('emptyStateMessage')}</h3>
                <p className="text-sm opacity-70">{t('emptyStateSubMessage')}</p>
              </div>
            )}

            {loggedDreams.map((dream) => (
              <Card
                key={dream.id}
                className="bg-card/80 border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]"
              >
                <CardHeader className="pb-3 pt-4 px-6">
                  <CardTitle className="text-sm font-medium text-primary flex justify-between items-center">
                    <span>
                      {t('dreamEntryTitlePrefix')} {format(new Date(dream.date), 'MMM d, yyyy - hh:mm a')}
                    </span>
                    {dream.isAnalyzing && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </CardTitle>
                </CardHeader>

                <CardContent className="px-6 pb-4 space-y-4">
                  {/* Dream Text */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Dream Content
                      </h4>
                      <CopyButton text={dream.text} variant="ghost" size="xs" />
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 p-3 rounded-md">
                      {dream.text}
                    </p>
                  </div>

                  {/* AI Analysis */}
                  {(dream.sentiment || dream.isTypingAnalysis || dream.displayedAnalysis) && (
                    <div className="space-y-3 pt-3 border-t border-border/40">
                      {dream.sentiment && (
                        <div className={cn("flex items-center gap-2", dream.sentimentColor)}>
                          <Sparkles className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {t('aiSentimentPrefix')} <span className="font-semibold">{dream.sentiment}</span>
                          </span>
                        </div>
                      )}

                      {(dream.displayedAnalysis || dream.fullDetailedAnalysis) && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              AI Analysis
                            </h4>
                            {dream.fullDetailedAnalysis && !dream.isTypingAnalysis && (
                              <CopyButton text={dream.fullDetailedAnalysis} variant="ghost" size="xs" />
                            )}
                          </div>
                          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-3 rounded-md">
                            <p className="text-xs text-muted-foreground italic whitespace-pre-wrap leading-relaxed">
                              "{dream.displayedAnalysis || dream.fullDetailedAnalysis}"
                              {dream.isTypingAnalysis && (
                                <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}