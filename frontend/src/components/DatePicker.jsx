import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatDateToISO, formatDisplayDate } from './DateRangePicker';
import { useCalendarPosition } from './useCalendarPosition';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const DECADES = [1970, 1980, 1990, 2000, 2010, 2020, 2030];

export default function DatePicker({
  value = '',
  onChange,
  placeholder = 'Select date',
  disabled = false,
  error = null,
  label = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('days'); // 'days' | 'months' | 'years'

  const initialDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(
    isNaN(initialDate.getTime()) ? new Date().getFullYear() : initialDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    isNaN(initialDate.getTime()) ? new Date().getMonth() : initialDate.getMonth()
  );

  // Year pagination page start (16 years per page)
  const [yearPageStart, setYearPageStart] = useState(Math.floor(viewYear / 16) * 16);

  const containerRef = useRef(null);
  const popoverRef = useRef(null);
  const coords = useCalendarPosition(containerRef, isOpen, 340, 360);

  useEffect(() => {
    if (value) {
      const parts = value.split('-').map(Number);
      if (parts.length === 3) {
        setViewYear(parts[0]);
        setViewMonth(parts[1] - 1);
        setYearPageStart(Math.floor(parts[0] / 16) * 16);
      }
    }
  }, [value]);

  useEffect(() => {
    if (isOpen) {
      setViewMode('days');
      setYearPageStart(Math.floor(viewYear / 16) * 16);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    const handleClickOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Days view navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Year view navigation
  const prevYearPage = () => setYearPageStart((y) => y - 16);
  const nextYearPage = () => setYearPageStart((y) => y + 16);

  // Month view navigation
  const prevYearInMonthView = () => setViewYear((y) => y - 1);
  const nextYearInMonthView = () => setViewYear((y) => y + 1);

  // Selection handlers
  const handleSelectYear = (year) => {
    setViewYear(year);
    setViewMode('months'); // Automatically transition to Month selector
  };

  const handleSelectMonth = (monthIdx) => {
    setViewMonth(monthIdx);
    setViewMode('days'); // Automatically transition to Days grid
  };

  const handleDayClick = (isoString) => {
    onChange(isoString);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  const handleToday = (e) => {
    e.stopPropagation();
    const today = new Date();
    const todayISO = formatDateToISO(today);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setViewMode('days');
    onChange(todayISO);
    setIsOpen(false);
  };

  // Days calculation
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonthIdx = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const iso = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({ day, iso, isCurrentMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ day: d, iso, isCurrentMonth: true });
  }

  const remainingSlots = (7 - (calendarDays.length % 7)) % 7;
  for (let d = 1; d <= remainingSlots; d++) {
    const nextMonthIdx = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const iso = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ day: d, iso, isCurrentMonth: false });
  }

  const todayISO = formatDateToISO(new Date());

  // Years array (16 years)
  const yearsList = [];
  for (let y = yearPageStart; y < yearPageStart + 16; y++) {
    yearsList.push(y);
  }

  const calendarPopover = isOpen ? (
    <div
      ref={popoverRef}
      className={`tripnest-calendar-popover placement-${coords.placement} mode-${viewMode}`}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 999999,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ====================================================================
          1. DAYS VIEW
          ==================================================================== */}
      {viewMode === 'days' && (
        <>
          <div className="calendar-header">
            <div className="calendar-month-year-selectors">
              <button
                type="button"
                className="calendar-selector-btn month-btn"
                onClick={() => setViewMode('months')}
                title="Select month"
              >
                {MONTH_NAMES[viewMonth]}
              </button>
              <button
                type="button"
                className="calendar-selector-btn year-btn"
                onClick={() => {
                  setYearPageStart(Math.floor(viewYear / 16) * 16);
                  setViewMode('years');
                }}
                title="Select year"
              >
                {viewYear}
              </button>
            </div>
            <div className="calendar-nav-buttons">
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={prevMonth}
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={nextMonth}
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="calendar-weekdays-grid">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="calendar-weekday-cell">
                {d}
              </div>
            ))}
          </div>

          <div className="calendar-days-grid">
            {calendarDays.map((item, idx) => {
              const isSelected = value === item.iso;
              const isToday = item.iso === todayISO;

              let cellClasses = 'calendar-day-cell';
              if (!item.isCurrentMonth) cellClasses += ' out-of-month';
              if (isToday) cellClasses += ' is-today';
              if (isSelected) cellClasses += ' selected range-start range-end';

              return (
                <div
                  key={`${item.iso}-${idx}`}
                  className={cellClasses}
                  onClick={() => handleDayClick(item.iso)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="day-number">{item.day}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ====================================================================
          2. MONTHS VIEW
          ==================================================================== */}
      {viewMode === 'months' && (
        <div className="calendar-selector-view months-view">
          <div className="calendar-header">
            <div className="calendar-month-year-selectors">
              <span className="calendar-view-title">Select Month</span>
              <button
                type="button"
                className="calendar-selector-btn year-btn active-parent"
                onClick={() => {
                  setYearPageStart(Math.floor(viewYear / 16) * 16);
                  setViewMode('years');
                }}
                title="Change Year"
              >
                {viewYear}
              </button>
            </div>
            <div className="calendar-nav-buttons">
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={prevYearInMonthView}
                aria-label="Previous year"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={nextYearInMonthView}
                aria-label="Next year"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="calendar-grid-12 months-grid">
            {SHORT_MONTHS.map((mName, idx) => {
              const isCurrentViewMonth = idx === viewMonth;
              const isCurrentRealMonth =
                idx === new Date().getMonth() && viewYear === new Date().getFullYear();

              return (
                <button
                  key={mName}
                  type="button"
                  className={`calendar-cell-pill ${isCurrentViewMonth ? 'selected' : ''} ${
                    isCurrentRealMonth ? 'is-today' : ''
                  }`}
                  onClick={() => handleSelectMonth(idx)}
                >
                  {mName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          3. YEARS VIEW
          ==================================================================== */}
      {viewMode === 'years' && (
        <div className="calendar-selector-view years-view">
          <div className="calendar-header">
            <div className="calendar-month-year-selectors">
              <span className="calendar-view-title">Select Year</span>
              <span className="calendar-range-label">
                {yearPageStart} – {yearPageStart + 15}
              </span>
            </div>
            <div className="calendar-nav-buttons">
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={prevYearPage}
                aria-label="Previous 16 years"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={nextYearPage}
                aria-label="Next 16 years"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Quick Decade Jump Strip */}
          <div className="decade-quick-jumps">
            {DECADES.map((dec) => (
              <button
                key={dec}
                type="button"
                className={`btn-decade-jump ${
                  yearPageStart <= dec && dec < yearPageStart + 16 ? 'active' : ''
                }`}
                onClick={() => setYearPageStart(Math.floor(dec / 16) * 16)}
              >
                {dec}s
              </button>
            ))}
          </div>

          <div className="calendar-grid-16 years-grid">
            {yearsList.map((yr) => {
              const isSelectedYear = yr === viewYear;
              const isRealYear = yr === new Date().getFullYear();

              return (
                <button
                  key={yr}
                  type="button"
                  className={`calendar-cell-pill ${isSelectedYear ? 'selected' : ''} ${
                    isRealYear ? 'is-today' : ''
                  }`}
                  onClick={() => handleSelectYear(yr)}
                >
                  {yr}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar Footer */}
      <div className="calendar-footer">
        <button
          type="button"
          className="calendar-footer-btn clear"
          onClick={handleClear}
        >
          Clear
        </button>
        <button
          type="button"
          className="calendar-footer-btn today"
          onClick={handleToday}
        >
          Today
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="tripnest-single-date-container" ref={containerRef}>
      {label && <label className="form-label">{label}</label>}
      <div
        className={`tripnest-single-date-input ${disabled ? 'disabled' : ''} ${error ? 'has-error' : ''} ${isOpen ? 'active-open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <CalendarIcon className="date-calendar-icon" size={16} />
        <span className={`date-val ${!value ? 'placeholder' : ''}`}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        {value && !disabled && (
          <button
            type="button"
            className="date-clear-btn"
            onClick={handleClear}
            title="Clear date"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {error && <span className="date-error-text">{error}</span>}

      {typeof document !== 'undefined' && isOpen && createPortal(calendarPopover, document.body)}
    </div>
  );
}

