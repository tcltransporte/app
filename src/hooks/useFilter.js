'use client';

import { useState, useMemo, useCallback } from 'react';

export function useFilter(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [open, setOpen] = useState(false);

  const activeCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      // Ignore internal or empty values
      if (key === 'search') return false; // Usually search is treated separately or already visible
      if (typeof value === 'boolean') return value === true;
      return value !== '' && value !== undefined && value !== null;
    }).length;
  }, [filters]);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  const handleApply = useCallback((newFilters, callback) => {
    setFilters(newFilters);
    setOpen(false);
    if (callback) callback(newFilters);
  }, []);

  const handleSearch = useCallback((value, callback) => {
    setFilters(prev => {
      const updated = { ...prev, search: value };
      if (callback) callback(updated);
      return updated;
    });
  }, []);

  return {
    filters,
    setFilters,
    open,
    setOpen,
    activeCount,
    handleOpen,
    handleClose,
    handleApply,
    handleSearch
  };
}
