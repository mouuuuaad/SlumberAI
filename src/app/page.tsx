'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/slumber/Header';
import SleepCalculationResults from '@/components/slumber/SleepCalculationResults';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Moon, Clock, AlertCircle } from 'lucide-react';
import { addMinutes, format, parse, set } from 'date-fns';

// Constants for sleep calculation
const TIME_TO_FALL_ASLEEP = 15; // minutes
const SLEEP_CYCLE_DURATION = 90; // minutes
const NUM_CYCLES_TO_SUGGEST = [6, 5, 4]; // Suggest 6, 5, or 4 cycles (longest sleep first)

export type CalculationResult = {
  type: 'bedtime' | 'waketime';
  targetTime: string; 
  suggestions: Array<{
    time: string; 
    cycles: number;
    totalSleepDuration: number; 
  }>;
};

export default function HomePage() {
  const [desiredWakeUpTime, setDesiredWakeUpTime] = useState('');
  const [timeErrorWakeUp, setTimeErrorWakeUp] = useState<string | null>(null);
  const [bedtimeSuggestions, setBedtimeSuggestions] = useState<CalculationResult | null>(null);
  
  const [wakeUpTimeSuggestions, setWakeUpTimeSuggestions] = useState<CalculationResult | null>(null);
  const [timeErrorBedNow, setTimeErrorBedNow] = useState<string | null>(null);

  useEffect(() => {
    // Set initial desiredWakeUpTime to a common time like 07:00 AM
    // This runs only on the client after hydration.
    const sevenAM = set(new Date(), { hours: 7, minutes: 0, seconds: 0, milliseconds: 0 });
    setDesiredWakeUpTime(format(sevenAM, 'HH:mm'));
  }, []);

  const handleCalculateBedtime = () => {
    if (!desiredWakeUpTime) {
      setTimeErrorWakeUp('Please select a wake-up time.');
      setBedtimeSuggestions(null);
      return;
    }
    setTimeErrorWakeUp(null);
    setBedtimeSuggestions(null);


    try {
      const baseDate = '2000-01-01'; // Fixed date for consistent time parsing
      const parsedWakeUpTime = parse(`${baseDate}T${desiredWakeUpTime}`, `${baseDate}THH:mm`, new Date());

      if (isNaN(parsedWakeUpTime.getTime())) {
        setTimeErrorWakeUp('Invalid time format. Please use HH:MM.');
        return;
      }
      
      const suggestions: CalculationResult['suggestions'] = [];
      NUM_CYCLES_TO_SUGGEST.forEach(cycles => {
        const totalSleepNeeded = cycles * SLEEP_CYCLE_DURATION;
        // To wake up at parsedWakeUpTime, subtract sleep duration and time to fall asleep
        const bedtime = addMinutes(parsedWakeUpTime, -(totalSleepNeeded + TIME_TO_FALL_ASLEEP));
        suggestions.push({
          time: format(bedtime, 'hh:mm a'),
          cycles,
          totalSleepDuration: totalSleepNeeded,
        });
      });
      
      setBedtimeSuggestions({ type: 'bedtime', targetTime: format(parsedWakeUpTime, 'hh:mm a'), suggestions });

    } catch (error) {
      setTimeErrorWakeUp('Could not calculate bedtime. Please ensure the time is valid.');
      console.error("Error calculating bedtime:", error);
    }
  };

  const handleCalculateWakeUpTimeNow = () => {
    setTimeErrorBedNow(null);
    setWakeUpTimeSuggestions(null);
    try {
      const currentTime = new Date();
      
      const suggestions: CalculationResult['suggestions'] = [];
      NUM_CYCLES_TO_SUGGEST.forEach(cycles => {
        const totalSleepObtained = cycles * SLEEP_CYCLE_DURATION;
        // Effective bedtime is current time + time to fall asleep
        const effectiveBedTime = addMinutes(currentTime, TIME_TO_FALL_ASLEEP); 
        const wakeUpTime = addMinutes(effectiveBedTime, totalSleepObtained);
        suggestions.push({
          time: format(wakeUpTime, 'hh:mm a'),
          cycles,
          totalSleepDuration: totalSleepObtained,
        });
      });
      setWakeUpTimeSuggestions({ type: 'waketime', targetTime: format(currentTime, 'hh:mm a'), suggestions });

    } catch (error) {
      setTimeErrorBedNow('Could not calculate wake-up time.');
      console.error("Error calculating wake-up time from now:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-10 md:py-16 flex flex-col items-center justify-center space-y-10 md:space-y-16">
        
        <section className="w-full max-w-xs sm:max-w-sm text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-5 sm:mb-6">What time do you want to wake up?</h2>
          <div className="bg-card p-1 rounded-lg mb-5 sm:mb-6 shadow-md w-full">
            <Input
              id="desiredWakeUpTime"
              type="time"
              value={desiredWakeUpTime}
              onChange={(e) => {
                setDesiredWakeUpTime(e.target.value);
                if (timeErrorWakeUp) setTimeErrorWakeUp(null);
                if (bedtimeSuggestions) setBedtimeSuggestions(null);
              }}
              className="bg-transparent text-card-foreground border-0 focus:ring-0 w-full text-3xl sm:text-4xl font-bold text-center h-auto py-2 sm:py-3 focus-visible:ring-offset-0"
              aria-label="Desired wake-up time"
            />
          </div>
          {timeErrorWakeUp && (
            <p className="text-sm text-destructive flex items-center justify-center gap-1 mb-4">
              <AlertCircle className="h-4 w-4" /> {timeErrorWakeUp}
            </p>
          )}
          <Button onClick={handleCalculateBedtime} className="w-full text-base sm:text-lg py-3 rounded-lg shadow-md font-medium">
            Calculate bedtime <Moon className="ml-2 h-5 w-5" />
          </Button>
          {bedtimeSuggestions && <SleepCalculationResults results={bedtimeSuggestions} />}
        </section>

        <section className="w-full max-w-xs sm:max-w-sm text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-5 sm:mb-6">If you want to go to bed now...</h2>
          {timeErrorBedNow && (
            <p className="text-sm text-destructive flex items-center justify-center gap-1 mb-4">
              <AlertCircle className="h-4 w-4" /> {timeErrorBedNow}
            </p>
          )}
          <Button onClick={handleCalculateWakeUpTimeNow} className="w-full text-base sm:text-lg py-3 rounded-lg shadow-md font-medium">
            Calculate wake-up time <Clock className="ml-2 h-5 w-5" />
          </Button>
          {wakeUpTimeSuggestions && <SleepCalculationResults results={wakeUpTimeSuggestions} />}
        </section>
      </main>
      <footer className="py-8 text-center text-xs sm:text-sm text-muted-foreground border-t border-border/30">
        <p>&copy; {new Date().getFullYear()} SIA Webby | Terms and Privacy Policy</p>
      </footer>
    </div>
  );
}
