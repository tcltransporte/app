'use client';

import React, { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook to manage standard list view state.
 * Includes pagination, search, loading, and selection.
 * 
 * @param {object} props
 * @param {object} props.initialData - Data pre-loaded by SSR
 * @param {string} props.rowKey - Primary key field name (default 'id')
 */
export const useTable = ({
  initialData,
  rowKey = 'id'
}) => {
  const [items, setItems] = useState(initialData?.items || []);
  const [total, setTotal] = useState(initialData?.total || 0);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selecteds, setSelecteds] = useState([]);

  const onSelectAll = useCallback((event) => {
    if (event.target.checked) {
      setSelecteds([...items]);
      return;
    }
    setSelecteds([]);
  }, [items]);

  const onSelect = useCallback((row) => {
    setSelecteds((prev) => {
      const selectedIndex = prev.findIndex(item => item[rowKey] === row[rowKey]);
      let newSelected = [];

      if (selectedIndex === -1) {
        newSelected = newSelected.concat(prev, row);
      } else if (selectedIndex === 0) {
        newSelected = newSelected.concat(prev.slice(1));
      } else if (selectedIndex === prev.length - 1) {
        newSelected = newSelected.concat(prev.slice(0, -1));
      } else if (selectedIndex > 0) {
        newSelected = newSelected.concat(
          prev.slice(0, selectedIndex),
          prev.slice(selectedIndex + 1),
        );
      }
      return newSelected;
    });
  }, [rowKey]);

  // Sync internal state if initialData changes
  useEffect(() => {
    if (initialData) {
      setItems(initialData.items || []);
      setTotal(initialData.total || 0);
    }
  }, [initialData]);

  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  };

  return {
    // State
    items,
    setItems,
    total,
    setTotal,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    loading,
    setLoading,
    search,
    setSearch,
    selecteds,
    setSelecteds,
    
    // Handlers
    onSelect,
    onSelectAll,
    handlePageChange,
    handleRowsPerPageChange,
  };
};
