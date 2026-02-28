
import React, { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parse, isValid, getYear, setYear, setMonth, getMonth } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

// Import react-day-picker styles
// Since we are using Tailwind, we can also customize it further
import 'react-day-picker/style.css';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({ 
  value, 
  onChange, 
  label, 
  placeholder = 'Select date',
  className = '',
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parse initial date
  const selectedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
  const [month, setMonthState] = useState<Date>(selectedDate || new Date());

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      onChange(formattedDate);
      setIsOpen(false);
    }
  };

  const years = Array.from({ length: 120 }, (_, i) => getYear(new Date()) - i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    const updatedMonth = setYear(month, newYear);
    setMonthState(updatedMonth);
    // If a day is already selected, update the date and propagate
    if (selectedDate && isValid(selectedDate)) {
      const newDate = setYear(selectedDate, newYear);
      onChange(format(newDate, 'yyyy-MM-dd'));
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value, 10);
    const updatedMonth = setMonth(month, newMonth);
    setMonthState(updatedMonth);
    // If a day is already selected, update the date and propagate
    if (selectedDate && isValid(selectedDate)) {
      const newDate = setMonth(selectedDate, newMonth);
      onChange(format(newDate, 'yyyy-MM-dd'));
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
          {label} {required && <span className="text-rose-600 ml-0.5">*</span>}
        </label>
      )}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="relative group cursor-pointer"
      >
        <input
          type="text"
          readOnly
          value={selectedDate && isValid(selectedDate) ? format(selectedDate, 'PPP') : ''}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pl-10 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 dark:text-white"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-hover:text-purple-500 transition-colors">
          <CalendarIcon size={16} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[9999] left-0 mt-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 min-w-[300px] md:min-w-[320px]">
          <div className="flex gap-2 mb-4">
            <select 
              value={getMonth(month)} 
              onChange={handleMonthChange}
              className="flex-1 px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-purple-500 dark:text-white"
            >
              {months.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select 
              value={getYear(month)} 
              onChange={handleYearChange}
              className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-purple-500 dark:text-white"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            month={month}
            onMonthChange={setMonthState}
            className="border-none p-0 m-0"
            classNames={{
              months: "flex flex-col",
              month: "space-y-4",
              month_caption: "hidden",
              nav: "hidden",
              month_grid: "w-full border-separate border-spacing-1",
              weekdays: "flex w-full justify-between pb-2 border-b border-slate-100 dark:border-slate-800",
              weekday: "text-slate-400 font-bold text-[10px] uppercase text-center w-10 flex-shrink-0",
              weeks: "space-y-1 pt-2",
              week: "flex w-full justify-between gap-1",
              day: "w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-all hover:bg-purple-100 dark:hover:bg-purple-900/30 dark:text-slate-300 cursor-pointer flex-shrink-0",
              selected: "rdp-selected !bg-purple-600 !text-white hover:!bg-purple-700",
              today: "rdp-today font-bold text-purple-600 dark:text-purple-400 ring-2 ring-purple-500/20",
              outside: "rdp-outside text-slate-300 dark:text-slate-600 opacity-20",
              disabled: "rdp-disabled text-slate-300 opacity-50",
            }}
          />
          
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button 
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-daypicker .rdp-day_selected:not([disabled]) { 
          background-color: #9333ea !important;
          color: white !important;
        }
        .custom-daypicker .rdp-day_selected:hover:not([disabled]) { 
          background-color: #7e22ce !important;
        }
        .dark .rdp-root {
          --rdp-background-color: transparent;
          --rdp-accent-color: #9333ea;
        }
      `}</style>
    </div>
  );
};

export default DatePicker;
