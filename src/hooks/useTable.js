'use client';

import React, { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook to manage standard list view state.
 * Includes pagination, search, loading, and selection.
 * 
 * @param {object} props
 * @param {object} props.initialTable - Data pre-loaded by SSR
 * @param {string} props.rowKey - Primary key field name (default 'id')
 */
export const useTable = ({
  initialTable,
  rowKey = 'id'
}) => {
  const [items, setItems] = useState(initialTable?.items || []);
  const [total, setTotal] = useState(initialTable?.total || 0);
  const [page, setPage] = useState(initialTable?.page || 1);
  const [rowsPerPage, setRowsPerPage] = useState(initialTable?.limit || 50);
  const [loading, setLoading] = useState(false);
  const [selecteds, setSelecteds] = useState([]);
  const [sortBy, setSortBy] = useState(initialTable?.sortBy || null);
  const [sortOrder, setSortOrder] = useState(initialTable?.sortOrder || 'ASC');
  const [orderedColumns, setOrderedColumns] = useState([]);
  const [columnWidths, setColumnWidths] = useState({});

  const handleColumnResize = useCallback((field, width) => {
    setColumnWidths(prev => ({
      ...prev,
      [field]: width
    }));
  }, []);

  const handleSort = useCallback((property) => {
    const isAsc = sortBy === property && sortOrder === 'ASC';
    setSortOrder(isAsc ? 'DESC' : 'ASC');
    setSortBy(property);
    setPage(1);
  }, [sortBy, sortOrder]);

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

  // Sync internal state if initialTable changes
  useEffect(() => {
    if (initialTable) {
      setItems(initialTable.items || []);
      setTotal(initialTable.total || 0);
      if (initialTable.sortBy) setSortBy(initialTable.sortBy);
      if (initialTable.sortOrder) setSortOrder(initialTable.sortOrder);
      if (initialTable.page) setPage(initialTable.page);
      if (initialTable.limit) setRowsPerPage(initialTable.limit);
    }
  }, [initialTable]);

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
    selecteds,
    setSelecteds,
    
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    orderedColumns,
    setOrderedColumns,
    columnWidths,
    setColumnWidths,
    
    // Handlers
    onSelect,
    onSelectAll,
    handlePageChange,
    handleRowsPerPageChange,
    handleSort,
    handleColumnResize,
  };
};
