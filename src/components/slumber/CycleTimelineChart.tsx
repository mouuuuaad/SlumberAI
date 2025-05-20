
'use client';

import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

  const fallAsleepColor = 'hsl(var(--muted-foreground))'; // Opaque color
  const cycleColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--chart-1))', // Repeat for more than 5 cycles
  ];

  // "Fall Asleep" segment is always part of the process from initiating sleep
  chartDataSegments.push({ name: 'Fall Asleep', value: TIME_TO_FALL_ASLEEP, fill: fallAsleepColor });

  for (let i = 0; i < cycles; i++) {
    chartDataSegments.push({ name: `Cycle ${i + 1}`, value: SLEEP_CYCLE_DURATION, fill: cycleColors[i % cycleColors.length] });
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // Access the individual segment's data
      return (
        <div className="p-2 bg-popover border rounded-md shadow-lg text-popover-foreground">
          <p className="font-medium text-sm">{`${data.name}: ${data.value} mins`}</p>
        </div>
      );
    }
    return null;
  };
  
  const legendPayload = chartDataSegments.map(segment => ({
    value: segment.name,
    type: 'square', // or 'circle', 'rect', etc.
    color: segment.fill,
  }));


  return (
    <Card className="bg-transparent border-0 shadow-none rounded-none mt-0 first:mt-0 border-t first:border-t-0 border-border/30">
      <CardHeader className="py-3 px-4 sm:px-5">
        <CardTitle className="text-sm sm:text-base font-medium leading-tight">
          {isBedtimeSuggestion ?
            `Go to bed: ${suggestedTime}` :
            `Wake up: ${suggestedTime}`
          }
        </CardTitle>
        <CardDescription className="text-xs sm:text-xs">
          {cycles} sleep cycles ({Math.floor(totalSleepDuration / 60)}h {totalSleepDuration % 60}m actual sleep).
          {/* The (+15m to fall asleep) is implicitly part of the "Go to bed" time for bedtime suggestions */}
          {/* and part of the lead-up for "Wake up" suggestions if "go to bed now" was chosen. */}
          {/* The image shows it explicitly, so let's add it if calculating bedtime. */}
          {isBedtimeSuggestion && ` (+${TIME_TO_FALL_ASLEEP}m to fall asleep)`}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-3 px-4 sm:px-5">
        <div className="h-28 w-full mb-1"> {/* Adjusted height for pie chart visibility */}
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chartDataSegments}
                cx="50%"
                cy="50%"
                innerRadius="50%" // Makes it a donut chart
                outerRadius="80%"
                paddingAngle={1}
                dataKey="value"
                nameKey="name"
                animationDuration={500}
              >
                {chartDataSegments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Custom Legend */}
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
            {chartDataSegments.map((segment) => (
                <div key={`legend-${segment.name}`} className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: segment.fill }} />
                    {segment.name}
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
