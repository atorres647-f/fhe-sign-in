import { useState, useEffect, useRef } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import './Calendar.css';

interface CalendarProps {
  signedDates: Set<string>; // Format: "YYYY-MM-DD"
}

export function Calendar({ signedDates }: CalendarProps) {
  const today = new Date();
  const hasInitialized = useRef(false);
  const [displayDate, setDisplayDate] = useState<Date>(() => {
    // Always use current date - show today's month
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Date range limit: Allow any year/month (no restrictions)
  const MIN_YEAR = 2020;
  const MIN_MONTH = 0; // 0 = January
  const MAX_YEAR = 2100;
  const MAX_MONTH = 11; // 11 = December

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();

  // Check if can go to previous month
  const canGoPrevious = year > MIN_YEAR || (year === MIN_YEAR && month > MIN_MONTH);
  
  // Check if can go to next month
  const canGoNext = year < MAX_YEAR || (year === MAX_YEAR && month < MAX_MONTH);

  // Go to previous month
  const goToPreviousMonth = () => {
    if (!canGoPrevious) return;
    const newDate = new Date(year, month - 1, 1);
    setDisplayDate(newDate);
  };

  // Go to next month
  const goToNextMonth = () => {
    if (!canGoNext) return;
    const newDate = new Date(year, month + 1, 1);
    setDisplayDate(newDate);
  };

  // Get day of week for first day of month
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Generate date array
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const formatDate = (day: number): string => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isToday = (day: number): boolean => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isSigned = (day: number): boolean => {
    return signedDates.has(formatDate(day));
  };

  // Auto-scroll to current month when component mounts
  useEffect(() => {
    if (!hasInitialized.current) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      setDisplayDate(new Date(currentYear, currentMonth, 1));
      hasInitialized.current = true;
    }
  }, []); // Only run on mount

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button
          className="calendar-nav-btn"
          onClick={goToPreviousMonth}
          disabled={!canGoPrevious}
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <h2>{monthNames[month]} {year}</h2>
        <button
          className="calendar-nav-btn"
          onClick={goToNextMonth}
          disabled={!canGoNext}
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="calendar-weekdays">
        {weekDays.map(day => (
          <div key={day} className="weekday">{day}</div>
        ))}
      </div>
      <div className="calendar-days">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={index} className="calendar-day empty"></div>;
          }
          
          const signed = isSigned(day);
          const todayClass = isToday(day) ? 'today' : '';
          
          return (
            <div
              key={index}
              className={`calendar-day ${todayClass} ${signed ? 'signed' : ''}`}
            >
              <span className="day-number">{day}</span>
              {signed && (
                <div className="signed-indicator">
                  <Check size={16} color="white" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


