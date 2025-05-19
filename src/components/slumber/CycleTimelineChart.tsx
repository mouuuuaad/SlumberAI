'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const TIME_TO_FALL_ASLEEP = 15; // minutes
const SLEEP_CYCLE_DURATION = 90; // minutes

interface CycleTimelineChartProps {
  cycles: number;
  totalSleepDuration: number; // in minutes
  isBedtimeSuggestion: boolean; // true if suggesting bedtimes, false if suggesting wake times
  suggestedTime: string; // The actual bedtime or wake-up time being visualized
  targetTime: string; // The user's desired wake-up or bedtime
}

interface ChartSegment {
  name: string;
  duration: number;
}

export default function CycleTimelineChart({ cycles, totalSleepDuration, isBedtimeSuggestion, suggestedTime, targetTime }: CycleTimelineChartProps) {
  const chartDataSegments: ChartSegment[] = [];
  
  chartDataSegments.push({ name: 'Fall Asleep', duration: TIME_TO_FALL_ASLEEP });
  for (let i = 1; i <= cycles; i++) {
    chartDataSegments.push({ name: `Cycle ${i}`, duration: SLEEP_CYCLE_DURATION });
  }

  // Data for Recharts BarChart (needs to be an array of objects)
  // Each object will represent a "row" in the vertical bar chart. Here, just one row.
  // The properties of the object are the segments of the stack.
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
    'hsl(var(--chart-1))' // Repeat for 6th cycle
  ];
  const fallAsleepColor = 'hsl(var(--muted-foreground)/0.7)';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Find which segment this is by dataKey
      const dataKey = payload[0].dataKey; // e.g., "segment0", "segment1"
      const segmentIndex = parseInt(dataKey.replace('segment', ''), 10);
      const segmentInfo = chartDataSegments[segmentIndex];
      
      return (
        <div className="p-2 bg-popover border rounded-md shadow-lg">
          <p className="font-medium">{`${segmentInfo.name}: ${segmentInfo.duration} mins`}</p>
        </div>
      );
    }
    return null;
  };


  return (
    <Card className="mt-4 glassmorphic overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">
          {isBedtimeSuggestion ? `To wake up at ${targetTime}, go to bed at ${suggestedTime}` : `If you go to bed at ${targetTime}, wake up at ${suggestedTime}`}
        </CardTitle>
        <CardDescription>
          This provides {Math.floor(totalSleepDuration / 60)}h {totalSleepDuration % 60}m of sleep ({cycles} cycles), including ~15 mins to fall asleep.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-20 w-full"> {/* Fixed height for the chart area */}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={rechartsFormattedData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              barCategoryGap={0} // No gap between bars in a category (not relevant here)
              barGap={0} // No gap between categories (not relevant here)
            >
              <XAxis type="number" hide domain={[0, 'dataMax + 30']} />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}}/>
              {chartDataSegments.map((segment, index) => (
                <Bar key={`segment-${index}`} dataKey={`segment${index}`} stackId="sleep" fill="transparent" radius={index === chartDataSegments.length -1 || index === 0 ? [5,5,5,5] : [0,0,0,0]}>
                   {/* This Cell approach is needed to color segments of a stacked bar */}
                   <Cell fill={segment.name === 'Fall Asleep' ? fallAsleepColor : cycleColors[ (index-1) % cycleColors.length]} 
                         radius={ 
                           chartDataSegments.length === 1 ? [6,6,6,6] : // single segment
                           index === 0 ? [6,0,0,6] : // first segment
                           index === chartDataSegments.length - 1 ? [0,6,6,0] : // last segment
                           [0,0,0,0] // middle segments
                         }
                   />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-xs">
            <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: fallAsleepColor }} />
                Fall Asleep (15 min)
            </div>
            {Array.from({ length: cycles }).map((_, i) => (
                <div key={`legend-cycle-${i}`} className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: cycleColors[i % cycleColors.length] }} />
                    Cycle {i+1} (90 min)
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
