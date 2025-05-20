
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

  const fallAsleepColor = 'hsl(var(--muted-foreground))';
  const cycleColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--chart-1))', // Repeat for more than 5 cycles
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
    <Card className="bg-transparent border-0 shadow-none rounded-none mt-0 first:mt-0 border-t first:border-t-0 border-border/30">
      <CardContent className="pt-4 pb-4 px-4 sm:px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Column: Text Details & Legend */}
        <div className="flex-grow sm:max-w-[calc(100%-150px)]"> {/* Give more space to text, limit chart width */}
          <div className="mb-2">
            <CardTitle className="text-sm sm:text-base font-medium leading-tight">
              {isBedtimeSuggestion ?
                `Go to bed: ${suggestedTime}` :
                `Wake up: ${suggestedTime}`
              }
            </CardTitle>
            <CardDescription className="text-xs sm:text-xs">
              {cycles} sleep cycles ({Math.floor(totalSleepDuration / 60)}h {totalSleepDuration % 60}m actual sleep).
              {isBedtimeSuggestion && ` (+${TIME_TO_FALL_ASLEEP}m to fall asleep)`}
            </CardDescription>
          </div>
          {/* Custom Legend */}
          <div className="flex flex-wrap justify-start gap-x-3 gap-y-1 text-xs text-muted-foreground mt-2">
            {chartDataSegments.map((segment) => (
                <div key={`legend-${segment.name}`} className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: segment.fill }} />
                    {segment.name}
                </div>
            ))}
          </div>
        </div>

        {/* Right Column: Chart */}
        <div className="w-full sm:w-auto max-w-[120px] sm:max-w-[140px] flex-shrink-0"> {/* Adjusted width */}
          <div className="h-28 sm:h-32 w-full"> {/* Increased height for larger chart */}
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={chartDataSegments}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%" // Adjust for donut thickness
                  outerRadius="90%" // Increased for larger chart
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
        </div>
      </CardContent>
    </Card>
  );
}
