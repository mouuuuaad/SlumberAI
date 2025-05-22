
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
    h = 12;
  }
  if (isNaN(m) || m < 0 || m > 59) {
    m = 0;
  }

  const currentPeriod = h >= 12 ? 'PM' : 'AM';
  let currentHour = h % 12;
  if (currentHour === 0) {
    currentHour = 12;
  }
  return { hour: currentHour, minute: m, period: currentPeriod };
};

const to24HourFormat = (hour: number, minute: number, period: Period): string => {
  let h = hour;
  if (period === 'PM' && h !== 12) {
    h += 12;
  } else if (period === 'AM' && h === 12) {
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
            }, 100);
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
            if (String(newSelectedValue) !== String(selectedValue)) {
                 onSelect(newSelectedValue);
            }
        }
      }
    }, 150);
  }, [itemHeight, onSelect, selectedValue, values]);

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

  useEffect(() => {
    const parts = from24HourFormat(value);
    if (parts.hour !== displayHour) {
        setDisplayHour(parts.hour);
    }
    if (parts.minute !== displayMinute) {
      setDisplayMinute(parts.minute);
    }
    if (parts.period !== displayPeriod) {
      setDisplayPeriod(parts.period);
    }
  }, [value, displayHour, displayMinute, displayPeriod]);

  useEffect(() => {
    const new24HourTime = to24HourFormat(displayHour, displayMinute, displayPeriod);
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
