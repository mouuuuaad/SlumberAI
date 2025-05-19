
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Coffee, AlertCircle, Clock } from 'lucide-react';
import { addMinutes, format, set } from 'date-fns'; // Import set

const napTypes = [
  { name: 'Power Nap', duration: 20, description: 'Boosts alertness and energy.' },
  { name: 'NASA Nap', duration: 26, description: 'Improves performance and alertness.' },
  { name: 'Short Restorative Nap', duration: 60, description: 'Helps with memory, may cause grogginess.' },
  { name: 'Full Cycle Nap', duration: 90, description: 'Full sleep cycle, improves creativity.' },
];

export default function NapCalculator() {
  const [selectedNapType, setSelectedNapType] = useState<string>(napTypes[0].duration.toString());
  const [startTime, setStartTime] = useState('');
  const [napResult, setNapResult] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  
  useEffect(() => {
    setStartTime(format(new Date(), 'HH:mm'));
  }, []);


  const handleCalculateNap = () => {
    if (!startTime) {
      setTimeError('Please enter a start time for your nap.');
      setNapResult(null);
      return;
    }
    setTimeError(null);
    setNapResult(null);

    try {
      const [hours, minutes] = startTime.split(':').map(Number);

      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        setTimeError('Invalid time format. Please use HH:MM (24-hour).');
        return;
      }
      
      const baseDateForParsing = new Date(2000, 0, 1); // Month is 0-indexed
      const parsedStartTime = set(baseDateForParsing, { hours, minutes, seconds: 0, milliseconds: 0 });

      if (isNaN(parsedStartTime.getTime())) {
        setTimeError('Invalid time format. Please use HH:MM (24-hour).');
        return;
      }

      const napDuration = parseInt(selectedNapType, 10);
      const wakeUpTime = addMinutes(parsedStartTime, napDuration);
      const napInfo = napTypes.find(n => n.duration === napDuration);

      setNapResult(
        `For a ${napInfo?.name || `${napDuration} min nap`} starting at ${format(parsedStartTime, 'hh:mm a')}, you should wake up at ${format(wakeUpTime, 'hh:mm a')}.`
      );
    } catch (error) {
      setTimeError('Could not process the time. Please ensure it is a valid HH:MM format.');
      console.error("Error calculating nap time:", error);
    }
  };
  
  const selectedNapDetails = napTypes.find(n => n.duration.toString() === selectedNapType);

  return (
    <Card className="w-full bg-transparent border-0 shadow-none"> 
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-foreground">
          <Coffee className="h-6 w-6 text-primary" />
          Nap Optimizer
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Calculate the best time to wake up from your nap for optimal refreshment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="napType" className="text-foreground/90">Nap Type:</Label>
          <Select value={selectedNapType} onValueChange={(value) => {
            setSelectedNapType(value);
            setNapResult(null); 
          }}>
            <SelectTrigger id="napType" className="w-full md:w-[280px] bg-input text-foreground focus:bg-input focus:ring-primary">
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
          <Label htmlFor="startTime" className="text-foreground/90">Nap Start Time (HH:MM):</Label>
          <Input
            id="startTime"
            type="time" 
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value)
              if(timeError) setTimeError(null);
              if(napResult) setNapResult(null);
            }}
            className="w-full md:w-1/2 bg-input text-foreground focus:ring-primary"
          />
          {timeError && (
            <p className="text-sm text-destructive flex items-center gap-1 pt-1">
              <AlertCircle className="h-4 w-4" /> {timeError}
            </p>
          )}
        </div>

        <Button onClick={handleCalculateNap} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
          Calculate Nap
        </Button>

        {napResult && (
          <Card className="mt-4 bg-primary/10 border-primary/30">
            <CardContent className="p-4 sm:p-6">
              <p className="text-center font-medium text-primary flex items-center justify-center gap-2">
                <Clock className="h-5 w-5"/> {napResult}
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
