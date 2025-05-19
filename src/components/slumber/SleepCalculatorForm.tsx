
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input'; // No longer using standard input for time
import CustomTimePicker from './CustomTimePicker'; // Import the new custom time picker
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, CalculatorIcon, Bed, Clock } from 'lucide-react';
import { addMinutes, format, parse, set } from 'date-fns';

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
  const [calculationMode, setCalculationMode] = useState<'wakeUpAt' | 'goToBedAt'>('wakeUpAt');
  const [selectedTime, setSelectedTime] = useState(''); // Stored as "HH:mm" (24-hour)
  const [timeError, setTimeError] = useState<string | null>(null);
  const [showGoToBedNowResults, setShowGoToBedNowResults] = useState(false);

  // Effect to set default time when component mounts or calculationMode changes
  useEffect(() => {
    let defaultTimeDate = new Date();
    if (calculationMode === 'wakeUpAt') {
      defaultTimeDate = set(defaultTimeDate, { hours: 7, minutes: 0 });
    } else {
      // For "goToBedAt", use current time, but CustomTimePicker will show it
      // No need to explicitly set current time for selectedTime here if picker manages its display
    }
    setSelectedTime(format(defaultTimeDate, 'HH:mm'));
    setShowGoToBedNowResults(false); // Reset this when mode changes
  }, [calculationMode]);


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
      setTimeError('Please select a valid wake-up time.');
      return;
    }
    setTimeError(null);
    try {
      const baseDate = '2000-01-01'; 
      const parsedWakeUpTime = parse(`${baseDate}T${selectedTime}`, `${baseDate}THH:mm`, new Date());
      if (isNaN(parsedWakeUpTime.getTime())) throw new Error("Invalid time");
      calculateBedtimes(parsedWakeUpTime);
    } catch (error) {
      setTimeError('Invalid time format.');
      console.error("Error parsing time:", error);
    }
  };

  const handleCalculateWakeUpNow = () => {
    setTimeError(null);
    const now = new Date();
    calculateWakeTimes(now);
    setShowGoToBedNowResults(true); // Indicate that "go to bed now" results are showing
  };
  
  // Initialize selectedTime for the CustomTimePicker if it's empty
  // This effect ensures that the CustomTimePicker has a valid initial value.
  useEffect(() => {
    if (!selectedTime) {
      const defaultTime = calculationMode === 'wakeUpAt' 
        ? set(new Date(), { hours: 7, minutes: 0 }) 
        : new Date();
      setSelectedTime(format(defaultTime, 'HH:mm'));
    }
  }, [selectedTime, calculationMode]);


  return (
    <Card className="w-full bg-transparent border-0 shadow-none">
      <CardHeader className="pb-6 pt-2 text-center">
        <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground flex items-center justify-center gap-2">
          <Bed className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          Sleep Calculator
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground pt-1">
          Calculates optimal sleep times based on 90-minute sleep cycles.
          Assumes 15 minutes to fall asleep.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Section 1: Calculate Bedtime */}
        <div className="space-y-4 p-6 rounded-xl bg-card/30 backdrop-blur-sm shadow-lg">
          <Label htmlFor="wakeUpTimePicker" className="block text-lg font-medium text-center text-foreground/90 mb-3">
            What time do you want to wake up?
          </Label>
          {selectedTime && ( // Ensure selectedTime is initialized before rendering CustomTimePicker
            <CustomTimePicker
              value={selectedTime}
              onChange={(newTime) => {
                setSelectedTime(newTime);
                if (timeError) setTimeError(null);
                setShowGoToBedNowResults(false); // Clear "bed now" results if time is changed
              }}
            />
          )}
          {timeError && calculationMode === 'wakeUpAt' && !showGoToBedNowResults && (
            <p className="text-sm text-destructive flex items-center gap-1 pt-1 justify-center">
              <AlertCircle className="h-4 w-4" /> {timeError}
            </p>
          )}
          <Button 
            onClick={handleCalculateBedtime} 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base py-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            size="lg"
          >
            <CalculatorIcon className="mr-2 h-5 w-5" /> Calculate Bedtime
          </Button>
        </div>

        {/* Section 2: Calculate Wake-up Time (If I go to bed now) */}
        <div className="space-y-4 p-6 rounded-xl bg-card/30 backdrop-blur-sm shadow-lg">
          <Label className="block text-lg font-medium text-center text-foreground/90 mb-3">
            If you want to go to bed now...
          </Label>
          <p className="text-sm text-muted-foreground text-center">
            Current time: {format(new Date(), 'hh:mm a')}
          </p>
          <Button 
            onClick={handleCalculateWakeUpNow} 
            variant="outline"
            className="w-full border-primary/70 hover:bg-primary/10 text-primary text-base py-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            size="lg"
          >
            <Clock className="mr-2 h-5 w-5" /> Calculate Wake-up Times
          </Button>
           {timeError && showGoToBedNowResults && ( // Only show error if relevant to this section
            <p className="text-sm text-destructive flex items-center gap-1 pt-1 justify-center">
              <AlertCircle className="h-4 w-4" /> {timeError}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
