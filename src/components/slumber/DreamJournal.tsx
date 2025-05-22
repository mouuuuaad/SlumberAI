
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Feather, Loader2, Sparkles, Download } from 'lucide-react';
import { analyzeDreamSentiment, type AnalyzeDreamSentimentInput, type AnalyzeDreamSentimentOutput } from '@/ai/flows/analyze-dream-sentiment-flow';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
// Removed static import: import jsPDF from 'jspdf';
import { useTranslations } from 'next-intl';

interface DreamEntry {
  id: string;
  date: string; // ISO string
  text: string;
  sentiment?: AnalyzeDreamSentimentOutput['primarySentiment'];
  detailedAnalysis?: AnalyzeDreamSentimentOutput['detailedAnalysis'];
  sentimentColor?: string;
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
  const t = useTranslations('DreamJournal');
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
                detailedAnalysis: sentimentResult.detailedAnalysis,
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
            ? { ...dream, sentiment: t('analysisError'), detailedAnalysis: t('analysisErrorDetails'), sentimentColor: 'text-red-500', isAnalyzing: false }
            : dream
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToPdf = async () => { // Make function async
    if (loggedDreams.length === 0 || !isClient) {
      console.log("No dreams to export or client not ready.");
      return;
    }

    const { default: jsPDF } = await import('jspdf'); // Dynamic import

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
    const lineSpacing = 7; 

    // Cover Page
    doc.setFontSize(28);
    doc.setFont(undefined, 'bold');
    doc.text(t('pdfReportTitle'), pageWidth / 2, yPos + 20, { align: 'center' });
    yPos += 60;

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(t('pdfReportGenerated', { date: format(new Date(), 'MMMM d, yyyy HH:mm') }), pageWidth / 2, yPos, { align: 'center' });
    yPos += 30;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.text(t('pdfReportSubtitle'), pageWidth / 2, yPos, { align: 'center' });


    // Dreams
    loggedDreams.slice().reverse().forEach((dream, index) => {
      const minHeightForDream = 60 + (dream.text.length / 50 * (11 + lineSpacing)) + ((dream.detailedAnalysis?.length ?? 0) / 50 * (10 + lineSpacing));
      if (yPos + minHeightForDream > pageHeight - margin * 1.5) { 
        doc.addPage();
        yPos = margin;
      }
      
      if (index > 0 || yPos !== margin) {
          yPos += 20; 
          doc.setDrawColor(200, 200, 200); 
          doc.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 20; 
      }

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(50, 50, 50); 
      doc.text(t('pdfDreamFrom', { date: format(new Date(dream.date), 'MMMM d, yyyy - hh:mm a') }), margin, yPos);
      yPos += 14 + lineSpacing + 5;

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0); 
      doc.text(t('pdfDreamTextLabel'), margin, yPos);
      yPos += 11 + lineSpacing /2;
      const dreamTextLines = doc.splitTextToSize(dream.text || t('pdfNoText'), contentWidth);
      doc.text(dreamTextLines, margin, yPos);
      yPos += (dreamTextLines.length * (11 + lineSpacing)) + lineSpacing;

      if (dream.sentiment) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text(t('pdfAiSentimentLabel'), margin, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(dream.sentiment, margin + doc.getTextWidth(t('pdfAiSentimentLabel')) + 5, yPos);
        yPos += 10 + lineSpacing;
      }

      if (dream.detailedAnalysis) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text(t('pdfAiAnalysisLabel'), margin, yPos);
        yPos += 10 + lineSpacing/2;
        doc.setFont(undefined, 'italic');
        doc.setTextColor(50, 50, 50);
        const analysisLines = doc.splitTextToSize(dream.detailedAnalysis, contentWidth);
        doc.text(analysisLines, margin, yPos);
        yPos += (analysisLines.length * (10 + lineSpacing));
      }
    });
    
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    doc.save(`SlumberAI_Dream_Journal_${timestamp}.pdf`);
  };

  return (
    <div className="w-full h-auto md:h-[700px] flex flex-col overflow-hidden">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left flex-grow">
                {t('description')}
            </p>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportToPdf} 
                disabled={loggedDreams.length === 0 || !isClient}
                className="bg-card/70 hover:bg-card/90 border-border/50 text-foreground w-full sm:w-auto"
            >
                <Download className="mr-2 h-4 w-4" />
                {t('exportToPdfButton')}
            </Button>
        </div>
      <div className="flex-grow flex flex-col bg-card/80 border border-border/30 rounded-lg shadow-inner">
        <form onSubmit={handleSubmitDream} className="p-4 md:px-6 md:pt-4 md:pb-4 border-b border-border/30">
          <div className="space-y-2 mb-4">
            <Label htmlFor="dreamText" className="text-foreground/90">{t('dreamInputLabel')}</Label>
            <Textarea
              id="dreamText"
              placeholder={t('dreamInputPlaceholder')}
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('analyzingButton')}
              </>
            ) : (
              <>
                <Feather className="mr-2 h-4 w-4" /> {t('logDreamButton')}
              </>
            )}
          </Button>
        </form>

        <ScrollArea className="flex-grow p-4 md:p-6">
          <div className="space-y-6">
            {loggedDreams.length === 0 && !isLoading && (
              <div className="text-center py-10 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t('emptyStateMessage')}</p>
                <p className="text-xs">{t('emptyStateSubMessage')}</p>
              </div>
            )}
            {loggedDreams.map((dream) => (
              <Card key={dream.id} className="bg-card/80 border-border/50 shadow-sm">
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-sm font-medium text-primary flex justify-between items-center">
                    <span>{t('dreamEntryTitlePrefix')} {format(new Date(dream.date), 'MMM d, yyyy - hh:mm a')}</span>
                    {dream.isAnalyzing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{dream.text}</p>
                  {dream.sentiment && (
                    <div className="pt-2 border-t border-border/30">
                      <p className={cn("text-xs font-medium flex items-center gap-1.5", dream.sentimentColor)}>
                        <Sparkles className="h-3.5 w-3.5" />
                        {t('aiSentimentPrefix')} <span className="font-semibold">{dream.sentiment}</span>
                      </p>
                      {dream.detailedAnalysis && <p className="text-xs text-muted-foreground mt-1 italic whitespace-pre-wrap">"{dream.detailedAnalysis}"</p>}
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
