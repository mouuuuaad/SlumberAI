
'use client';

import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from 'recharts';

const TIME_TO_FALL_ASLEEP = 15; // minutes
const SLEEP_CYCLE_DURATION = 90; // minutes

interface CycleTimelineChartProps {
  cycles: number;
  totalSleepDuration: number; // in minutes, this is actual sleep (cycles * 90)
  isBedtimeSuggestion: boolean; // True if calculating bedtime, false if calculating wake-up time
  suggestedTime: string; // The bedtime or wake-up time being suggested
  targetTime: string; // The user's desired wake-up time or current time if "go to bed now"
}

interface ChartSegment {
  name: string;
  value: number; // duration in minutes
  fill: string;
}

export default function CycleTimelineChart({ cycles, totalSleepDuration, isBedtimeSuggestion, suggestedTime, targetTime }: CycleTimelineChartProps) {
  const chartDataSegments: ChartSegment[] = [];

  const fallAsleepColor = 'hsl(var(--muted))'; // A neutral grey for fall asleep, matching image
  const cycleColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--chart-1))', // Cycle through colors if more than 5 cycles
  ];

  // Add "Fall Asleep" segment first
  chartDataSegments.push({ name: 'Fall Asleep', value: TIME_TO_FALL_ASLEEP, fill: fallAsleepColor });

  // Add sleep cycle segments
  for (let i = 0; i < cycles; i++) {
    chartDataSegments.push({ name: `Cycle ${i + 1}`, value: SLEEP_CYCLE_DURATION, fill: cycleColors[i % cycleColors.length] });
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-2 bg-popover border rounded-md shadow-lg text-popover-foreground">
          <p className="font-medium text-sm">{`${data.name}: ${data.value} mins`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="py-5 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-t first:border-t-0 border-border/30">
      {/* Left Column: Text Details & Legend */}
      <div className="flex-grow w-full sm:w-auto order-2 sm:order-1">
        <div className="mb-3">
          <p className="text-lg md:text-xl font-bold text-foreground mb-1">
            {isBedtimeSuggestion ?
              `Go to bed: ${suggestedTime}` :
              `Wake up: ${suggestedTime}`
            }
          </p>
          <p className="text-sm text-foreground/80">
            {cycles} sleep cycles ({Math.floor(totalSleepDuration / 60)}h {totalSleepDuration % 60}m actual sleep).
            {isBedtimeSuggestion && ` (+${TIME_TO_FALL_ASLEEP}m to fall asleep)`}
          </p>
        </div>
        {/* Custom Legend */}
        <div className="flex flex-wrap justify-start gap-x-4 gap-y-2 text-xs text-foreground/70">
          {chartDataSegments.map((segment) => (
              <div key={`legend-${segment.name}`} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.fill }} />
                  {segment.name}
              </div>
          ))}
        </div>
      </div>

      {/* Right Column: Chart */}
      <div className="w-full sm:w-40 md:w-44 flex-shrink-0 order-1 sm:order-2">
        <div className="h-36 md:h-40 w-full"> 
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} trigger="hover" />
              <Pie
                data={chartDataSegments}
                cx="50%"
                cy="50%"
                innerRadius="65%" 
                outerRadius="100%" 
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                animationDuration={500}
                stroke="none"
              >
                {chartDataSegments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
