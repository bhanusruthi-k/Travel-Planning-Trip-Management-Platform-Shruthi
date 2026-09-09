import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCalendarPosition } from './useCalendarPosition';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Format a Date object to YYYY-MM-DD
export const formatDateToISO = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format YYYY-MM-DD or Date to display string: "08 Sep 2026"
export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = typeof dateStr === 'string' ? dateStr.split('-') : null;
  let d;
  if (parts && parts.length === 3) {
    d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const monthShort = MONTH_NAMES[d.getMonth()].slice(0, 3);
  const year = d.getFullYear();
  return `${day} ${monthShort} ${year}`;
};

// Inclusive duration calculation
export const calculateTripDays = (startDateStr, endDateStr) => {
  if (!startDateStr || !endDateStr) return 0;
  const sParts = startDateStr.split('-').map(Number);
  const eParts = endDateStr.split('-').map(Number);
  if (sParts.length !== 3 || eParts.length !== 3) return 0;

  const startUtc = Date.UTC(sParts[0], sParts[1] - 1, sParts[2]);
  const endUtc = Date.UTC(eParts[0], eParts[1] - 1, eParts[2]);

  if (endUtc < startUtc) return 0;
  const diffDays = Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Inclusive
};

export const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DECADES = [1970, 1980, 1990, 2000, 2010, 2020, 2030];

export default function DateRangePicker({
  startDate = '',
  endDate = '',
  onChange,
  minDate = null,
  placeholderStart = 'Start Date',
  placeholderEnd = 'End Date',
  disabled = false,
  error = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('days'); // 'days' | 'months' | 'years'
  const [selectingTarget, setSelectingTarget] = useState('start'); // 'start' | 'end'
  const [hoverDate, setHoverDate] = useState(null);

  // Parse current view month
  const initialDate = startDate ? new Date(startDate) : new Date();
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
  const coords = useCalendarPosition(containerRef, isOpen, 370, 360);

  // Sync view when startDate changes externally
  useEffect(() => {
    if (startDate) {
      const parts = startDate.split('-').map(Number);
      if (parts.length === 3) {
        setViewYear(parts[0]);
        setViewMonth(parts[1] - 1);
        setYearPageStart(Math.floor(parts[0] / 16) * 16);
      }
    }
  }, [startDate]);

  useEffect(() => {
    if (isOpen) {
      setViewMode('days');
      setYearPageStart(Math.floor(viewYear / 16) * 16);
    }
  }, [isOpen]);

  // Handle outside click & Escape key
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
    setViewMode('months');
  };

  const handleSelectMonth = (monthIdx) => {
    setViewMonth(monthIdx);
    setViewMode('days');
  };

  const handleDayClick = (isoString) => {
    if (selectingTarget === 'start') {
      let newEnd = endDate;
      if (endDate && isoString > endDate) {
        newEnd = '';
      }
      onChange({ startDate: isoString, endDate: newEnd });
      setSelectingTarget('end');
    } else {
      if (!startDate) {
        onChange({ startDate: isoString, endDate: '' });
        setSelectingTarget('end');
      } else if (isoString < startDate) {
        onChange({ startDate: isoString, endDate: '' });
        setSelectingTarget('end');
      } else {
        onChange({ startDate, endDate: isoString });
        setIsOpen(false);
        setSelectingTarget('start');
      }
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange({ startDate: '', endDate: '' });
    setSelectingTarget('start');
  };

  const handleToday = (e) => {
    e.stopPropagation();
    const todayISO = formatDateToISO(new Date());
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setViewMode('days');
    onChange({ startDate: todayISO, endDate: todayISO });
    setIsOpen(false);
    setSelectingTarget('start');
  };

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
  const tripDuration = calculateTripDays(startDate, endDate);

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
                title="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={nextMonth}
                aria-label="Next month"
                title="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="calendar-selection-hint">
            {selectingTarget === 'start' ? (
              <span>Select <strong>Start Date</strong></span>
            ) : (
              <span>Select <strong>End Date</strong> (after {formatDisplayDate(startDate)})</span>
            )}
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
              const isStart = startDate === item.iso;
              const isEnd = endDate === item.iso;
              const isSelected = isStart || isEnd;
              const isInRange =
                startDate &&
                endDate &&
                item.iso > startDate &&
                item.iso < endDate;
              const isHoverRange =
                startDate &&
                !endDate &&
                hoverDate &&
                item.iso > startDate &&
                item.iso <= hoverDate;
              const isToday = item.iso === todayISO;

              let cellClasses = 'calendar-day-cell';
              if (!item.isCurrentMonth) cellClasses += ' out-of-month';
              if (isToday) cellClasses += ' is-today';
              if (isStart) cellClasses += ' range-start';
              if (isEnd) cellClasses += ' range-end';
              if (isSelected) cellClasses += ' selected';
              if (isInRange || isHoverRange) cellClasses += ' in-range';

              return (
                <div
                  key={`${item.iso}-${idx}`}
                  className={cellClasses}
                  onClick={() => handleDayClick(item.iso)}
                  onMouseEnter={() => !endDate && setHoverDate(item.iso)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${item.iso}${isToday ? ' (Today)' : ''}${isStart ? ' (Start Date)' : ''}${isEnd ? ' (End Date)' : ''}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleDayClick(item.iso);
                    }
                  }}
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

      <div className="calendar-footer">
        <button
          type="button"
          className="calendar-footer-btn clear"
          onClick={handleClear}
        >
          Clear
        </button>
        {tripDuration > 0 && (
          <span className="calendar-footer-duration">
            {tripDuration} {tripDuration === 1 ? 'day' : 'days'}
          </span>
        )}
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
    <div className="tripnest-date-range-container" ref={containerRef}>
      <div
        className={`tripnest-date-input-group ${disabled ? 'disabled' : ''} ${error ? 'has-error' : ''} ${isOpen ? 'active-open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Trip Date Range Selector"
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <div className="date-input-block start">
          <CalendarIcon className="date-calendar-icon" size={16} />
          <div className="date-input-text">
            <span className="date-label">Start Date</span>
            <span className={`date-val ${!startDate ? 'placeholder' : ''}`}>
              {startDate ? formatDisplayDate(startDate) : placeholderStart}
            </span>
          </div>
        </div>

        <div className="date-arrow-separator">→</div>

        <div className="date-input-block end">
          <div className="date-input-text">
            <span className="date-label">End Date</span>
            <span className={`date-val ${!endDate ? 'placeholder' : ''}`}>
              {endDate ? formatDisplayDate(endDate) : placeholderEnd}
            </span>
          </div>
        </div>

        {tripDuration > 0 && (
          <div className="date-duration-pill" title="Inclusive Trip Duration">
            {tripDuration} {tripDuration === 1 ? 'day' : 'days'}
          </div>
        )}

        {(startDate || endDate) && !disabled && (
          <button
            type="button"
            className="date-clear-btn"
            onClick={handleClear}
            title="Clear selected dates"
            aria-label="Clear dates"
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
