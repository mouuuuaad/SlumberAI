
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import './CustomTimePicker.css'; // For custom scrollbar hiding and potentially other styles
import { cn } from '@/lib/utils';

interface CustomTimePickerProps {
  value: string; // Expected format "HH:mm" (24-hour)
  onChange: (newTime: string) => void; // Emits "HH:mm" (24-hour)
}

const hoursArray = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const minutesArray = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')); // 00-59, as strings
const periodsArray = ['AM', 'PM'] as const;

type Period = typeof periodsArray[number];

// Helper to convert 24-hour "HH:mm" string to 12-hour parts
const from24HourFormat = (timeStr: string): { hour: number; minute: number; period: Period } => {
  if (!timeStr || !timeStr.includes(':')) {
    // Default to a sensible time like 12:00 AM if input is invalid
    return { hour: 12, minute: 0, period: 'AM' };
  }
  const [h, m] = timeStr.split(':').map(Number);
  const currentPeriod = h >= 12 ? 'PM' : 'AM';
  let currentHour = h % 12;
  if (currentHour === 0) { // 12 AM or 12 PM
    currentHour = 12;
  }
  return { hour: currentHour, minute: m, period: currentPeriod };
};

// Helper to convert 12-hour parts to 24-hour "HH:mm" string
const to24HourFormat = (hour: number, minute: number, period: Period): string => {
  let h = hour;
  if (period === 'PM' && h !== 12) {
    h += 12;
  } else if (period === 'AM' && h === 12) { // Midnight case: 12 AM is 00 hours
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

  useEffect(() => {
    if (scrollRef.current) {
      const selectedIndex = values.findIndex(v => String(v) === String(selectedValue));
      if (selectedIndex !== -1) {
        // Ensure the scroll happens after the DOM update and potential resizes
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            const targetScrollTop = (selectedIndex * itemHeight) - (scrollRef.current.clientHeight / 2) + (itemHeight / 2);
            scrollRef.current.scrollTop = targetScrollTop;
          }
        });
      }
    }
  }, [selectedValue, values, itemHeight]);

  const handleItemClick = (value: string | number) => {
    onSelect(value);
  };

  return (
    <div 
      className={cn(
        "h-48 w-24 overflow-y-scroll custom-time-picker-no-scrollbar relative snap-y snap-mandatory", // Fixed height, adjusted width
         className
      )} 
      ref={scrollRef}
    >
      {/* Padding divs for scroll snapping to center */}
      <div style={{ height: `calc(50% - ${itemHeight / 2}px)` }} className="snap-center"></div>
      {values.map((val, index) => (
        <div
          key={`${columnId}-${index}`}
          id={`${columnId}-item-${index}`}
          onClick={() => handleItemClick(val)}
          className={cn(
            'flex items-center justify-center cursor-pointer transition-all duration-200 ease-out snap-center', 
            String(val) === String(selectedValue) 
              ? 'text-foreground font-bold text-5xl' // Larger, bold, and brighter for selected
              : 'text-muted-foreground text-3xl opacity-50 scale-90', // Smaller, dimmer for unselected
          )}
          style={{ height: `${itemHeight}px` }} // Explicit height for each item
        >
          {String(val).padStart(columnId === 'minutes' ? 2 : 0, '0')}
        </div>
      ))}
      <div style={{ height: `calc(50% - ${itemHeight / 2}px)` }} className="snap-center"></div>
    </div>
  );
};


export default function CustomTimePicker({ value, onChange }: CustomTimePickerProps) {
  const initialParts = from24HourFormat(value);
  const [displayHour, setDisplayHour] = useState<number>(initialParts.hour);
  const [displayMinute, setDisplayMinute] = useState<number>(initialParts.minute); 
  const [displayPeriod, setDisplayPeriod] = useState<Period>(initialParts.period);

  useEffect(() => {
    const parts = from24HourFormat(value);
    setDisplayHour(parts.hour);
    setDisplayMinute(parts.minute);
    setDisplayPeriod(parts.period);
  }, [value]);

  useEffect(() => {
    const new24HourTime = to24HourFormat(displayHour, displayMinute, displayPeriod);
    if (new24HourTime !== value) {
      onChange(new24HourTime);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayHour, displayMinute, displayPeriod]); // onChange removed to avoid re-triggering on parent update, only internal changes trigger parent

  const itemH = 64; // Corresponds to h-16 in Tailwind

  return (
    <div className="bg-background p-3 rounded-lg border border-border/30 shadow-xl w-fit mx-auto relative my-4">
      {/* Horizontal selection indicator lines */}
      <div 
        className="absolute top-1/2 left-3 right-3 -translate-y-1/2 pointer-events-none z-0"
        style={{ height: `${itemH}px` }} 
      >
        <div className="h-full w-full border-y border-accent rounded-sm"></div>
      </div>
      <div className="flex justify-center items-center space-x-1 sm:space-x-2 relative z-10">
        <ScrollableColumn
          columnId="hours"
          values={hoursArray}
          selectedValue={displayHour}
          onSelect={(val) => setDisplayHour(Number(val))}
          itemHeight={itemH}
          className="w-20" // Adjusted width
        />
        <div className="text-5xl text-muted-foreground select-none font-bold mt-[-2px]">:</div>
        <ScrollableColumn
          columnId="minutes"
          values={minutesArray} 
          selectedValue={String(displayMinute).padStart(2, '0')} 
          onSelect={(val) => setDisplayMinute(Number(val))}
          itemHeight={itemH}
          className="w-20" // Adjusted width
        />
        <ScrollableColumn
          columnId="period"
          values={periodsArray as unknown as string[]} 
          selectedValue={displayPeriod}
          onSelect={(val) => setDisplayPeriod(val as Period)}
          itemHeight={itemH}
          className="w-24" // Adjusted width
        />
      </div>
    </div>
  );
}

