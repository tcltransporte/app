'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';

export function useFilter({ initialFilters = {} }) {
  const [filters, setFilters] = useState(initialFilters);
  const [open, setOpen] = useState(false);

  // Sync with props
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [JSON.stringify(initialFilters)]);


  const activeCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      // Ignore internal system filters
      if (key === 'search' || key === 'typeHash' || key === 'companyId') return false;
      
      // Avoid double counting (e.g., partnerId and partner)
      if (key.endsWith('Id') && filters[key.replace('Id', '')]) return false;

      if (typeof value === 'boolean') return value === true;
      if (Array.isArray(value)) return value.length > 0;
      if (value && typeof value === 'object') return Object.keys(value).length > 0;
      
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
