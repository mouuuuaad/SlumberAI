'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Coffee, AlertCircle, Clock } from 'lucide-react';
import { addMinutes, format, parse } from 'date-fns';

const napTypes = [
  { name: 'Power Nap', duration: 20, description: 'Boosts alertness and energy.' },
  { name: 'NASA Nap', duration: 26, description: 'Improves performance and alertness (used by NASA astronauts).' },
  { name: 'Short Restorative Nap', duration: 60, description: 'Helps with memory consolidation, may cause grogginess.' },
  { name: 'Full Cycle Nap', duration: 90, description: 'Covers a full sleep cycle, improves creativity, less grogginess.' },
];

export default function NapCalculator() {
  const [selectedNapType, setSelectedNapType] = useState<string>(napTypes[0].duration.toString());
  const [startTime, setStartTime] = useState('');
  const [napResult, setNapResult] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  
  useEffect(() => {
    // Set default start time to current time when component mounts
    setStartTime(format(new Date(), 'HH:mm'));
  }, []);


  const handleCalculateNap = () => {
    if (!startTime) {
      setTimeError('Please select a start time for your nap.');
      return;
    }
    setTimeError(null);
    setNapResult(null);

    try {
      const baseDate = '2000-01-01'; // A fixed date for time parsing
      const parsedStartTime = parse(`${baseDate}T${startTime}`, `${baseDate}THH:mm`, new Date());

      if (isNaN(parsedStartTime.getTime())) {
        setTimeError('Invalid time format. Please use HH:MM.');
        return;
      }

      const napDuration = parseInt(selectedNapType, 10);
      const wakeUpTime = addMinutes(parsedStartTime, napDuration);
      const napInfo = napTypes.find(n => n.duration === napDuration);

      setNapResult(
        `For a ${napInfo?.name || `${napDuration} min nap`} starting at ${format(parsedStartTime, 'hh:mm a')}, you should wake up at ${format(wakeUpTime, 'hh:mm a')}.`
      );
    } catch (error) {
      setTimeError('Could not parse the time. Please ensure it is valid.');
      console.error("Error calculating nap time:", error);
    }
  };
  
  const selectedNapDetails = napTypes.find(n => n.duration.toString() === selectedNapType);

  return (
    <Card className="w-full glassmorphic">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Coffee className="h-6 w-6 text-primary" />
          Nap Optimizer
        </CardTitle>
        <CardDescription>
          Calculate the best time to wake up from your nap for optimal refreshment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="napType">Nap Type:</Label>
          <Select value={selectedNapType} onValueChange={setSelectedNapType}>
            <SelectTrigger id="napType" className="w-full md:w-[280px]">
              <SelectValue placeholder="Select nap type" />
            </SelectTrigger>
            <SelectContent>
              {napTypes.map((nap) => (
                <SelectItem key={nap.duration} value={nap.duration.toString()}>
                  {nap.name} ({nap.duration} mins)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedNapDetails && <p className="text-sm text-muted-foreground pt-1">{selectedNapDetails.description}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="startTime">Nap Start Time:</Label>
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value)
              if(timeError) setTimeError(null);
              if(napResult) setNapResult(null);
            }}
            className="w-full md:w-1/2"
          />
          {timeError && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {timeError}
            </p>
          )}
        </div>

        <Button onClick={handleCalculateNap} className="w-full md:w-auto">
          Calculate Nap
        </Button>

        {napResult && (
          <Card className="mt-4 bg-primary/10 border-primary/30">
            <CardContent className="pt-6">
              <p className="text-center font-medium text-primary-foreground flex items-center justify-center gap-2">
                <Clock className="h-5 w-5"/> {napResult}
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
