
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    console.warn("Invalid time string passed to from24HourFormat:", timeStr);
    return { hour: 12, minute: 0, period: 'AM' };
  }
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10);

  if (isNaN(h) || h < 0 || h > 23) {
    h = 12; // Default to a safe hour
  }
  if (isNaN(m) || m < 0 || m > 59) {
    m = 0; // Default to a safe minute
  }

  const currentPeriod = h >= 12 ? 'PM' : 'AM';
  let currentHour = h % 12;
  if (currentHour === 0) { // Midnight or Noon
    currentHour = 12;
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
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProgrammaticScroll = useRef(false);


  useEffect(() => {
    if (scrollRef.current) {
      const selectedIndex = values.findIndex(v => String(v) === String(selectedValue));
      if (selectedIndex !== -1) {
        isProgrammaticScroll.current = true;
        // Use requestAnimationFrame for smoother programmatic scroll
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            const targetScrollTop = (selectedIndex * itemHeight);
            scrollRef.current.scrollTop = targetScrollTop;
            // Release the programmatic scroll lock after a short delay
            setTimeout(() => {
                isProgrammaticScroll.current = false;
            }, 100); // Increased delay to allow scroll to finish
          }
        });
      }
    }
  // Ensure selectedValue is string for comparison in findIndex if numbers are used
  }, [selectedValue, values, itemHeight]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScroll.current) {
        return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      if (scrollRef.current) {
        const currentScrollTop = scrollRef.current.scrollTop;
        const snappedIndex = Math.round(currentScrollTop / itemHeight);

        if (snappedIndex >= 0 && snappedIndex < values.length) {
            const newSelectedValue = values[snappedIndex];
            if (String(newSelectedValue) !== String(selectedValue)) {
                 onSelect(newSelectedValue);
            }
        }
      }
    }, 150); // Debounce time
  }, [itemHeight, onSelect, selectedValue, values]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);


  return (
    <div
      className={cn(
        "h-48 overflow-y-scroll custom-time-picker-no-scrollbar relative snap-y snap-mandatory",
         className
      )}
      ref={scrollRef}
      onScroll={handleScroll}
    >
      {/* Spacer to allow first item to snap to center */}
      <div style={{ height: `calc(50% - ${itemHeight / 2}px)` }} className="snap-center"></div>
      {values.map((val, index) => (
        <div
          key={`${columnId}-${index}`}
          id={`${columnId}-item-${index}`}
          className={cn(
            'flex items-center justify-center cursor-default transition-all duration-200 ease-out snap-center',
            String(val) === String(selectedValue)
              ? 'text-foreground font-bold text-5xl' // Larger for selected
              : 'text-muted-foreground text-3xl opacity-50 scale-90', // Smaller for unselected
          )}
          style={{ height: `${itemHeight}px` }}
        >
          {columnId === 'minutes' ? String(val).padStart(2, '0') : String(val)}
        </div>
      ))}
      {/* Spacer to allow last item to snap to center */}
      <div style={{ height: `calc(50% - ${itemHeight / 2}px)` }} className="snap-center"></div>
    </div>
  );
};


export default function CustomTimePicker({ value, onChange }: CustomTimePickerProps) {
  const initialParts = from24HourFormat(value);
  const [displayHour, setDisplayHour] = useState<number>(initialParts.hour);
  const [displayMinute, setDisplayMinute] = useState<number>(initialParts.minute);
  const [displayPeriod, setDisplayPeriod] = useState<Period>(initialParts.period);

  // Effect 1: Sync incoming `value` prop to internal display states
  // This effect *only* depends on `value`.
  useEffect(() => {
    const parts = from24HourFormat(value);
    setDisplayHour(parts.hour);
    setDisplayMinute(parts.minute);
    setDisplayPeriod(parts.period);
  }, [value]);

  // Effect 2: Sync internal display state changes to the parent via `onChange`
  // This effect depends on internal display states and the `onChange` prop, AND `value` to prevent loops.
  useEffect(() => {
    const new24HourTime = to24HourFormat(displayHour, displayMinute, displayPeriod);
    // Only call onChange if the newly constructed time is different from the current prop value
    if (new24HourTime !== value) {
      onChange(new24HourTime);
    }
  }, [displayHour, displayMinute, displayPeriod, onChange, value]);


  const itemH = 64; // Height of each scrollable item in pixels

  return (
    <div className="bg-transparent p-3 rounded-lg w-fit mx-auto relative my-4">
      {/* Selection Indicator Box */}
      <div
        className="absolute top-1/2 left-3 right-3 -translate-y-1/2 pointer-events-none z-0 border border-border rounded-md"
        style={{ height: `${itemH}px` }}
      >
        {/* This div creates the visual selection box */}
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
        <div className="text-5xl text-foreground select-none font-bold mt-[-2px]">:</div> {/* Ensure colon is styled like selected numbers */}
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
          values={periodsArray as unknown as string[]} // Cast for compatibility
          selectedValue={displayPeriod}
          onSelect={(val) => setDisplayPeriod(val as Period)}
          itemHeight={itemH}
          className="w-24" // Adjusted width for AM/PM
        />
      </div>
    </div>
  );
}
