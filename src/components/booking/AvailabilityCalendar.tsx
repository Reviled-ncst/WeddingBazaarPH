'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface DayAvailability {
  date: string;
  status: 'available' | 'partial' | 'full' | 'blocked' | 'past';
  reason: string | null;
  bookings: number;
  max_bookings: number;
  available: boolean;
}

interface MonthData {
  year: number;
  month: number;
  max_bookings_per_day: number;
  days: Record<number, DayAvailability>;
}

interface AvailabilityCalendarProps {
  vendorId: number;
  serviceId?: number;
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AvailabilityCalendar({
  vendorId,
  serviceId,
  selectedDate,
  onDateSelect,
}: AvailabilityCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthData();
  }, [vendorId, serviceId, currentMonth, currentYear]);

  const fetchMonthData = async () => {
    setLoading(true);
    try {
      let url = `http://localhost/wedding-bazaar-api/availability/month.php?vendor_id=${vendorId}&year=${currentYear}&month=${currentMonth}`;
      if (serviceId) {
        url += `&service_id=${serviceId}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setMonthData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Check if previous month button should be disabled
  const isPrevDisabled = currentYear === today.getFullYear() && currentMonth <= today.getMonth() + 1;

  // Get first day of month (0 = Sunday)
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  
  // Get number of days in month
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Generate calendar grid
  const calendarDays: (number | null)[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const getDayClasses = (day: number | null) => {
    if (day === null) return '';
    
    const dayData = monthData?.days[day];
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isSelected = selectedDate === dateStr;
    
    let baseClasses = 'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all relative ';
    
    if (!dayData) {
      return baseClasses + 'text-gray-600 cursor-not-allowed';
    }
    
    switch (dayData.status) {
      case 'past':
        return baseClasses + 'text-gray-700 cursor-not-allowed';
      case 'blocked':
        return baseClasses + 'bg-red-500/20 text-red-400 cursor-not-allowed line-through';
      case 'full':
        return baseClasses + 'bg-red-500/20 text-red-400 cursor-not-allowed';
      case 'partial':
        return baseClasses + (isSelected 
          ? 'bg-pink-500 text-white ring-2 ring-pink-400 ring-offset-2 ring-offset-dark-900' 
          : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 cursor-pointer');
      case 'available':
      default:
        return baseClasses + (isSelected 
          ? 'bg-pink-500 text-white ring-2 ring-pink-400 ring-offset-2 ring-offset-dark-900' 
          : 'text-white hover:bg-dark-700 cursor-pointer');
    }
  };

  const handleDayClick = (day: number | null) => {
    if (day === null) return;
    
    const dayData = monthData?.days[day];
    if (!dayData || !dayData.available) return;
    
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateSelect(dateStr);
  };

  return (
    <div className="bg-dark-800/50 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          disabled={isPrevDisabled}
          className={`p-2 rounded-lg transition-colors ${
            isPrevDisabled 
              ? 'text-gray-700 cursor-not-allowed' 
              : 'text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h3 className="text-white font-semibold">
          {MONTH_NAMES[currentMonth - 1]} {currentYear}
        </h3>
        
        <button
          onClick={goToNextMonth}
          className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-center text-gray-500 text-xs font-medium py-1">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dayData = day ? monthData?.days[day] : null;
            
            return (
              <div
                key={index}
                className="flex items-center justify-center"
              >
                {day !== null ? (
                  <button
                    onClick={() => handleDayClick(day)}
                    className={getDayClasses(day)}
                    disabled={!dayData?.available}
                    title={dayData?.reason || undefined}
                  >
                    {day}
                    {/* Booking indicator dot */}
                    {dayData && dayData.bookings > 0 && dayData.status !== 'past' && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
                    )}
                  </button>
                ) : (
                  <div className="w-10 h-10" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-dark-700">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded bg-amber-500/30" />
          <span className="text-gray-400">Partial</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded bg-red-500/30" />
          <span className="text-gray-400">Unavailable</span>
        </div>
      </div>

      {/* Selected date info - fixed height to prevent layout shift */}
      <div className="mt-3 p-2 bg-dark-900 rounded-lg text-sm h-14 flex flex-col justify-center">
        {(() => {
          if (!selectedDate) {
            return <p className="text-gray-500 text-xs">Select a date to see details</p>;
          }
          const [selYear, selMonth, selDay] = selectedDate.split('-').map(Number);
          const isCurrentMonth = selYear === currentYear && selMonth === currentMonth;
          const dayData = isCurrentMonth ? monthData?.days[selDay] : null;
          const displayDate = new Date(selYear, selMonth - 1, selDay);
          
          return (
            <>
              <p className="text-gray-300">
                {MONTH_NAMES[selMonth - 1]} {selDay}, {selYear}
              </p>
              <p className="text-gray-500 text-xs mt-1 truncate">
                {dayData?.reason || (dayData ? `${dayData.bookings}/${dayData.max_bookings} booked` : 'Selected')}
              </p>
            </>
          );
        })()}
      </div>
    </div>
  );
}
