'use client';

import React, { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { PRESETS } from '@/components/common/RangeModal';

export function useRangeFilter(initialRange, dateFieldOptions = []) {
  const [range, setRange] = useState(initialRange || {
    start: '',
    end: '',
    field: dateFieldOptions?.[0]?.value || ''
  });
  const [open, setOpen] = useState(false);

  const label = useMemo(() => {
    if (!range.start && !range.end) return 'Hoje';

    const matchingPreset = PRESETS.find(p => {
      const { start: s, end: e } = p.getValue();
      return format(s, 'yyyy-MM-dd') === range.start && format(e, 'yyyy-MM-dd') === range.end;
    });

    if (matchingPreset) return matchingPreset.label;

    if (range.start && range.end) {
      const s = parseISO(range.start);
      const e = parseISO(range.end);
      return `${format(s, 'dd/MM/yyyy')} - ${format(e, 'dd/MM/yyyy')}`;
    }

    if (range.start) return `>= ${format(parseISO(range.start), 'dd/MM/yyyy')}`;
    if (range.end) return `<= ${format(parseISO(range.end), 'dd/MM/yyyy')}`;

    return 'Hoje';
  }, [range]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleApply = (newRange, callback) => {
    setRange(newRange);
    if (callback) callback(newRange);
  };

  return {
    range,
    setRange,
    open,
    setOpen,
    label,
    handleOpen,
    handleClose,
    handleApply
  };
}
