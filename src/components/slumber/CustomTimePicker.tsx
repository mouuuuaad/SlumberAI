
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
    return { hour: 12, minute: 0, period: 'AM' }; // Default for invalid format
  }
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);

  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    // Invalid numbers or out of range
    return { hour: 12, minute: 0, period: 'AM' };
  }

  const currentPeriod = h >= 12 ? 'PM' : 'AM';
  let currentHour = h % 12;
  if (currentHour === 0) { // 00:xx is 12 AM, 12:xx is 12 PM
    currentHour = 12;
  }
  return { hour: currentHour, minute: m, period: currentPeriod };
};

const to24HourFormat = (hour: number, minute: number, period: Period): string => {
  let h = hour; // hour is 1-12
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
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            const targetScrollTop = (selectedIndex * itemHeight);
            scrollRef.current.scrollTop = targetScrollTop;
            setTimeout(() => {
                isProgrammaticScroll.current = false;
            }, 50); // Increased delay slightly
          }
        });
      }
    }
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
            // Only call onSelect if the value actually changed by scrolling
            if (String(newSelectedValue) !== String(selectedValue)) {
                onSelect(newSelectedValue);
            }
        }
      }
    }, 150);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemHeight, onSelect, selectedValue, values]);


  return (
    <div
      className={cn(
        "h-48 w-24 overflow-y-scroll custom-time-picker-no-scrollbar relative snap-y snap-mandatory",
         className
      )}
      ref={scrollRef}
      onScroll={handleScroll}
    >
      <div style={{ height: `calc(50% - ${itemHeight / 2}px)` }} className="snap-center"></div>
      {values.map((val, index) => (
        <div
          key={`${columnId}-${index}`}
          id={`${columnId}-item-${index}`}
          className={cn(
            'flex items-center justify-center cursor-default transition-all duration-200 ease-out snap-center',
            String(val) === String(selectedValue)
              ? 'text-foreground font-bold text-5xl'
              : 'text-muted-foreground text-3xl opacity-50 scale-90',
          )}
          style={{ height: `${itemHeight}px` }}
        >
          {columnId === 'minutes' ? String(val).padStart(2, '0') : String(val)}
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

  // Effect 1: Sync internal display state FROM the `value` prop.
  // This runs when the `value` prop changes externally.
  useEffect(() => {
    const parts = from24HourFormat(value);
    // Only update if the parsed parts are different from current display state
    // to avoid unnecessary re-renders if parent sends back the same logical time.
    if (parts.hour !== displayHour) {
      setDisplayHour(parts.hour);
    }
    if (parts.minute !== displayMinute) {
      setDisplayMinute(parts.minute);
    }
    if (parts.period !== displayPeriod) {
      setDisplayPeriod(parts.period);
    }
  }, [value, displayHour, displayMinute, displayPeriod]); // Listen to display states too to prevent race conditions if internal state changes faster.

  // Effect 2: Sync internal display state TO the parent via `onChange`.
  // This runs when displayHour, displayMinute, or displayPeriod change (e.g., due to user scrolling).
  useEffect(() => {
    const new24HourTime = to24HourFormat(displayHour, displayMinute, displayPeriod);
    // Only call onChange if the newly calculated time is different from the current `value` prop.
    // This prevents a loop if the parent component echoes back the same time value.
    if (new24HourTime !== value) {
      onChange(new24HourTime);
    }
  }, [displayHour, displayMinute, displayPeriod, onChange, value]);


  const itemH = 64;

  return (
    <div className="bg-transparent p-3 rounded-lg w-fit mx-auto relative my-4">
      <div
        className="absolute top-1/2 left-3 right-3 -translate-y-1/2 pointer-events-none z-0"
        style={{ height: `${itemH}px` }}
      >
        <div className="h-full w-full border border-border rounded-md"></div>
      </div>
      <div className="flex justify-center items-center space-x-1 sm:space-x-2 relative z-10">
        <ScrollableColumn
          columnId="hours"
          values={hoursArray}
          selectedValue={displayHour}
          onSelect={(val) => setDisplayHour(Number(val))}
          itemHeight={itemH}
          className="w-20"
        />
        <div className="text-5xl text-foreground select-none font-bold mt-[-2px]">:</div>
        <ScrollableColumn
          columnId="minutes"
          values={minutesArray}
          selectedValue={String(displayMinute).padStart(2, '0')}
          onSelect={(val) => setDisplayMinute(Number(val))}
          itemHeight={itemH}
          className="w-20"
        />
        <ScrollableColumn
          columnId="period"
          values={periodsArray as unknown as string[]}
          selectedValue={displayPeriod}
          onSelect={(val) => setDisplayPeriod(val as Period)}
          itemHeight={itemH}
          className="w-24"
        />
      </div>
    </div>
  );
}
