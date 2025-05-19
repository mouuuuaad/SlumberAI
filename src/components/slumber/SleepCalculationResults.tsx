'use client';

import type { CalculationResult } from './SleepCalculatorForm';
import CycleTimelineChart from './CycleTimelineChart';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

interface SleepCalculationResultsProps {
  results: CalculationResult | null;
}

export default function SleepCalculationResults({ results }: SleepCalculationResultsProps) {
  if (!results) {
    return null;
  }

  const { type, targetTime, suggestions } = results;

  return (
    <div className="mt-8 space-y-6">
      <Card className="glassmorphic">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Zap className="h-5 w-5 text-primary" />
            Your Sleep Recommendations
          </CardTitle>
          <CardDescription>
            {type === 'bedtime'
              ? `To wake up refreshed at ${targetTime}, consider one of these bedtimes:`
              : `If you go to bed at ${targetTime}, optimal wake-up times are:`}
          </CardDescription>
        </CardHeader>
      </Card>

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
        <p className="text-center text-muted-foreground">No suggestions available for the selected time.</p>
      )}
    </div>
  );
}
