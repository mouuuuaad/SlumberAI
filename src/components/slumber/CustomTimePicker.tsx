
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
const minutesArray = Array.from({ length: 60 }, (_, i) => i); // 0-59
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
}> = ({ values, selectedValue, onSelect, itemHeight = 40, columnId }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const selectedIndex = values.findIndex(v => String(v) === String(selectedValue));
      if (selectedIndex !== -1) {
        // Center the selected item
        const targetScrollTop = (selectedIndex * itemHeight) - (scrollRef.current.clientHeight / 2) + (itemHeight / 2);
        scrollRef.current.scrollTop = targetScrollTop;
      }
    }
  }, [selectedValue, values, itemHeight]);

  const handleItemClick = (value: string | number) => {
    onSelect(value);
  };

  return (
    <div className="h-40 w-20 overflow-y-scroll custom-time-picker-no-scrollbar relative" ref={scrollRef}>
      {/* Invisible padding items for centering */}
      <div style={{ height: `calc(50% - ${itemHeight / 2}px)` }}></div>
      {values.map((val, index) => (
        <div
          key={`${columnId}-${index}`}
          id={`${columnId}-item-${index}`}
          onClick={() => handleItemClick(val)}
          className={cn(
            'flex items-center justify-center text-3xl cursor-pointer transition-all duration-150 ease-in-out',
            String(val) === String(selectedValue) ? 'text-white font-semibold scale-110' : 'text-gray-400 opacity-60 scale-90',
          )}
          style={{ height: `${itemHeight}px` }}
        >
          {typeof val === 'number' ? String(val).padStart(columnId === 'minutes' ? 2 : 0, '0') : val}
        </div>
      ))}
      <div style={{ height: `calc(50% - ${itemHeight / 2}px)` }}></div>
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
  }, [displayHour, displayMinute, displayPeriod, onChange, value]);

  return (
    <div className="bg-[#191E3D] p-3 rounded-xl border border-[#B0A06B]/50 shadow-lg w-fit mx-auto relative">
      {/* Horizontal selection indicator lines */}
      <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 pointer-events-none">
        <div className="h-full w-full border-y border-[#B0A06B]/70"></div>
      </div>
      <div className="flex justify-center items-center space-x-2 relative z-10">
        <ScrollableColumn
          columnId="hours"
          values={hoursArray}
          selectedValue={displayHour}
          onSelect={(val) => setDisplayHour(Number(val))}
        />
        <div className="text-3xl text-gray-400 pb-1 select-none">:</div>
        <ScrollableColumn
          columnId="minutes"
          values={minutesArray}
          selectedValue={displayMinute}
          onSelect={(val) => setDisplayMinute(Number(val))}
        />
        <ScrollableColumn
          columnId="period"
          values={periodsArray as unknown as string[]} // Cast to allow string[] for ScrollableColumn
          selectedValue={displayPeriod}
          onSelect={(val) => setDisplayPeriod(val as Period)}
        />
      </div>
    </div>
  );
}
