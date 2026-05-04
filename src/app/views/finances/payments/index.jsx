'use client';

import React from 'react';
import FinanceEntriesList from '../finance-entries-list';

export default function PayableView({ operationType, initialTable, selectedId, initialRange, initialFilters }) {
  return (
    <FinanceEntriesList
      operationType={operationType}
      title="Contas a Pagar"
      initialTable={initialTable}
      selectedId={selectedId}
      initialRange={initialRange}
      initialFilters={initialFilters}
    />
  );
}
