'use client';

import React from 'react';
import BankMovementsList from './bank-movements-list';

export default function BanksView({ initialTable, selectedId, initialRange }) {
  return (
    <BankMovementsList
      title="Movimento Bancário"
      initialTable={initialTable}
      selectedId={selectedId}
      initialRange={initialRange}
    />
  );
}
