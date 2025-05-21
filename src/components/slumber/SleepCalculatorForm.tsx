
'use client';

import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { Button } from '@/components/ui/button';
import CustomTimePicker from './CustomTimePicker';
import { Label } from '@/components/ui/label';
import { AlertCircle, CalculatorIcon, Clock } from 'lucide-react';
import { addMinutes, format, set } from 'date-fns';
import { useTranslations } from 'next-intl';

const TIME_TO_FALL_ASLEEP = 15; // minutes
const SLEEP_CYCLE_DURATION = 90; // minutes
const NUM_CYCLES_TO_SUGGEST = [6, 5, 4];

export type CalculationResult = {
  type: 'bedtime' | 'waketime';
  targetTime: string; // Formatted as hh:mm a
  suggestions: Array<{
    time: string; // Formatted as hh:mm a
    cycles: number;
    totalSleepDuration: number; // in minutes
  }>;
};

interface SleepCalculatorFormProps {
  onCalculate: (results: CalculationResult) => void;
}

export default function SleepCalculatorForm({ onCalculate }: SleepCalculatorFormProps) {
  const t = useTranslations('SleepCalculatorForm');
  const [selectedTime, setSelectedTime] = useState('07:00'); 
  const [timeError, setTimeError] = useState<string | null>(null);
  const [showGoToBedNowResults, setShowGoToBedNowResults] = useState(false);
  const [currentTimeForBedNow, setCurrentTimeForBedNow] = useState('');

  useEffect(() => {
    const updateCurrentTime = () => {
      setCurrentTimeForBedNow(format(new Date(), 'hh:mm a'));
    };
    updateCurrentTime(); 
    const timer = setInterval(updateCurrentTime, 60000); 
    return () => clearInterval(timer);
  }, []);

  const calculateBedtimes = (wakeUpDateTime: Date) => {
    const suggestions: CalculationResult['suggestions'] = [];
    NUM_CYCLES_TO_SUGGEST.forEach(cycles => {
      const totalSleepNeeded = cycles * SLEEP_CYCLE_DURATION;
      const bedtime = addMinutes(wakeUpDateTime, -(totalSleepNeeded + TIME_TO_FALL_ASLEEP));
      suggestions.push({
        time: format(bedtime, 'hh:mm a'),
        cycles,
        totalSleepDuration: totalSleepNeeded,
      });
    });
    onCalculate({
      type: 'bedtime',
      targetTime: format(wakeUpDateTime, 'hh:mm a'),
      suggestions
    });
    setShowGoToBedNowResults(false);
  };

  const calculateWakeTimes = (bedTimeDateTime: Date) => {
    const suggestions: CalculationResult['suggestions'] = [];
    NUM_CYCLES_TO_SUGGEST.forEach(cycles => {
      const totalSleepObtained = cycles * SLEEP_CYCLE_DURATION;
      const effectiveBedTime = addMinutes(bedTimeDateTime, TIME_TO_FALL_ASLEEP);
      const wakeUpTime = addMinutes(effectiveBedTime, totalSleepObtained);
      suggestions.push({
        time: format(wakeUpTime, 'hh:mm a'),
        cycles,
        totalSleepDuration: totalSleepObtained,
      });
    });
    onCalculate({
      type: 'waketime',
      targetTime: format(bedTimeDateTime, 'hh:mm a'),
      suggestions
    });
  };

  const handleCalculateBedtime = () => {
    if (!selectedTime) {
      setTimeError(t('errorSelectWakeUpTime'));
      return;
    }
    setTimeError(null);
    try {
      const [hoursStr, minutesStr] = selectedTime.split(':');
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);

      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        setTimeError(t('errorInvalidTimePicker'));
        console.error("Invalid time components from selectedTime:", selectedTime);
        return;
      }

      const referenceDateForCalc = new Date(2000, 0, 1); 
      const parsedWakeUpTime = set(referenceDateForCalc, { hours, minutes, seconds: 0, milliseconds: 0 });

      if (isNaN(parsedWakeUpTime.getTime())) {
        setTimeError(t('errorInvalidTimeFormat'));
        console.error("Error creating date object from time:", selectedTime, hours, minutes);
        return;
      }
      calculateBedtimes(parsedWakeUpTime);
    } catch (error) {
      setTimeError(t('errorBedtimeCalculation'));
      console.error("Error in handleCalculateBedtime:", error);
    }
  };

  const handleCalculateWakeUpNow = () => {
    setTimeError(null);
    const now = new Date();
    calculateWakeTimes(now);
    setShowGoToBedNowResults(true);
  };

  const handleTimeChange = useCallback((newTime: string) => {
    setSelectedTime(newTime);
    if (timeError) setTimeError(null);
    setShowGoToBedNowResults(false);
  }, [timeError]); // Dependencies for useCallback

  return (
    <div className="w-full space-y-8">
      <div className="space-y-4">
        <Label htmlFor="wakeUpTimePicker" className="block text-md font-medium text-center text-muted-foreground mb-1">
          {t('wakeUpAtLabel')}
        </Label>
        <CustomTimePicker
          value={selectedTime}
          onChange={handleTimeChange} // Use memoized handler
        />
        {timeError && !showGoToBedNowResults && (
          <p className="text-sm text-destructive flex items-center gap-1 pt-1 justify-center">
            <AlertCircle className="h-4 w-4" /> {timeError}
          </p>
        )}
        <Button
          onClick={handleCalculateBedtime}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base py-3 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          size="lg"
        >
          <CalculatorIcon className="mr-2 h-5 w-5" /> {t('calculateBedtimeButton')}
        </Button>
      </div>

      <div className="space-y-4 pt-6 border-t border-border/30">
        <Label className="block text-md font-medium text-center text-muted-foreground mb-1">
          {t('goToBedNowLabel')}
        </Label>
        {currentTimeForBedNow && (
          <p className="text-xs text-muted-foreground text-center mb-2">
            {t('currentTimeLabel')} {currentTimeForBedNow}
          </p>
        )}
        <Button
          onClick={handleCalculateWakeUpNow}
          variant="outline"
          className="w-full border-primary/60 hover:bg-primary/10 text-primary text-base py-3 rounded-lg shadow-md hover:shadow-lg transition-shadow hover:border-primary"
          size="lg"
        >
          <Clock className="mr-2 h-5 w-5" /> {t('calculateWakeUpTimesButton')}
        </Button>
         {timeError && showGoToBedNowResults && (
          <p className="text-sm text-destructive flex items-center gap-1 pt-1 justify-center">
            <AlertCircle className="h-4 w-4" /> {timeError}
          </p>
        )}
      </div>
    </div>
  );
}
