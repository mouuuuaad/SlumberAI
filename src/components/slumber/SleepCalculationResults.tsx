'use client';

import type { CalculationResult } from '../../app/page'; // Adjusted import path
import CycleTimelineChart from './CycleTimelineChart';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Zap, Bed, Sunrise } from 'lucide-react';

interface SleepCalculationResultsProps {
  results: CalculationResult | null;
}

export default function SleepCalculationResults({ results }: SleepCalculationResultsProps) {
  if (!results) {
    return null;
  }

  const { type, targetTime, suggestions } = results;

  return (
    <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
      <Card className="bg-card/50 text-left">
        <CardHeader className="pb-3 pt-5 px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
            {type === 'bedtime' ? 
              <Bed className="h-5 w-5 text-primary" /> : 
              <Sunrise className="h-5 w-5 text-primary" />
            }
            Sleep Plan
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {type === 'bedtime'
              ? `To wake up at ${targetTime}, consider these bedtimes:`
              : `If you go to bed around ${targetTime}, aim to wake up at:`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0 sm:px-1 sm:pb-1">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <CycleTimelineChart
                key={index}
                cycles={suggestion.cycles}
                totalSleepDuration={suggestion.totalSleepDuration}
                isBedtimeSuggestion={type === 'bedtime'}
                suggestedTime={suggestion.time}
                targetTime={targetTime}
              />
            ))
          ) : (
            <p className="px-4 sm:px-6 pb-4 text-center text-muted-foreground text-sm">No suggestions available for the selected time.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
