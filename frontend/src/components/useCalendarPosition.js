import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to calculate smart viewport positioning for calendar popovers.
 * Determines placement (bottom vs top) based on available screen space and
 * ensures horizontal boundaries are respected.
 */
export function useCalendarPosition(triggerRef, isOpen, estimatedHeight = 350, estimatedWidth = 320) {
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: 'bottom' });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;

    let placement = 'bottom';
    if (spaceBelow >= estimatedHeight) {
      placement = 'bottom';
    } else if (spaceAbove >= estimatedHeight) {
      placement = 'top';
    } else {
      placement = spaceBelow >= spaceAbove ? 'bottom' : 'top';
    }

    let top = 0;
    if (placement === 'bottom') {
      top = rect.bottom + 6;
      if (top + estimatedHeight > vh - 10) {
        top = Math.max(10, vh - estimatedHeight - 10);
      }
    } else {
      top = rect.top - estimatedHeight - 6;
      if (top < 10) {
        top = 10;
      }
    }

    let left = rect.left;
    if (left + estimatedWidth > vw - 16) {
      left = Math.max(16, vw - estimatedWidth - 16);
    }
    if (left < 16) {
      left = 16;
    }

    setCoords({ top, left, placement });
  }, [triggerRef, estimatedHeight, estimatedWidth]);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    // Use capture phase to track scroll on any parent container (e.g. scrollable modal)
    const handleUpdate = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isOpen, updatePosition]);

  return coords;
}
