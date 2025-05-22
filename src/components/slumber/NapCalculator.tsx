
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
    <div className="space-y-8 py-2">
      <div className="space-y-3">
        <Label htmlFor="napType" className="text-foreground/90 font-medium">{t('napTypeLabel')}</Label>
        <Select value={selectedNapDuration} onValueChange={(value) => {
          setSelectedNapDuration(value);
          setNapResult(null); 
        }}>
          <SelectTrigger 
            id="napType" 
            className="w-full md:w-[300px] bg-input text-foreground rounded-lg h-12 px-4 shadow-md hover:shadow-lg focus:shadow-xl focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-300 ease-in-out"
          >
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
        {selectedNapDetails && <p className="text-sm text-muted-foreground pt-2">{selectedNapDetails.description}</p>}
      </div>

      <div className="space-y-3">
        <Label htmlFor="startTime" className="text-foreground/90 font-medium">{t('startTimeLabel')}</Label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Input
            id="startTime"
            type="time" 
            value={startTime}
            onChange={(e) => {
                setStartTime(e.target.value)
                if(timeError) setTimeError(null);
                if(napResult) setNapResult(null);
            }}
            className="w-full sm:w-auto flex-grow bg-input text-foreground rounded-lg h-12 px-4 shadow-md hover:shadow-lg focus:shadow-xl focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-300 ease-in-out"
            />
            <Button 
                variant="outline" 
                onClick={handleUseCurrentTime} 
                className="w-full sm:w-auto text-sm border-primary/60 text-primary/90 hover:text-primary hover:bg-primary/10 transition-all duration-300 ease-in-out rounded-lg h-12 px-4 shadow-md hover:shadow-lg focus:shadow-xl focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
                <Timer className="mr-2 h-4 w-4" /> {t('useCurrentTimeButton')}
            </Button>
        </div>
        {timeError && (
          <p className="text-sm text-destructive flex items-center gap-1.5 pt-1">
            <AlertCircle className="h-4 w-4" /> {timeError}
          </p>
        )}
      </div>

      <Button 
        onClick={handleCalculateNap} 
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-14 px-8 text-lg shadow-xl hover:shadow-2xl focus:shadow-2xl focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
        size="lg"
      >
        <Coffee className="mr-2 h-5 w-5" /> {t('calculateButton')}
      </Button>

      {napResult && (
        <Card className="mt-8 rounded-xl shadow-xl bg-primary/15 border-primary/40">
          <CardContent className="p-6">
            <p className="text-center font-semibold text-primary text-lg sm:text-xl flex items-center justify-center gap-2.5">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6"/> {napResult}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
    
