
'use client';

import React, { useState, useEffect, useRef } from 'react';
import './CustomTimePicker.css'; 
import { cn } from '@/lib/utils';

interface CustomTimePickerProps {
  value: string; 
  onChange: (newTime: string) => void; 
}

const hoursArray = Array.from({ length: 12 }, (_, i) => i + 1); 
const minutesArray = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')); 
const periodsArray = ['AM', 'PM'] as const;

type Period = typeof periodsArray[number];

const from24HourFormat = (timeStr: string): { hour: number; minute: number; period: Period } => {
  if (!timeStr || !timeStr.includes(':')) {
    // Default to a common time if input is invalid, e.g., 12:00 AM
    return { hour: 12, minute: 0, period: 'AM' };
  }
  const [h, m] = timeStr.split(':').map(Number);
  const currentPeriod = h >= 12 ? 'PM' : 'AM';
  let currentHour = h % 12;
  if (currentHour === 0) { 
    currentHour = 12; // 0 and 12 are 12 AM/PM in 12-hour format
  }
  return { hour: currentHour, minute: m, period: currentPeriod };
};

const to24HourFormat = (hour: number, minute: number, period: Period): string => {
  let h = hour;
  if (period === 'PM' && h !== 12) {
    h += 12;
  } else if (period === 'AM' && h === 12) { // 12 AM is 00 hours
    h = 0;
  }
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const ScrollableColumn: React.FC<{
  values: (string | number)[];
  selectedValue: string | number;
  onSelect: (value: string | number) => void;
  itemHeight?: number;
  columnId: string;
  className?: string;
}> = ({ values, selectedValue, onSelect, itemHeight = 64, columnId, className }) => { 
  const scrollRef = useRef<HTMLDivElement>(null);

  // Effect to scroll the selected value to the center
  useEffect(() => {
    if (scrollRef.current) {
      const selectedIndex = values.findIndex(v => String(v) === String(selectedValue));
      if (selectedIndex !== -1) {
        // Delay scrolling slightly to ensure DOM is ready and styles are applied
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            const targetScrollTop = (selectedIndex * itemHeight) - (scrollRef.current.clientHeight / 2) + (itemHeight / 2);
            scrollRef.current.scrollTop = targetScrollTop;
          }
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedValue, values, itemHeight]); // Dependencies ensure this runs when selectedValue or values change

  const handleItemClick = (value: string | number) => {
    onSelect(value); // This will trigger the parent's onChange and then the useEffect above
  };

  return (
    <div 
      className={cn(
        "h-48 w-24 overflow-y-scroll custom-time-picker-no-scrollbar relative snap-y snap-mandatory", // h-48 means 192px, itemHeight 64px, so 3 items visible
         className
      )} 
      ref={scrollRef}
    >
      {/* Spacer div for top padding, allows first item to snap to center */}
      <div style={{ height: `calc(50% - ${itemHeight / 2}px)` }} className="snap-center"></div>
      {values.map((val, index) => (
        <div
          key={`${columnId}-${index}`}
          id={`${columnId}-item-${index}`} // For potential direct manipulation or testing
          onClick={() => handleItemClick(val)}
          className={cn(
            'flex items-center justify-center cursor-pointer transition-all duration-200 ease-out snap-center', 
            String(val) === String(selectedValue) 
              ? 'text-foreground font-bold text-5xl' // Selected item style
              : 'text-muted-foreground text-3xl opacity-50 scale-90', // Unselected items style
          )}
          style={{ height: `${itemHeight}px` }} 
        >
          {columnId === 'minutes' ? String(val).padStart(2, '0') : String(val)}
        </div>
      ))}
      {/* Spacer div for bottom padding, allows last item to snap to center */}
      <div style={{ height: `calc(50% - ${itemHeight / 2}px)` }} className="snap-center"></div>
    </div>
  );
};


export default function CustomTimePicker({ value, onChange }: CustomTimePickerProps) {
  const initialParts = from24HourFormat(value);
  const [displayHour, setDisplayHour] = useState<number>(initialParts.hour);
  const [displayMinute, setDisplayMinute] = useState<number>(initialParts.minute); // Store as number
  const [displayPeriod, setDisplayPeriod] = useState<Period>(initialParts.period);

  // Update internal display state when the external 'value' prop changes
  useEffect(() => {
    const parts = from24HourFormat(value);
    setDisplayHour(parts.hour);
    setDisplayMinute(parts.minute);
    setDisplayPeriod(parts.period);
  }, [value]);

  // Propagate changes upwards when internal display state changes
  useEffect(() => {
    const new24HourTime = to24HourFormat(displayHour, displayMinute, displayPeriod);
    if (new24HourTime !== value) {
      onChange(new24HourTime);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayHour, displayMinute, displayPeriod]); // Removed onChange, value from deps to prevent loops

  const itemH = 64; // Corresponds to h-16 in Tailwind

  return (
    <div className="bg-transparent p-3 rounded-lg w-fit mx-auto relative my-4">
      {/* Highlight box for selected row (the "window") */}
      <div 
        className="absolute top-1/2 left-3 right-3 -translate-y-1/2 pointer-events-none z-0" // z-0 to be behind columns
        style={{ height: `${itemH}px` }} // Should match itemHeight
      >
        <div className="h-full w-full border border-border rounded-md"></div> {/* Use theme's border color */}
      </div>
      <div className="flex justify-center items-center space-x-1 sm:space-x-2 relative z-10"> {/* z-10 to be above highlight */}
        <ScrollableColumn
          columnId="hours"
          values={hoursArray}
          selectedValue={displayHour}
          onSelect={(val) => setDisplayHour(Number(val))}
          itemHeight={itemH}
          className="w-20" // Adjusted width for potentially larger text
        />
        <div className="text-5xl text-foreground select-none font-bold mt-[-2px]">:</div> {/* Style matches selected numbers */}
        <ScrollableColumn
          columnId="minutes"
          values={minutesArray} // These are already strings '00', '01', ...
          selectedValue={String(displayMinute).padStart(2, '0')} // Ensure selectedValue matches format in array
          onSelect={(val) => setDisplayMinute(Number(val))}
          itemHeight={itemH}
          className="w-20"
        />
        <ScrollableColumn
          columnId="period"
          values={periodsArray as unknown as string[]} // Cast for map function
          selectedValue={displayPeriod}
          onSelect={(val) => setDisplayPeriod(val as Period)}
          itemHeight={itemH}
          className="w-24" // Adjusted width
        />
      </div>
    </div>
  );
}
