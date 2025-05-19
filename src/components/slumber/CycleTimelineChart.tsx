
'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const TIME_TO_FALL_ASLEEP = 15; // minutes
const SLEEP_CYCLE_DURATION = 90; // minutes

interface CycleTimelineChartProps {
  cycles: number;
  totalSleepDuration: number; // in minutes
  isBedtimeSuggestion: boolean;
  suggestedTime: string;
  targetTime: string;
}

interface ChartSegment {
  name: string;
  duration: number;
  isFallAsleep?: boolean;
}

export default function CycleTimelineChart({ cycles, totalSleepDuration, isBedtimeSuggestion, suggestedTime, targetTime }: CycleTimelineChartProps) {
  const chartDataSegments: ChartSegment[] = [];

  if (isBedtimeSuggestion) {
    chartDataSegments.push({ name: 'Fall Asleep', duration: TIME_TO_FALL_ASLEEP, isFallAsleep: true });
  }

  for (let i = 1; i <= cycles; i++) {
    chartDataSegments.push({ name: `Cycle ${i}`, duration: SLEEP_CYCLE_DURATION });
  }

  const rechartsFormattedData = [
    chartDataSegments.reduce((acc, segment, index) => {
      acc[`segment${index}`] = segment.duration;
      acc.total = (acc.total || 0) + segment.duration;
      return acc;
    }, { name: 'Sleep Breakdown' } as any)
  ];

  const cycleColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--chart-1))'
  ];
  // Made fallAsleepColor opaque for consistent hover behavior with cursor highlight
  const fallAsleepColor = 'hsl(var(--muted-foreground))';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataKey = payload[0]?.dataKey;
      const segmentIndex = dataKey ? parseInt(dataKey.replace('segment', ''), 10) : -1;
      const segmentInfo = segmentIndex !== -1 ? chartDataSegments[segmentIndex] : null;

      if (!segmentInfo) return null;

      return (
        <div className="p-2 bg-popover border rounded-md shadow-lg text-popover-foreground">
          <p className="font-medium text-sm">{`${segmentInfo.name}: ${segmentInfo.duration} mins`}</p>
        </div>
      );
    }
    return null;
  };

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
          {isBedtimeSuggestion && ` (+${TIME_TO_FALL_ASLEEP}m to fall asleep)`}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-3 px-4 sm:px-5">
        <div className="h-12 w-full mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={rechartsFormattedData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              barCategoryGap={0}
              barGap={0}
            >
              <XAxis type="number" hide domain={[0, 'dataMax']} />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--accent)/0.1)'}}/>
              {chartDataSegments.map((segment, index) => (
                <Bar key={`segment-${index}`} dataKey={`segment${index}`} stackId="sleep" fill="transparent" activeBar={false}>
                   <Cell
                         fill={segment.isFallAsleep ? fallAsleepColor : cycleColors[isBedtimeSuggestion ? (index-1 + cycleColors.length) % cycleColors.length : index % cycleColors.length]}
                         radius={
                           chartDataSegments.length === 1 ? [3,3,3,3] :
                           index === 0 ? [3,0,0,3] :
                           index === chartDataSegments.length - 1 ? [0,3,3,0] :
                           [0,0,0,0]
                         }
                   />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {isBedtimeSuggestion && (
              <div className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: fallAsleepColor }} />
                  Fall Asleep
              </div>
            )}
            {Array.from({ length: cycles }).map((_, i) => (
                <div key={`legend-cycle-${i}`} className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: cycleColors[i % cycleColors.length] }} />
                    Cycle {i+1}
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
