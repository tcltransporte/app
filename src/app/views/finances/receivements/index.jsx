'use client';

import React from 'react';
import FinanceEntriesList from '../finance-entries-list';

export default function ReceivableView({ operationType, initialTable, selectedId, initialRange }) {
  return (
    <FinanceEntriesList
      operationType={operationType}
      title="Contas a Receber"
      initialTable={initialTable}
      selectedId={selectedId}
      initialRange={initialRange}
    />
  );
}
