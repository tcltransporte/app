'use client';

import React from 'react';
import CashClosureList from './cash-closure-list';

export default function CashClosureView({ initialTable, initialDate }) {
  return (
    <CashClosureList
      initialTable={initialTable}
      initialDate={initialDate}
    />
  );
}
