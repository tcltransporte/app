'use client';

import React from 'react';
import KnowledgeList from './knowledge-list';

export default function KnowledgeView({ initialTable, selectedId, initialFilters, initialRange, companyId }) {
  return (
    <KnowledgeList
      title="Conhecimentos de Transporte"
      initialTable={initialTable}
      selectedId={selectedId}
      initialFilters={initialFilters}
      initialRange={initialRange}
      companyId={companyId}
    />
  );
}
