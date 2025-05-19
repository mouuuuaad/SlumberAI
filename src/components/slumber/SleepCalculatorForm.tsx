'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, CalculatorIcon } from 'lucide-react'; // Changed to CalculatorIcon
import { addMinutes, format, parse, set } from 'date-fns';

const TIME_TO_FALL_ASLEEP = 15; // minutes
const SLEEP_CYCLE_DURATION = 90; // minutes
const NUM_CYCLES_TO_SUGGEST = [6, 5, 4]; 

export type CalculationResult = {
  type: 'bedtime' | 'waketime';
  targetTime: string;
  suggestions: Array<{
    time: string;
    cycles: number;
    totalSleepDuration: number; // in minutes
  }>;
};

interface SleepCalculatorFormProps {
  onCalculate: (results: CalculationResult) => void;
}

export default function SleepCalculatorForm({ onCalculate }: SleepCalculatorFormProps) {
  const [calculationMode, setCalculationMode] = useState<'wakeUpAt' | 'goToBedAt'>('wakeUpAt');
  const [selectedTime, setSelectedTime] = useState('');
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    // Client-side effect to set a default time.
    if (calculationMode === 'wakeUpAt') {
      const sevenAM = set(new Date(), { hours: 7, minutes: 0 });
      setSelectedTime(format(sevenAM, 'HH:mm'));
    } else {
      setSelectedTime(format(new Date(), 'HH:mm'));
    }
  }, [calculationMode]);


  const handleCalculate = () => {
    if (!selectedTime) {
      setTimeError('Please select a time.');
      return;
    }
    setTimeError(null);

    try {
      const baseDate = '2000-01-01'; 
      const parsedTime = parse(`${baseDate}T${selectedTime}`, `${baseDate}THH:mm`, new Date());

      if (isNaN(parsedTime.getTime())) {
        setTimeError('Invalid time format. Please use HH:MM.');
        return;
      }
      
      const suggestions: CalculationResult['suggestions'] = [];

      if (calculationMode === 'wakeUpAt') {
        NUM_CYCLES_TO_SUGGEST.forEach(cycles => {
          const totalSleepNeeded = cycles * SLEEP_CYCLE_DURATION;
          const bedtime = addMinutes(parsedTime, -(totalSleepNeeded + TIME_TO_FALL_ASLEEP));
          suggestions.push({
            time: format(bedtime, 'hh:mm a'),
            cycles,
            totalSleepDuration: totalSleepNeeded,
          });
        });
        onCalculate({ type: 'bedtime', targetTime: format(parsedTime, 'hh:mm a'), suggestions });
      } else { 
        NUM_CYCLES_TO_SUGGEST.forEach(cycles => {
          const totalSleepObtained = cycles * SLEEP_CYCLE_DURATION;
          const effectiveBedTime = addMinutes(parsedTime, TIME_TO_FALL_ASLEEP);
          const wakeUpTime = addMinutes(effectiveBedTime, totalSleepObtained);
          suggestions.push({
            time: format(wakeUpTime, 'hh:mm a'),
            cycles,
            totalSleepDuration: totalSleepObtained,
          });
        });
        onCalculate({ type: 'waketime', targetTime: format(parsedTime, 'hh:mm a'), suggestions });
      }
    } catch (error) {
      setTimeError('Could not parse the time. Please ensure it is valid.');
      console.error("Error calculating sleep times:", error);
    }
  };

  return (
    // Card itself is not glassmorphic as it's inside a glassmorphic container on page.tsx
    <Card className="w-full bg-transparent border-0 shadow-none"> 
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-foreground">
          <CalculatorIcon className="h-6 w-6 text-primary" /> {/* Changed to CalculatorIcon */}
          Sleep Cycle Calculator
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Determine the best times to sleep or wake up based on natural 90-minute sleep cycles.
          It typically takes about 15 minutes to fall asleep.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-foreground/90">I want to:</Label>
          <RadioGroup
            value={calculationMode}
            onValueChange={(value: 'wakeUpAt' | 'goToBedAt') => {
              setCalculationMode(value);
              if (value === 'wakeUpAt') {
                const sevenAM = set(new Date(), { hours: 7, minutes: 0 });
                setSelectedTime(format(sevenAM, 'HH:mm'));
              } else {
                setSelectedTime(format(new Date(), 'HH:mm'));
              }
              setTimeError(null);
            }}
            className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="wakeUpAt" id="wakeUpAt" />
              <Label htmlFor="wakeUpAt" className="font-normal text-foreground/90">Wake up at</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="goToBedAt" id="goToBedAt" />
              <Label htmlFor="goToBedAt" className="font-normal text-foreground/90">Go to bed at</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="selectedTime" className="text-foreground/90">
            {calculationMode === 'wakeUpAt' ? 'Desired Wake-up Time:' : 'Desired Bedtime:'}
          </Label>
          <Input
            id="selectedTime"
            type="time"
            value={selectedTime}
            onChange={(e) => {
              setSelectedTime(e.target.value);
              if (timeError) setTimeError(null);
            }}
            className="w-full md:w-1/2 bg-input text-foreground focus:ring-primary"
          />
           {timeError && (
            <p className="text-sm text-destructive flex items-center gap-1 pt-1">
              <AlertCircle className="h-4 w-4" /> {timeError}
            </p>
          )}
        </div>

        <Button onClick={handleCalculate} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
          Calculate
        </Button>
      </CardContent>
    </Card>
  );
}
