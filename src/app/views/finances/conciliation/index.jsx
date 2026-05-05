'use client';

import React from 'react';
import ConciliationList from './conciliation-list';

export default function ConciliationView({ initialTable, selectedId, initialRange, initialBankAccounts }) {
  return (
    <ConciliationList
      initialTable={initialTable}
      selectedId={selectedId}
      initialRange={initialRange}
      initialBankAccounts={initialBankAccounts}
    />
  );
}
