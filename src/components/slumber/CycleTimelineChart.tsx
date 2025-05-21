
'use client';

import { useTranslations } from 'next-intl';

const TIME_TO_FALL_ASLEEP = 15; // minutes

interface LegendSegment {
  name: string;
  fill: string;
}

interface CycleTimelineChartProps {
  cycles: number;
  totalSleepDuration: number; // in minutes, this is actual sleep (cycles * 90)
  isBedtimeSuggestion: boolean; // True if calculating bedtime, false if calculating wake-up time
  suggestedTime: string; // The bedtime or wake-up time being suggested
}

export default function CycleTimelineChart({ cycles, totalSleepDuration, isBedtimeSuggestion, suggestedTime }: CycleTimelineChartProps) {
  const t = useTranslations('SleepCalculatorForm.sleepPlan');
  const legendSegments: LegendSegment[] = [];

  const fallAsleepColor = 'hsl(var(--muted-foreground))';
  const cycleColor = 'hsl(var(--primary))';

  legendSegments.push({ name: t('fallAsleepLegendLabel'), fill: fallAsleepColor });

  for (let i = 0; i < cycles; i++) {
    legendSegments.push({ name: `${t('cycleLegendLabel')} ${i + 1}`, fill: cycleColor });
  }

  const hours = Math.floor(totalSleepDuration / 60);
  const minutes = totalSleepDuration % 60;

  return (
    <div className="py-5 px-4 sm:px-6 border-t first:border-t-0 border-border/30">
      <p className="text-lg md:text-xl font-bold text-foreground mb-1">
        {isBedtimeSuggestion ?
          `${t('goToBedLabel')}: ${suggestedTime}` :
          `${t('wakeUpLabel')}: ${suggestedTime}`
        }
      </p>
      <p className="text-sm text-foreground/80 mb-3">
        {t('cyclesInfo', {
            count: cycles,
            hours: hours,
            minutes: minutes,
            timeToFallAsleep: TIME_TO_FALL_ASLEEP
          })}
      </p>
      
      {/* Custom Legend for text-based list */}
      <div className="flex flex-wrap justify-start gap-x-4 gap-y-2 text-xs text-foreground/70">
        {legendSegments.map((segment) => (
            <div key={`legend-${segment.name}`} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.fill }} />
                {segment.name}
            </div>
        ))}
      </div>
    </div>
  );
}
