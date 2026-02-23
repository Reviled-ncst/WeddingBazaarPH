'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Lock, Unlock, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface BlockedDate {
  date: string;
  reason: string | null;
}

interface BookedDate {
  date: string;
  count: number;
}

interface AvailabilityTabProps {
  vendorId: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '${API_URL}';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AvailabilityTab({ vendorId }: AvailabilityTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [bookedDates, setBookedDates] = useState<BookedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetchAvailability();
  }, [vendorId, year, month]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/availability/month.php?vendor_id=${vendorId}&year=${year}&month=${month + 1}`
      );
      const data = await response.json();
      if (data.success) {
        setBlockedDates(
          Object.entries(data.blocked_dates || {}).map(([date, reason]) => ({
            date,
            reason: reason as string | null,
          }))
        );
        setBookedDates(
          Object.entries(data.booked_dates || {}).map(([date, count]) => ({
            date,
            count: count as number,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockDate = async () => {
    if (!selectedDate) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/availability/block-date.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendorId,
          date: selectedDate,
          reason: reason || null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        fetchAvailability();
        setSelectedDate(null);
        setReason('');
      }
    } catch (error) {
      console.error('Failed to block date:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUnblockDate = async (date: string) => {
    try {
      const response = await fetch(`${API_BASE}/availability/unblock-date.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendorId,
          date,
        }),
      });
      const data = await response.json();
      if (data.success) {
        fetchAvailability();
      }
    } catch (error) {
      console.error('Failed to unblock date:', error);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];

    // Add empty slots for days before the first of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const formatDateString = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isBlocked = (day: number) => {
    const dateStr = formatDateString(day);
    return blockedDates.some((b) => b.date === dateStr);
  };

  const isBooked = (day: number) => {
    const dateStr = formatDateString(day);
    return bookedDates.some((b) => b.date === dateStr);
  };

  const getBookingCount = (day: number) => {
    const dateStr = formatDateString(day);
    const booking = bookedDates.find((b) => b.date === dateStr);
    return booking?.count || 0;
  };

  const getBlockedReason = (day: number) => {
    const dateStr = formatDateString(day);
    const blocked = blockedDates.find((b) => b.date === dateStr);
    return blocked?.reason || null;
  };

  const isPast = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(year, month, day);
    return checkDate < today;
  };

  const handleDateClick = (day: number) => {
    if (isPast(day)) return;
    const dateStr = formatDateString(day);
    
    if (isBlocked(day)) {
      // Unblock
      handleUnblockDate(dateStr);
    } else if (!isBooked(day)) {
      // Open block dialog
      setSelectedDate(dateStr);
      setReason('');
    }
  };

  const days = getDaysInMonth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Availability Management</h3>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-dark-700"></div>
          <span className="text-gray-400">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-pink-500"></div>
          <span className="text-gray-400">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/50"></div>
          <span className="text-gray-400">Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-dark-800"></div>
          <span className="text-gray-400">Past</span>
        </div>
      </div>

      <Card className="p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h4 className="text-lg font-semibold text-white">
            {MONTHS[month]} {year}
          </h4>
          <button
            onClick={nextMonth}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((day) => (
            <div key={day} className="text-center text-sm text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-14"></div>;
            }

            const blocked = isBlocked(day);
            const booked = isBooked(day);
            const past = isPast(day);
            const bookingCount = getBookingCount(day);
            const blockedReason = getBlockedReason(day);

            let bgClass = 'bg-dark-700 hover:bg-dark-600';
            let cursor = 'cursor-pointer';

            if (past) {
              bgClass = 'bg-dark-800 opacity-50';
              cursor = 'cursor-not-allowed';
            } else if (blocked) {
              bgClass = 'bg-red-500/30 border-red-500/50 hover:bg-red-500/40';
            } else if (booked) {
              bgClass = 'bg-pink-500/30 border-pink-500/50';
              cursor = 'cursor-not-allowed';
            }

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                disabled={past || booked}
                className={`h-14 rounded-lg border border-dark-600 ${bgClass} ${cursor} transition-colors relative group`}
                title={
                  blocked
                    ? `Blocked${blockedReason ? `: ${blockedReason}` : ''} (Click to unblock)`
                    : booked
                    ? `${bookingCount} booking(s)`
                    : 'Click to block'
                }
              >
                <span className={`text-sm font-medium ${past ? 'text-gray-500' : 'text-white'}`}>
                  {day}
                </span>
                {blocked && (
                  <Lock className="w-3 h-3 text-red-400 absolute bottom-1 right-1" />
                )}
                {booked && (
                  <span className="absolute bottom-1 right-1 text-xs text-pink-400">{bookingCount}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-dark-800/50 rounded-lg">
          <div className="flex gap-2 text-sm text-gray-400">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              Click on available dates to block them. Click on blocked dates to unblock them.
              Booked dates cannot be modified.
            </p>
          </div>
        </div>
      </Card>

      {/* Blocked Dates List */}
      {blockedDates.length > 0 && (
        <Card className="p-6">
          <h4 className="text-white font-semibold mb-4">Blocked Dates</h4>
          <div className="space-y-2">
            {blockedDates
              .filter((b) => new Date(b.date) >= new Date(new Date().toDateString()))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((blocked) => (
                <div
                  key={blocked.date}
                  className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg"
                >
                  <div>
                    <span className="text-white">
                      {new Date(blocked.date).toLocaleDateString('en-PH', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {blocked.reason && (
                      <span className="text-gray-400 text-sm ml-2">- {blocked.reason}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleUnblockDate(blocked.date)}
                    className="text-gray-400 hover:text-green-400 transition-colors"
                    title="Unblock date"
                  >
                    <Unlock className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Block Date Modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Block Date</h3>
            <p className="text-gray-400 mb-4">
              Block{' '}
              <span className="text-white font-medium">
                {new Date(selectedDate).toLocaleDateString('en-PH', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </p>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Reason (optional)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                placeholder="e.g., Personal day, Vacation, etc."
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedDate(null);
                  setReason('');
                }}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleBlockDate} disabled={saving}>
                {saving ? 'Blocking...' : 'Block Date'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
