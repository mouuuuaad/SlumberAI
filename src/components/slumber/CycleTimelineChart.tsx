
'use client';

const TIME_TO_FALL_ASLEEP = 15; // minutes
const SLEEP_CYCLE_DURATION = 90; // minutes

interface CycleTimelineChartProps {
  cycles: number;
  totalSleepDuration: number; // in minutes, this is actual sleep (cycles * 90)
  isBedtimeSuggestion: boolean; // True if calculating bedtime, false if calculating wake-up time
  suggestedTime: string; // The bedtime or wake-up time being suggested
  targetTime: string; // The user's desired wake-up time or current time if "go to bed now"
}

interface LegendSegment {
  name: string;
  fill: string;
}

export default function CycleTimelineChart({ cycles, totalSleepDuration, isBedtimeSuggestion, suggestedTime }: CycleTimelineChartProps) {
  const legendSegments: LegendSegment[] = [];

  const fallAsleepColor = 'hsl(var(--muted))';
  const cycleColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--chart-1))', // Cycle through colors if more than 5 cycles
  ];

  legendSegments.push({ name: 'Fall Asleep', fill: fallAsleepColor });

  for (let i = 0; i < cycles; i++) {
    legendSegments.push({ name: `Cycle ${i + 1}`, fill: cycleColors[i % cycleColors.length] });
  }

  return (
    <div className="py-4 px-4 sm:px-6 border-t first:border-t-0 border-border/30">
      <p className="text-lg md:text-xl font-semibold text-foreground mb-1">
        {isBedtimeSuggestion ?
          `Go to bed: ${suggestedTime}` :
          `Wake up: ${suggestedTime}`
        }
      </p>
      <p className="text-sm text-foreground/80 mb-3">
        {cycles} sleep cycles ({Math.floor(totalSleepDuration / 60)}h {totalSleepDuration % 60}m actual sleep).
        {isBedtimeSuggestion && ` (+${TIME_TO_FALL_ASLEEP}m to fall asleep)`}
      </p>
      
      {/* Custom Legend */}
      <div className="flex flex-wrap justify-start gap-x-4 gap-y-2 text-sm text-foreground/80">
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
