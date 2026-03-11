'use client';

import { useState, useCallback } from 'react';

export const useTable = (allData = []) => {
  const [selecteds, setSelecteds] = useState([]);

  const onSelectAll = useCallback((event) => {
    if (event.target.checked) {
      setSelecteds(allData.map((n) => n.id));
      return;
    }
    setSelecteds([]);
  }, [allData]);

  const onSelect = useCallback((id) => {
    setSelecteds((prev) => {
      const selectedIndex = prev.indexOf(id);
      let newSelected = [];

      if (selectedIndex === -1) {
        newSelected = newSelected.concat(prev, id);
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
  }, []);

  return {
    selecteds,
    setSelecteds,
    onSelect,
    onSelectAll,
  };
};
