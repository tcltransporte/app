import React from 'react';
import FinanceEntriesList from '../finance-entries-list';

export default function ReceivableView({ operationType, initialTable, selectedId }) {
  return (
    <FinanceEntriesList
      operationType={operationType}
      title="Contas a Receber"
      initialTable={initialTable}
      selectedId={selectedId}
    />
  );
}
