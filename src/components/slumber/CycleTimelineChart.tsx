
'use client';

import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from 'recharts';
import { CardTitle, CardDescription } // Removed Card, CardHeader, CardContent as this component is now a row
from '@/components/ui/card';

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

  const fallAsleepColor = 'hsl(var(--muted-foreground))';
  const cycleColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--chart-1))', 
  ];

  chartDataSegments.push({ name: 'Fall Asleep', value: TIME_TO_FALL_ASLEEP, fill: fallAsleepColor });

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
    <div className="pt-4 pb-4 px-4 sm:px-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t first:border-t-0 border-border/30">
      {/* Left Column: Text Details & Legend */}
      <div className="flex-grow sm:max-w-[calc(100%-160px)] w-full sm:w-auto"> {/* Give more space to text, adjusted max-width */}
        <div className="mb-2">
          <CardTitle className="text-sm sm:text-base font-medium leading-tight text-foreground"> {/* Ensure text color is visible */}
            {isBedtimeSuggestion ?
              `Go to bed: ${suggestedTime}` :
              `Wake up: ${suggestedTime}`
            }
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {cycles} sleep cycles ({Math.floor(totalSleepDuration / 60)}h {totalSleepDuration % 60}m actual sleep).
            {isBedtimeSuggestion && ` (+${TIME_TO_FALL_ASLEEP}m to fall asleep)`}
          </CardDescription>
        </div>
        {/* Custom Legend */}
        <div className="flex flex-wrap justify-start gap-x-3 gap-y-1 text-xs text-muted-foreground mt-2">
          {chartDataSegments.map((segment) => (
              <div key={`legend-${segment.name}`} className="flex items-center gap-1.5"> {/* Increased gap for clarity */}
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.fill }} /> {/* Changed to rounded-full */}
                  {segment.name}
              </div>
          ))}
        </div>
      </div>

      {/* Right Column: Chart */}
      <div className="w-full sm:w-auto sm:flex-shrink-0 sm:w-36 md:w-40"> {/* Adjusted width for chart, ensure it has space */}
        <div className="h-32 md:h-36 w-full"> {/* Increased height for larger chart */}
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} trigger="hover" />
              <Pie
                data={chartDataSegments}
                cx="50%"
                cy="50%"
                innerRadius="55%" // Adjusted for thickness
                outerRadius="85%" // Adjusted for size within container
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                animationDuration={500}
                stroke="none" // Explicitly remove default stroke from Pie
              >
                {chartDataSegments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} /> // Removed stroke from Cell
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
