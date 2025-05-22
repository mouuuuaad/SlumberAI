
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Coffee, AlertCircle, Clock, Timer } from 'lucide-react';
import { addMinutes, format, set } from 'date-fns';
import { useTranslations } from 'next-intl';

interface NapType {
  key: string; // for internal reference
  duration: number;
  name: string; // translated
  description: string; // translated
}

export default function NapCalculator() {
  const t = useTranslations('NapOptimizer');

  const napTypesData = [
    { key: 'power', duration: 20 },
    { key: 'nasa', duration: 26 },
    { key: 'shortRestorative', duration: 60 },
    { key: 'fullCycle', duration: 90 },
  ];

  const getTranslatedNapTypes = (): NapType[] => {
    return napTypesData.map(nap => ({
      key: nap.key,
      duration: nap.duration,
      name: t(`napTypes.${nap.key}.name`, {duration: nap.duration}),
      description: t(`napTypes.${nap.key}.description`),
    }));
  };

  const translatedNapTypes = getTranslatedNapTypes();

  const [selectedNapDuration, setSelectedNapDuration] = useState<string>(translatedNapTypes[0].duration.toString());
  const [startTime, setStartTime] = useState('');
  const [napResult, setNapResult] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  
  useEffect(() => {
    // This effect runs only on the client
    setStartTime(format(new Date(), 'HH:mm'));
  }, []);

  const handleUseCurrentTime = () => {
    setStartTime(format(new Date(), 'HH:mm'));
    if(timeError) setTimeError(null);
    if(napResult) setNapResult(null);
  };

  const handleCalculateNap = () => {
    if (!startTime) {
      setTimeError(t('errorEnterStartTime'));
      setNapResult(null);
      return;
    }
    setTimeError(null);
    setNapResult(null);

    try {
      const [hours, minutes] = startTime.split(':').map(Number);

      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        setTimeError(t('errorInvalidTimeFormat'));
        return;
      }
      
      const baseDateForParsing = new Date(2000, 0, 1); 
      const parsedStartTime = set(baseDateForParsing, { hours, minutes, seconds: 0, milliseconds: 0 });

      if (isNaN(parsedStartTime.getTime())) {
        setTimeError(t('errorInvalidTimeFormat'));
        return;
      }

      const napDuration = parseInt(selectedNapDuration, 10);
      const wakeUpTime = addMinutes(parsedStartTime, napDuration);
      const napInfo = translatedNapTypes.find(n => n.duration === napDuration);

      setNapResult(
        t('resultText', {
          napName: napInfo?.name || `${napDuration} min nap`,
          startTime: format(parsedStartTime, 'hh:mm a'),
          wakeUpTime: format(wakeUpTime, 'hh:mm a')
        })
      );
    } catch (error) {
      setTimeError(t('errorProcessTime'));
      console.error("Error calculating nap time:", error);
    }
  };
  
  const selectedNapDetails = translatedNapTypes.find(n => n.duration.toString() === selectedNapDuration);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="napType" className="text-foreground/90">{t('napTypeLabel')}</Label>
        <Select value={selectedNapDuration} onValueChange={(value) => {
          setSelectedNapDuration(value);
          setNapResult(null); 
        }}>
          <SelectTrigger id="napType" className="w-full md:w-[280px] bg-input text-foreground focus:bg-input focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-shadow duration-200 shadow-sm hover:shadow-md">
            <SelectValue placeholder={t('selectNapTypePlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {translatedNapTypes.map((nap) => (
              <SelectItem key={nap.duration} value={nap.duration.toString()}>
                {nap.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedNapDetails && <p className="text-sm text-muted-foreground pt-1.5">{selectedNapDetails.description}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="startTime" className="text-foreground/90">{t('startTimeLabel')}</Label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Input
            id="startTime"
            type="time" 
            value={startTime}
            onChange={(e) => {
                setStartTime(e.target.value)
                if(timeError) setTimeError(null);
                if(napResult) setNapResult(null);
            }}
            className="w-full sm:w-auto flex-grow bg-input text-foreground focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-shadow duration-200 shadow-sm hover:shadow-md"
            />
            <Button 
                variant="outline" 
                onClick={handleUseCurrentTime} 
                className="w-full sm:w-auto text-xs sm:text-sm border-primary/50 text-primary/80 hover:text-primary hover:bg-primary/10 transition-all duration-200 shadow-sm hover:shadow-md"
            >
                <Timer className="mr-1.5 h-3.5 w-3.5" /> {t('useCurrentTimeButton')}
            </Button>
        </div>
        {timeError && (
          <p className="text-sm text-destructive flex items-center gap-1 pt-1">
            <AlertCircle className="h-4 w-4" /> {timeError}
          </p>
        )}
      </div>

      <Button 
        onClick={handleCalculateNap} 
        className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 transform"
        size="lg"
      >
        <Coffee className="mr-2 h-5 w-5" /> {t('calculateButton')}
      </Button>

      {napResult && (
        <Card className="mt-6 bg-primary/10 border-primary/30 shadow-lg">
          <CardContent className="p-4 sm:p-5">
            <p className="text-center font-medium text-primary flex items-center justify-center gap-2 text-sm sm:text-base">
              <Clock className="h-5 w-5"/> {napResult}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
