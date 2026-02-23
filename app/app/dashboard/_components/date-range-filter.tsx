import React from 'react';
import { addDays, format } from 'date-fns';

interface DateRangeFilterProps {
  startDate: Date;
  endDate: Date;
  onChange: (range: { startDate: Date; endDate: Date }) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ startDate, endDate, onChange }) => {
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = new Date(e.target.value);
    onChange({ startDate: newStart, endDate });
  };
  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = new Date(e.target.value);
    onChange({ startDate, endDate: newEnd });
  };
  return (
    <div className="flex gap-2 items-center">
      <label className="text-xs">From</label>
      <input
        type="date"
        value={format(startDate, 'yyyy-MM-dd')}
        onChange={handleStartChange}
        className="border rounded px-2 py-1 text-xs"
      />
      <label className="text-xs">to</label>
      <input
        type="date"
        value={format(endDate, 'yyyy-MM-dd')}
        onChange={handleEndChange}
        className="border rounded px-2 py-1 text-xs"
      />
    </div>
  );
};
